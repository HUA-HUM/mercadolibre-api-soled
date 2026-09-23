import { Inject, Injectable } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/repositories/mercadolibre/http/IMeliHttpClient';
import { IMeliItemPublishRepository } from 'src/core/adapters/repositories/mercadolibre/items/IMeliItemPublishRepository';
import {
  CreatedMeliItem,
  ExistingMeliItem,
  MeliItemStatusResult,
} from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';
import { getMeliSellerId } from '../getSeller/getMeliSellerId';
import { MeliCreateItemPayload } from './mapper/MeliItemPayloadMapper';
import {
  MeliApiException,
  MeliErrorBody,
  MeliErrorCause,
} from '../http/error/MeliApiException';

const ACTIVE_ITEM_STATUSES = new Set(['active', 'paused']);

interface MeliCreateItemResponse {
  id: string;
  permalink: string;
  status: string;
  sub_status?: string[];
  warnings?: MeliErrorCause[];
}

interface MeliSearchBySkuResponse {
  results?: string[];
}

interface MeliItemDetailResponse {
  id: string;
  status: string;
  listing_type_id: string;
}

interface MeliItemStatusResponse {
  status: string;
  sub_status?: string[];
}

@Injectable()
export class MeliItemPublishRepository implements IMeliItemPublishRepository {
  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  async validate(
    payload: MeliCreateItemPayload,
  ): Promise<{ warnings: MeliErrorCause[] }> {
    try {
      await this.httpClient.post('/items/validate', payload);
      return { warnings: [] };
    } catch (error) {
      // ML returns HTTP 400 on /items/validate even when every cause is a
      // warning (e.g. shipping.lost_me1_by_user) — that's a valid item, not
      // a rejected one.
      if (error instanceof MeliApiException) {
        const body = error.getResponse() as MeliErrorBody;
        const hasRealError = body.cause.some((cause) => cause.type === 'error');
        if (body.source === 'meli' && !hasRealError) {
          return { warnings: body.cause };
        }
      }
      throw error;
    }
  }

  async findExistingBySku(sku: string): Promise<ExistingMeliItem[]> {
    const sellerId = getMeliSellerId();
    const query = new URLSearchParams({ seller_sku: sku });

    const search = await this.httpClient.get<MeliSearchBySkuResponse>(
      `/users/${sellerId}/items/search?${query.toString()}`,
    );

    const itemIds = search?.results ?? [];
    if (itemIds.length === 0) return [];

    const details = await Promise.all(
      itemIds.map((itemId) =>
        this.httpClient.get<MeliItemDetailResponse>(`/items/${itemId}`),
      ),
    );

    return details
      .filter((item): item is MeliItemDetailResponse => Boolean(item))
      .filter((item) => ACTIVE_ITEM_STATUSES.has(item.status))
      .map((item) => ({
        meli_item_id: item.id,
        listing_type_id: item.listing_type_id,
        status: item.status,
      }));
  }

  async create(
    payload: MeliCreateItemPayload,
    description: string,
  ): Promise<CreatedMeliItem> {
    // POST /items is never auto-retried: a timeout may have created the item
    // already, and retrying it would publish a duplicate.
    const created = await this.httpClient.post<MeliCreateItemResponse>(
      '/items',
      payload,
      undefined,
      { retryable: false },
    );

    const result: CreatedMeliItem = {
      meli_item_id: created.id,
      permalink: created.permalink,
      status: created.status,
      sub_status: created.sub_status ?? [],
      description_saved: false,
      description_error: null,
      warnings: created.warnings ?? [],
    };

    try {
      await this.httpClient.post(`/items/${created.id}/description`, {
        plain_text: description,
      });
      result.description_saved = true;
    } catch (error) {
      result.description_saved = false;
      result.description_error =
        error instanceof MeliApiException
          ? (error.getResponse() as MeliErrorBody)
          : null;
    }

    return result;
  }

  async update(
    itemId: string,
    payload: Record<string, unknown>,
  ): Promise<MeliItemStatusResult> {
    const updated = await this.httpClient.put<MeliItemStatusResponse>(
      `/items/${itemId}`,
      payload,
    );
    return { status: updated.status, sub_status: updated.sub_status ?? [] };
  }

  async updateDescription(itemId: string, description: string): Promise<void> {
    await this.httpClient.put(`/items/${itemId}/description`, {
      plain_text: description,
    });
  }

  async updateStatus(
    itemId: string,
    status: 'active' | 'paused' | 'closed',
  ): Promise<MeliItemStatusResult> {
    const updated = await this.httpClient.put<MeliItemStatusResponse>(
      `/items/${itemId}`,
      { status },
    );
    return { status: updated.status, sub_status: updated.sub_status ?? [] };
  }
}

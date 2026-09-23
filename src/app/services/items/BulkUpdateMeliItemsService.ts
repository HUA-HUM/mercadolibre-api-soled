import { Inject, Injectable } from '@nestjs/common';
import { BulkUpdateItemInputDto } from 'src/app/controllers/items/dto/BulkUpdateItemsDto';
import type { IMeliItemPublishRepository } from 'src/core/adapters/repositories/mercadolibre/items/IMeliItemPublishRepository';
import {
  MeliApiException,
  MeliErrorBody,
} from 'src/core/drivers/repositories/mercadolibre/http/error/MeliApiException';
import {
  BulkUpdateItemResult,
  BulkUpdateResponse,
} from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';

const BULK_CONCURRENCY = 5;

@Injectable()
export class BulkUpdateMeliItemsService {
  constructor(
    @Inject('IMeliItemPublishRepository')
    private readonly repo: IMeliItemPublishRepository,
  ) {}

  async execute(items: BulkUpdateItemInputDto[]): Promise<BulkUpdateResponse> {
    const results: BulkUpdateItemResult[] = [];

    for (let index = 0; index < items.length; index += BULK_CONCURRENCY) {
      const chunk = items.slice(index, index + BULK_CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map((item) => this.updateOne(item)),
      );
      results.push(...chunkResults);
    }

    const ok = results.filter((result) => result.ok).length;

    return { ok, failed: results.length - ok, results };
  }

  private async updateOne(
    item: BulkUpdateItemInputDto,
  ): Promise<BulkUpdateItemResult> {
    const payload: Record<string, unknown> = {};
    if (item.price !== undefined) payload.price = item.price;
    if (item.available_quantity !== undefined) {
      payload.available_quantity = item.available_quantity;
    }

    try {
      await this.repo.update(item.meli_item_id, payload);
      return { meli_item_id: item.meli_item_id, ok: true };
    } catch (error) {
      return {
        meli_item_id: item.meli_item_id,
        ok: false,
        error:
          error instanceof MeliApiException
            ? (error.getResponse() as MeliErrorBody)
            : undefined,
      };
    }
  }
}

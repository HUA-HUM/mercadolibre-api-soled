import { Inject, Injectable } from '@nestjs/common';
import { CreateItemDto } from 'src/app/controllers/items/dto/CreateItemDto';
import type { IMeliItemPublishRepository } from 'src/core/adapters/repositories/mercadolibre/items/IMeliItemPublishRepository';
import {
  MeliApiException,
  MeliErrorBody,
} from 'src/core/drivers/repositories/mercadolibre/http/error/MeliApiException';
import { toMeliCreatePayload } from 'src/core/drivers/repositories/mercadolibre/items/mapper/MeliItemPayloadMapper';
import {
  CreateItemResponse,
  ItemPublishResult,
  ValidateItemResponse,
  ValidateItemResult,
} from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';
import {
  isMeliListingType,
  resolveListingTypes,
} from 'src/core/entitis/mercadolibre/items/MeliListingType';

@Injectable()
export class PublishMeliItemService {
  constructor(
    @Inject('IMeliItemPublishRepository')
    private readonly repo: IMeliItemPublishRepository,
  ) {}

  async validate(dto: CreateItemDto): Promise<ValidateItemResponse> {
    const results: Partial<Record<string, ValidateItemResult>> = {};
    const listingTypes = resolveListingTypes(dto.listing_types);

    for (const listingType of listingTypes) {
      const payload = toMeliCreatePayload(dto, listingType);
      try {
        const { warnings } = await this.repo.validate(payload);
        results[listingType] = { valid: true, warnings };
      } catch (error) {
        if (!(error instanceof MeliApiException)) throw error;
        results[listingType] = {
          valid: false,
          error: error.getResponse() as ValidateItemResult['error'],
        };
      }
    }

    return { sku: dto.sku, results };
  }

  async create(dto: CreateItemDto): Promise<CreateItemResponse> {
    const listingTypes = resolveListingTypes(dto.listing_types);
    const existing = await this.repo.findExistingBySku(dto.sku);
    const existingByType = new Map(
      existing.map((item) => [item.listing_type_id, item]),
    );

    // El conflicto se mira solo sobre lo pedido: si ya existe la premium y se
    // pide solo la clasica, hay que crear la clasica.
    const allTypesAlreadyExist = listingTypes.every((listingType) =>
      existingByType.has(listingType),
    );
    if (allTypesAlreadyExist) {
      throw MeliApiException.skuConflict(
        dto.sku,
        existing.filter(
          (item) =>
            isMeliListingType(item.listing_type_id) &&
            listingTypes.includes(item.listing_type_id),
        ),
      );
    }

    const results: Partial<Record<string, ItemPublishResult>> = {};

    for (const listingType of listingTypes) {
      const existingItem = existingByType.get(listingType);
      if (existingItem) {
        results[listingType] = {
          ok: false,
          conflict: true,
          meli_item_id: existingItem.meli_item_id,
        };
        continue;
      }

      const payload = toMeliCreatePayload(dto, listingType);
      try {
        const created = await this.repo.create(payload, dto.description);
        results[listingType] = { ok: true, ...created };
      } catch (error) {
        if (!(error instanceof MeliApiException)) throw error;
        results[listingType] = {
          ok: false,
          error: error.getResponse() as MeliErrorBody,
        };
      }
    }

    return { sku: dto.sku, results };
  }
}

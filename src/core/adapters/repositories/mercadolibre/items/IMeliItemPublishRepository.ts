import { MeliCreateItemPayload } from 'src/core/drivers/repositories/mercadolibre/items/mapper/MeliItemPayloadMapper';
import {
  CreatedMeliItem,
  ExistingMeliItem,
} from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';

export interface IMeliItemPublishRepository {
  /** Throws MeliApiException (422) when ML rejects the payload. Resolves on valid. */
  validate(payload: MeliCreateItemPayload): Promise<void>;

  /** Active/paused items already published for this SKU, across all listing types. */
  findExistingBySku(sku: string): Promise<ExistingMeliItem[]>;

  create(
    payload: MeliCreateItemPayload,
    description: string,
  ): Promise<CreatedMeliItem>;
}

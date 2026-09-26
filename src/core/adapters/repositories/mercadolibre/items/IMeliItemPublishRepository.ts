import { MeliCreateItemPayload } from 'src/core/drivers/repositories/mercadolibre/items/mapper/MeliItemPayloadMapper';
import { MeliErrorCause } from 'src/core/drivers/repositories/mercadolibre/http/error/MeliApiException';
import {
  CreatedMeliItem,
  ExistingMeliItem,
  MeliItemStatusResult,
  MeliItemUpdateSnapshot,
} from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';

export interface IMeliItemPublishRepository {
  /**
   * Throws MeliApiException (422) when ML actually rejects the payload.
   * Resolves (with any warnings) when valid — including ML's HTTP 400 that
   * only carries warning-type causes.
   */
  validate(
    payload: MeliCreateItemPayload,
  ): Promise<{ warnings: MeliErrorCause[] }>;

  /** Active/paused items already published for this SKU, across all listing types. */
  findExistingBySku(sku: string): Promise<ExistingMeliItem[]>;

  create(
    payload: MeliCreateItemPayload,
    description: string,
  ): Promise<CreatedMeliItem>;

  /** Resolves with what ML's response says is loaded, so callers can check it took effect. */
  update(
    itemId: string,
    payload: Record<string, unknown>,
  ): Promise<MeliItemUpdateSnapshot>;

  updateDescription(itemId: string, description: string): Promise<void>;

  updateStatus(
    itemId: string,
    status: 'active' | 'paused' | 'closed',
  ): Promise<MeliItemStatusResult>;
}

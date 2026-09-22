import { MeliErrorBody, MeliErrorCause } from 'src/core/drivers/repositories/mercadolibre/http/error/MeliApiException';

export interface ExistingMeliItem {
  meli_item_id: string;
  listing_type_id: string;
  status: string;
}

export interface CreatedMeliItem {
  meli_item_id: string;
  permalink: string;
  status: string;
  sub_status: string[];
  description_saved: boolean;
  description_error: MeliErrorBody | null;
  warnings: MeliErrorCause[];
}

export type ItemPublishResult =
  | ({ ok: true } & CreatedMeliItem)
  | { ok: false; conflict: true; meli_item_id: string }
  | { ok: false; conflict?: false; error: MeliErrorBody };

export interface CreateItemResponse {
  sku: string;
  results: Partial<Record<string, ItemPublishResult>>;
}

export interface ValidateItemResult {
  valid: boolean;
  error?: MeliErrorBody;
}

export interface ValidateItemResponse {
  sku: string;
  results: Partial<Record<string, ValidateItemResult>>;
}

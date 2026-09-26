import {
  MeliErrorBody,
  MeliErrorCause,
} from 'src/core/drivers/repositories/mercadolibre/http/error/MeliApiException';

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
  warnings?: MeliErrorCause[];
  error?: MeliErrorBody;
}

export interface ValidateItemResponse {
  sku: string;
  results: Partial<Record<string, ValidateItemResult>>;
}

export interface MeliItemStatusResult {
  status: string;
  sub_status: string[];
}

/** Price/stock as sent by the client (only the keys that were sent). */
export interface RequestedPriceStock {
  price?: number;
  available_quantity?: number;
}

/** Same keys as requested, read back from ML's response; null if ML didn't return them. */
export interface AppliedPriceStock {
  price?: number | null;
  available_quantity?: number | null;
}

/** What ML's PUT /items/{id} response says was actually loaded. */
export interface MeliItemUpdateSnapshot extends MeliItemStatusResult {
  price: unknown;
  available_quantity: unknown;
}

export interface MeliItemUpdateResult extends MeliItemStatusResult {
  meli_item_id: string;
  requested: RequestedPriceStock;
  applied: AppliedPriceStock;
  /** true only if every requested field came back from ML with the requested value. */
  changed: boolean;
}

export interface BulkUpdateItemResult {
  meli_item_id: string;
  /** The call to ML did not fail. */
  ok: boolean;
  /** The requested value is actually what ML has loaded. Only present when ok. */
  changed?: boolean;
  requested?: RequestedPriceStock;
  applied?: AppliedPriceStock;
  status?: string;
  error?: MeliErrorBody;
}

export interface BulkUpdateResponse {
  ok: number;
  changed: number;
  failed: number;
  results: BulkUpdateItemResult[];
}

import {
  AppliedPriceStock,
  MeliItemUpdateResult,
  MeliItemUpdateSnapshot,
  RequestedPriceStock,
} from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';

// ML answers 200 to a PUT even when it ignores a value (variations, catalog
// listings, paused/closed items, price caps), so what the client asked for
// and what ML actually loaded have to be compared explicitly.

/** ML may send numbers as strings; anything non-numeric (or missing) is null. */
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function pickRequestedPriceStock(fields: {
  price?: number;
  available_quantity?: number;
}): RequestedPriceStock {
  const requested: RequestedPriceStock = {};
  if (fields.price !== undefined) requested.price = fields.price;
  if (fields.available_quantity !== undefined) {
    requested.available_quantity = fields.available_quantity;
  }
  return requested;
}

export function buildUpdateOutcome(
  itemId: string,
  requested: RequestedPriceStock,
  snapshot: MeliItemUpdateSnapshot,
): MeliItemUpdateResult {
  const applied: AppliedPriceStock = {};
  let changed = true;

  if (requested.price !== undefined) {
    applied.price = toNumberOrNull(snapshot.price);
    // Prices are published in whole pesos, so compare rounded.
    if (
      applied.price === null ||
      Math.round(applied.price) !== Math.round(requested.price)
    ) {
      changed = false;
    }
  }

  if (requested.available_quantity !== undefined) {
    applied.available_quantity = toNumberOrNull(snapshot.available_quantity);
    if (applied.available_quantity !== requested.available_quantity) {
      changed = false;
    }
  }

  return {
    meli_item_id: itemId,
    status: snapshot.status,
    sub_status: snapshot.sub_status,
    requested,
    applied,
    changed,
  };
}

export type MeliListingType = 'gold_special' | 'gold_pro';

/** Los tipos que se publican cuando el cliente no elige ninguno. */
export const MELI_LISTING_TYPES: MeliListingType[] = [
  'gold_special',
  'gold_pro',
];

export function isMeliListingType(value: string): value is MeliListingType {
  return (MELI_LISTING_TYPES as string[]).includes(value);
}

/**
 * Los tipos pedidos, respetando el orden canonico y sin repetidos. Si no se
 * pide nada, se publican todos: es el comportamiento historico.
 */
export function resolveListingTypes(requested?: string[]): MeliListingType[] {
  if (!requested || requested.length === 0) return MELI_LISTING_TYPES;
  return MELI_LISTING_TYPES.filter((listingType) =>
    requested.includes(listingType),
  );
}

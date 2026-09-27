import {
  MELI_LISTING_TYPES,
  isMeliListingType,
  resolveListingTypes,
} from './MeliListingType';

describe('resolveListingTypes', () => {
  it('sin pedido devuelve los dos', () => {
    expect(resolveListingTypes()).toEqual(MELI_LISTING_TYPES);
    expect(resolveListingTypes([])).toEqual(MELI_LISTING_TYPES);
  });

  it('devuelve solo lo pedido', () => {
    expect(resolveListingTypes(['gold_special'])).toEqual(['gold_special']);
    expect(resolveListingTypes(['gold_pro'])).toEqual(['gold_pro']);
  });

  it('respeta el orden canónico y saca repetidos', () => {
    expect(
      resolveListingTypes(['gold_pro', 'gold_special', 'gold_pro']),
    ).toEqual(['gold_special', 'gold_pro']);
  });

  it('ignora lo que no sea un tipo válido', () => {
    expect(resolveListingTypes(['gold_special', 'inventado'])).toEqual([
      'gold_special',
    ]);
  });
});

describe('isMeliListingType', () => {
  it('reconoce los dos tipos', () => {
    expect(isMeliListingType('gold_special')).toBe(true);
    expect(isMeliListingType('gold_pro')).toBe(true);
    expect(isMeliListingType('free')).toBe(false);
  });
});

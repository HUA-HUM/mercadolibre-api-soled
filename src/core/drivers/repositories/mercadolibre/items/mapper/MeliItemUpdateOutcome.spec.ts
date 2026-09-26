import { MeliItemUpdateSnapshot } from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';
import {
  buildUpdateOutcome,
  pickRequestedPriceStock,
} from './MeliItemUpdateOutcome';

function snapshot(
  overrides: Partial<MeliItemUpdateSnapshot> = {},
): MeliItemUpdateSnapshot {
  return {
    status: 'active',
    sub_status: [],
    price: undefined,
    available_quantity: undefined,
    ...overrides,
  };
}

describe('pickRequestedPriceStock', () => {
  it('keeps only the keys that were sent', () => {
    expect(pickRequestedPriceStock({ price: 5600 })).toEqual({ price: 5600 });
    expect(pickRequestedPriceStock({ available_quantity: 0 })).toEqual({
      available_quantity: 0,
    });
    expect(pickRequestedPriceStock({})).toEqual({});
  });
});

describe('buildUpdateOutcome', () => {
  it('reports changed: true when ML returns the requested price and stock', () => {
    const outcome = buildUpdateOutcome(
      'MLA1',
      { price: 5600, available_quantity: 900 },
      snapshot({ price: 5600, available_quantity: 900 }),
    );

    expect(outcome).toEqual({
      meli_item_id: 'MLA1',
      status: 'active',
      sub_status: [],
      requested: { price: 5600, available_quantity: 900 },
      applied: { price: 5600, available_quantity: 900 },
      changed: true,
    });
  });

  it('only includes price in requested/applied when only price was sent', () => {
    const outcome = buildUpdateOutcome(
      'MLA1',
      { price: 5600 },
      snapshot({ price: 5600, available_quantity: 12 }),
    );

    expect(outcome.requested).toEqual({ price: 5600 });
    expect(outcome.applied).toEqual({ price: 5600 });
    expect(outcome.changed).toBe(true);
  });

  it("reports changed: false and shows ML's value when ML returns a different price", () => {
    const outcome = buildUpdateOutcome(
      'MLA1',
      { price: 5600 },
      snapshot({ price: 5000 }),
    );

    expect(outcome.requested).toEqual({ price: 5600 });
    expect(outcome.applied).toEqual({ price: 5000 });
    expect(outcome.changed).toBe(false);
  });

  it('reports changed: false when ML returns a different stock', () => {
    const outcome = buildUpdateOutcome(
      'MLA1',
      { available_quantity: 900 },
      snapshot({ available_quantity: 12 }),
    );

    expect(outcome.applied).toEqual({ available_quantity: 12 });
    expect(outcome.changed).toBe(false);
  });

  it('puts null in applied and reports changed: false when ML does not return the field', () => {
    const outcome = buildUpdateOutcome(
      'MLA1',
      { available_quantity: 900 },
      snapshot({ available_quantity: undefined }),
    );

    expect(outcome.applied).toEqual({ available_quantity: null });
    expect(outcome.changed).toBe(false);
  });

  it('compares numbers, not strings: a price returned as a string still matches', () => {
    const outcome = buildUpdateOutcome(
      'MLA1',
      { price: 5600, available_quantity: 900 },
      snapshot({ price: '5600', available_quantity: '900' }),
    );

    expect(outcome.applied).toEqual({ price: 5600, available_quantity: 900 });
    expect(outcome.changed).toBe(true);
  });

  it("compares the price rounded to whole pesos, but keeps ML's exact value in applied", () => {
    const same = buildUpdateOutcome(
      'MLA1',
      { price: 23372 },
      snapshot({ price: 23372.4 }),
    );
    expect(same.applied.price).toBe(23372.4);
    expect(same.changed).toBe(true);

    const different = buildUpdateOutcome(
      'MLA1',
      { price: 23372 },
      snapshot({ price: 23373 }),
    );
    expect(different.changed).toBe(false);
  });

  it('is changed: false if any one of several requested fields did not take effect', () => {
    const outcome = buildUpdateOutcome(
      'MLA1',
      { price: 5600, available_quantity: 900 },
      snapshot({ price: 5600, available_quantity: 12 }),
    );

    expect(outcome.changed).toBe(false);
  });

  it('treats a non-numeric value from ML as null', () => {
    const outcome = buildUpdateOutcome(
      'MLA1',
      { price: 5600 },
      snapshot({ price: 'abc' }),
    );

    expect(outcome.applied).toEqual({ price: null });
    expect(outcome.changed).toBe(false);
  });

  it('has nothing to compare when neither price nor stock was requested', () => {
    const outcome = buildUpdateOutcome('MLA1', {}, snapshot());

    expect(outcome.requested).toEqual({});
    expect(outcome.applied).toEqual({});
    expect(outcome.changed).toBe(true);
  });
});

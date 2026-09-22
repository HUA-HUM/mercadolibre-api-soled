import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  BulkUpdateItemsDto,
  resolveBulkUpdateItems,
} from './BulkUpdateItemsDto';

describe('resolveBulkUpdateItems', () => {
  it('returns items as-is when the body uses the array shape', () => {
    const dto = new BulkUpdateItemsDto();
    dto.items = [{ meli_item_id: 'MLA1', price: 100 }];

    expect(resolveBulkUpdateItems(dto)).toEqual([
      { meli_item_id: 'MLA1', price: 100 },
    ]);
  });

  it('wraps a flat single item into a one-element array', () => {
    const dto = new BulkUpdateItemsDto();
    dto.meli_item_id = 'MLA1';
    dto.price = 5600;
    dto.available_quantity = 900;

    expect(resolveBulkUpdateItems(dto)).toEqual([
      { meli_item_id: 'MLA1', price: 5600, available_quantity: 900 },
    ]);
  });

  it('prefers items over the flat fields when both are sent', () => {
    const dto = new BulkUpdateItemsDto();
    dto.items = [{ meli_item_id: 'MLA_FROM_ITEMS' }];
    dto.meli_item_id = 'MLA_FLAT';

    expect(resolveBulkUpdateItems(dto)).toEqual([
      { meli_item_id: 'MLA_FROM_ITEMS' },
    ]);
  });
});

describe('BulkUpdateItemsDto validation', () => {
  it('accepts a flat single item without items', async () => {
    const dto = plainToInstance(BulkUpdateItemsDto, {
      meli_item_id: 'MLA1',
      price: 100,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts the items array shape', async () => {
    const dto = plainToInstance(BulkUpdateItemsDto, {
      items: [{ meli_item_id: 'MLA1', price: 100 }],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty body (neither items nor meli_item_id)', async () => {
    const dto = plainToInstance(BulkUpdateItemsDto, {});

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'meli_item_id')).toBe(true);
  });

  it('rejects an empty items array', async () => {
    const dto = plainToInstance(BulkUpdateItemsDto, { items: [] });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'items')).toBe(true);
  });
});

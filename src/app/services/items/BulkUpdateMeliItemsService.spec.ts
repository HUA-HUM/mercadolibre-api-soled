import { BulkUpdateItemInputDto } from 'src/app/controllers/items/dto/BulkUpdateItemsDto';
import type { IMeliItemPublishRepository } from 'src/core/adapters/repositories/mercadolibre/items/IMeliItemPublishRepository';
import { MeliApiException } from 'src/core/drivers/repositories/mercadolibre/http/error/MeliApiException';
import { BulkUpdateMeliItemsService } from './BulkUpdateMeliItemsService';

function item(
  meli_item_id: string,
  fields: { price?: number; available_quantity?: number },
): BulkUpdateItemInputDto {
  return Object.assign(new BulkUpdateItemInputDto(), {
    meli_item_id,
    ...fields,
  });
}

describe('BulkUpdateMeliItemsService.execute', () => {
  it('reports ok and changed per item, and counts them separately', async () => {
    const update = jest.fn((id: string) => {
      if (id === 'MLA_APPLIED') {
        return Promise.resolve({
          status: 'active',
          sub_status: [],
          price: 5600,
        });
      }
      if (id === 'MLA_IGNORED') {
        return Promise.resolve({
          status: 'paused',
          sub_status: [],
          price: 100,
        });
      }
      return Promise.reject(
        MeliApiException.fromMeliError(404, 'item_not_found', 'not found'),
      );
    });
    const service = new BulkUpdateMeliItemsService({
      update,
    } as unknown as IMeliItemPublishRepository);

    const response = await service.execute([
      item('MLA_APPLIED', { price: 5600 }),
      item('MLA_IGNORED', { price: 5600 }),
      item('MLA_GONE', { price: 5600 }),
    ]);

    expect(response.ok).toBe(2);
    expect(response.changed).toBe(1);
    expect(response.failed).toBe(1);

    expect(response.results[0]).toEqual({
      meli_item_id: 'MLA_APPLIED',
      ok: true,
      changed: true,
      requested: { price: 5600 },
      applied: { price: 5600 },
      status: 'active',
    });
    expect(response.results[1]).toEqual({
      meli_item_id: 'MLA_IGNORED',
      ok: true,
      changed: false,
      requested: { price: 5600 },
      applied: { price: 100 },
      status: 'paused',
    });
  });

  it('leaves failed items as before: ok false with their error, and no changed', async () => {
    const update = jest
      .fn()
      .mockRejectedValue(
        MeliApiException.fromMeliError(404, 'item_not_found', 'not found'),
      );
    const service = new BulkUpdateMeliItemsService({
      update,
    } as unknown as IMeliItemPublishRepository);

    const { results } = await service.execute([item('MLA_GONE', { price: 1 })]);

    expect(results[0].ok).toBe(false);
    expect(results[0].error).toMatchObject({ status: 404, source: 'meli' });
    expect(results[0]).not.toHaveProperty('changed');
  });

  it('only requests the fields each item carried', async () => {
    const update = jest
      .fn()
      .mockResolvedValue({ status: 'active', sub_status: [], price: 10 });
    const service = new BulkUpdateMeliItemsService({
      update,
    } as unknown as IMeliItemPublishRepository);

    const { results } = await service.execute([item('MLA1', { price: 10 })]);

    expect(update).toHaveBeenCalledWith('MLA1', { price: 10 });
    expect(results[0].requested).toEqual({ price: 10 });
    expect(results[0].applied).toEqual({ price: 10 });
  });
});

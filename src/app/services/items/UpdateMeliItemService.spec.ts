import { BadRequestException } from '@nestjs/common';
import { UpdateItemDto } from 'src/app/controllers/items/dto/UpdateItemDto';
import type { IMeliItemPublishRepository } from 'src/core/adapters/repositories/mercadolibre/items/IMeliItemPublishRepository';
import { MeliItemUpdateSnapshot } from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';
import { UpdateMeliItemService } from './UpdateMeliItemService';

function buildService(snapshot: Partial<MeliItemUpdateSnapshot> = {}) {
  const update = jest.fn().mockResolvedValue({
    status: 'active',
    sub_status: [],
    ...snapshot,
  });
  const repo = { update } as unknown as IMeliItemPublishRepository;
  return { service: new UpdateMeliItemService(repo), update };
}

describe('UpdateMeliItemService.update', () => {
  it('returns requested, applied and changed alongside status', async () => {
    const { service } = buildService({ price: 5600, available_quantity: 900 });
    const dto = new UpdateItemDto();
    dto.price = 5600;
    dto.available_quantity = 900;

    await expect(service.update('MLA1', dto)).resolves.toEqual({
      meli_item_id: 'MLA1',
      status: 'active',
      sub_status: [],
      requested: { price: 5600, available_quantity: 900 },
      applied: { price: 5600, available_quantity: 900 },
      changed: true,
    });
  });

  it('only reports price when only price was sent', async () => {
    const { service, update } = buildService({
      price: 5600,
      available_quantity: 12,
    });
    const dto = new UpdateItemDto();
    dto.price = 5600;

    const result = await service.update('MLA1', dto);

    expect(update).toHaveBeenCalledWith('MLA1', { price: 5600 });
    expect(result.requested).toEqual({ price: 5600 });
    expect(result.applied).toEqual({ price: 5600 });
  });

  it('reports what ML has, not what was asked, when ML answers 200 with a different price', async () => {
    const { service } = buildService({ price: 5000 });
    const dto = new UpdateItemDto();
    dto.price = 5600;

    const result = await service.update('MLA1', dto);

    expect(result.changed).toBe(false);
    expect(result.applied).toEqual({ price: 5000 });
    expect(result.requested).toEqual({ price: 5600 });
  });

  it('reports null and changed: false when ML does not return available_quantity', async () => {
    const { service } = buildService({ price: undefined });
    const dto = new UpdateItemDto();
    dto.available_quantity = 900;

    const result = await service.update('MLA1', dto);

    expect(result.applied).toEqual({ available_quantity: null });
    expect(result.changed).toBe(false);
  });

  it('still rejects an empty body with 400 before calling ML', async () => {
    const { service, update } = buildService();

    await expect(
      service.update('MLA1', new UpdateItemDto()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('lets ML errors through unchanged', async () => {
    const { service, update } = buildService();
    const error = new Error('ML said no');
    update.mockRejectedValue(error);
    const dto = new UpdateItemDto();
    dto.price = 1;

    await expect(service.update('MLA1', dto)).rejects.toBe(error);
  });
});

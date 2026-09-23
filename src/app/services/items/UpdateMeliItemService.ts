import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UpdateItemDto } from 'src/app/controllers/items/dto/UpdateItemDto';
import { MeliItemStatus } from 'src/app/controllers/items/dto/UpdateStatusDto';
import type { IMeliItemPublishRepository } from 'src/core/adapters/repositories/mercadolibre/items/IMeliItemPublishRepository';
import { toMeliUpdatePayload } from 'src/core/drivers/repositories/mercadolibre/items/mapper/MeliItemPayloadMapper';
import { MeliItemStatusResult } from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';

@Injectable()
export class UpdateMeliItemService {
  constructor(
    @Inject('IMeliItemPublishRepository')
    private readonly repo: IMeliItemPublishRepository,
  ) {}

  async update(
    itemId: string,
    dto: UpdateItemDto,
  ): Promise<MeliItemStatusResult> {
    const payload = toMeliUpdatePayload(dto);

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('At least one field is required');
    }

    return this.repo.update(itemId, payload);
  }

  async updateDescription(
    itemId: string,
    description: string,
  ): Promise<{ meli_item_id: string; description_saved: true }> {
    await this.repo.updateDescription(itemId, description);
    return { meli_item_id: itemId, description_saved: true };
  }

  async updateStatus(
    itemId: string,
    status: MeliItemStatus,
  ): Promise<MeliItemStatusResult> {
    return this.repo.updateStatus(itemId, status);
  }
}

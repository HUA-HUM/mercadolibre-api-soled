import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UpdateItemDto } from 'src/app/controllers/items/dto/UpdateItemDto';
import { MeliItemStatus } from 'src/app/controllers/items/dto/UpdateStatusDto';
import type { IMeliItemPublishRepository } from 'src/core/adapters/repositories/mercadolibre/items/IMeliItemPublishRepository';
import { toMeliUpdatePayload } from 'src/core/drivers/repositories/mercadolibre/items/mapper/MeliItemPayloadMapper';
import {
  buildUpdateOutcome,
  pickRequestedPriceStock,
} from 'src/core/drivers/repositories/mercadolibre/items/mapper/MeliItemUpdateOutcome';
import {
  MeliItemStatusResult,
  MeliItemUpdateResult,
} from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';

@Injectable()
export class UpdateMeliItemService {
  constructor(
    @Inject('IMeliItemPublishRepository')
    private readonly repo: IMeliItemPublishRepository,
  ) {}

  async update(
    itemId: string,
    dto: UpdateItemDto,
  ): Promise<MeliItemUpdateResult> {
    const payload = toMeliUpdatePayload(dto);

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('At least one field is required');
    }

    const snapshot = await this.repo.update(itemId, payload);

    return buildUpdateOutcome(itemId, pickRequestedPriceStock(dto), snapshot);
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

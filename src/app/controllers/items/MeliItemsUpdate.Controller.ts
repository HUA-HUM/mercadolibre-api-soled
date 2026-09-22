import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from 'src/app/guards/InternalApiKeyGuard';
import { UpdateMeliItemService } from 'src/app/services/items/UpdateMeliItemService';
import { MeliItemStatusResult } from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';
import { UpdateDescriptionDto } from './dto/UpdateDescriptionDto';
import { UpdateItemDto } from './dto/UpdateItemDto';
import { UpdateStatusDto } from './dto/UpdateStatusDto';

@ApiTags('MercadoLibre - Items')
@ApiSecurity('x-internal-api-key')
@UseGuards(InternalApiKeyGuard)
@Controller('meli/items')
export class MeliItemsUpdateController {
  constructor(private readonly service: UpdateMeliItemService) {}

  @Put(':itemId')
  @ApiParam({ name: 'itemId', example: 'MLA1234567890' })
  @ApiOperation({
    summary: 'Cambia precio, stock, título, fotos o atributos',
    description: `
⚠️ **Endpoint interno**

Body parcial: solo se mandan a ML los campos presentes. Si no viene
ninguno, responde 400 antes de llamar a ML. Opera sobre un único
\`meli_item_id\` (llamar dos veces si hay que sincronizar los dos listing
types de un SKU).
    `,
  })
  update(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
  ): Promise<MeliItemStatusResult> {
    return this.service.update(itemId, dto);
  }

  @Put(':itemId/description')
  @ApiParam({ name: 'itemId', example: 'MLA1234567890' })
  @ApiOperation({ summary: 'Reemplaza la descripción de la publicación' })
  updateDescription(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateDescriptionDto,
  ) {
    return this.service.updateDescription(itemId, dto.description);
  }

  @Put(':itemId/status')
  @ApiParam({ name: 'itemId', example: 'MLA1234567890' })
  @ApiOperation({ summary: 'Pausa, activa o cierra la publicación' })
  updateStatus(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<MeliItemStatusResult> {
    return this.service.updateStatus(itemId, dto.status);
  }
}

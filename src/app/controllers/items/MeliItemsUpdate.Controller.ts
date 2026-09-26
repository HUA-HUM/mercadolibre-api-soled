import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { InternalApiKeyGuard } from 'src/app/guards/InternalApiKeyGuard';
import { UpdateMeliItemService } from 'src/app/services/items/UpdateMeliItemService';
import {
  MeliItemStatusResult,
  MeliItemUpdateResult,
} from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';
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

**El 200 no garantiza que ML haya aplicado el cambio.** ML puede aceptar
el PUT e ignorar el valor (ítems con variaciones, de catálogo, pausados o
cerrados, topes de precio). Por eso la respuesta trae:
- \`requested\`: \`price\` / \`available_quantity\` tal cual se mandaron
  (solo los que vinieron en el body).
- \`applied\`: esos mismos campos, leídos de la respuesta de ML (lo que
  quedó realmente cargado); \`null\` si ML no lo devuelve.
- \`changed\`: \`true\` solo si todos los campos de \`requested\` coinciden
  con \`applied\` (números; el precio se compara redondeado al entero).
  Si el body no trae ni \`price\` ni \`available_quantity\`, no hay nada
  que comparar y queda en \`true\`.
    `,
  })
  @ApiOkResponse({
    description: 'Estado del ítem y qué quedó realmente aplicado',
    schema: {
      example: {
        meli_item_id: 'MLA1234567890',
        status: 'active',
        sub_status: [],
        requested: { price: 5600, available_quantity: 900 },
        applied: { price: 5600, available_quantity: 900 },
        changed: true,
      },
    },
  })
  update(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
  ): Promise<MeliItemUpdateResult> {
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

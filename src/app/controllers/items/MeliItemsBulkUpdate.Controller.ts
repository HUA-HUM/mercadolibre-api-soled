import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from 'src/app/guards/InternalApiKeyGuard';
import { BulkUpdateMeliItemsService } from 'src/app/services/items/BulkUpdateMeliItemsService';
import { BulkUpdateResponse } from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';
import {
  BulkUpdateItemsDto,
  resolveBulkUpdateItems,
} from './dto/BulkUpdateItemsDto';

@ApiTags('MercadoLibre - Items')
@ApiSecurity('x-internal-api-key')
@UseGuards(InternalApiKeyGuard)
@Controller('meli/items')
export class MeliItemsBulkUpdateController {
  constructor(private readonly service: BulkUpdateMeliItemsService) {}

  @Post('bulk-update')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Actualiza precio y stock de uno o muchos ítems (hasta 500)',
    description: `
⚠️ **Endpoint interno**

Reemplaza al \`/listings/update\` que coresa-api ya espera. Acepta dos
formas de body:
- \`{ "items": [{ "meli_item_id", "price"?, "available_quantity"? }, ...] }\`
  para varios (hasta 500, procesados de a 5 en paralelo).
- \`{ "meli_item_id", "price"?, "available_quantity"? }\` para uno solo,
  sin envolver en array.

Un ítem que falla no corta al resto: siempre responde 200 con el
resultado de cada uno.
    `,
  })
  bulkUpdate(@Body() dto: BulkUpdateItemsDto): Promise<BulkUpdateResponse> {
    return this.service.execute(resolveBulkUpdateItems(dto));
  }
}

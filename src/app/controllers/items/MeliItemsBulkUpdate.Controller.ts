import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from 'src/app/guards/InternalApiKeyGuard';
import { BulkUpdateMeliItemsService } from 'src/app/services/items/BulkUpdateMeliItemsService';
import { BulkUpdateResponse } from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';
import { BulkUpdateItemsDto } from './dto/BulkUpdateItemsDto';

@ApiTags('MercadoLibre - Items')
@ApiSecurity('x-internal-api-key')
@UseGuards(InternalApiKeyGuard)
@Controller('meli/items')
export class MeliItemsBulkUpdateController {
  constructor(private readonly service: BulkUpdateMeliItemsService) {}

  @Post('bulk-update')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Actualiza precio y stock de muchos ítems (hasta 500)',
    description: `
⚠️ **Endpoint interno**

Reemplaza al \`/listings/update\` que coresa-api ya espera. Procesa de a 5
en paralelo. Un ítem que falla no corta al resto: siempre responde 200 con
el resultado de cada uno.
    `,
  })
  bulkUpdate(@Body() dto: BulkUpdateItemsDto): Promise<BulkUpdateResponse> {
    return this.service.execute(dto.items);
  }
}

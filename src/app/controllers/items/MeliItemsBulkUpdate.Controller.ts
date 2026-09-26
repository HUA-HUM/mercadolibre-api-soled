import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
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

Cada resultado distingue dos cosas: \`ok\` (la llamada a ML no falló) y
\`changed\` (el valor pedido quedó realmente aplicado, según lo que
devuelve ML; \`requested\` vs \`applied\`, mismo criterio que
\`PUT /meli/items/:itemId\`). ML puede responder 200 e ignorar el valor.
En el resumen, \`changed\` cuenta los ítems cuyo valor quedó aplicado.
Los ítems que fallan traen \`error\` como siempre, sin \`changed\`.
    `,
  })
  @ApiOkResponse({
    description: 'Resultado por ítem y contadores ok / changed / failed',
    schema: {
      example: {
        ok: 2,
        changed: 1,
        failed: 1,
        results: [
          {
            meli_item_id: 'MLA1',
            ok: true,
            changed: true,
            requested: { price: 5600 },
            applied: { price: 5600 },
            status: 'active',
          },
          {
            meli_item_id: 'MLA2',
            ok: true,
            changed: false,
            requested: { available_quantity: 900 },
            applied: { available_quantity: null },
            status: 'active',
          },
          {
            meli_item_id: 'MLA999',
            ok: false,
            error: {
              status: 404,
              code: 'item_not_found',
              message: '...',
              source: 'meli',
              retryable: false,
              cause: [],
            },
          },
        ],
      },
    },
  })
  bulkUpdate(@Body() dto: BulkUpdateItemsDto): Promise<BulkUpdateResponse> {
    return this.service.execute(resolveBulkUpdateItems(dto));
  }
}

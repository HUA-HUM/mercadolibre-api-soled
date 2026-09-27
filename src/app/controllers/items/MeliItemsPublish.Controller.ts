import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from 'src/app/guards/InternalApiKeyGuard';
import { PublishMeliItemService } from 'src/app/services/items/PublishMeliItemService';
import {
  CreateItemResponse,
  ValidateItemResponse,
} from 'src/core/entitis/mercadolibre/items/MeliItemPublishResult';
import { CreateItemDto } from './dto/CreateItemDto';

@ApiTags('MercadoLibre - Items')
@ApiSecurity('x-internal-api-key')
@UseGuards(InternalApiKeyGuard)
@Controller('meli/items')
export class MeliItemsPublishController {
  constructor(private readonly service: PublishMeliItemService) {}

  @Post('validate')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Valida un ítem sin publicarlo',
    description: `
⚠️ **Endpoint interno**

Prueba el mismo body que \`POST /meli/items\` contra ML para **ambos**
listing types (\`gold_special\` y \`gold_pro\`), sin crear nada. Devuelve el
resultado de cada tipo por separado.
    `,
  })
  validate(@Body() dto: CreateItemDto): Promise<ValidateItemResponse> {
    return this.service.validate(dto);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Crea la publicación y su descripción',
    description: `
⚠️ **Endpoint interno**

Publica el SKU en los listing types que se pidan con \`listing_types\`
(por ejemplo \`["gold_special"]\` para solo la clásica). Si no viene ese
campo, publica en **los dos** (\`gold_special\` y \`gold_pro\`), que es el
comportamiento histórico.

Si ya existe un ítem activo/pausado con ese SKU para alguno de los tipos
pedidos, ese tipo se marca como conflicto y no se toca; si ya existen
todos los pedidos, responde 409 y no crea nada. Si un tipo se crea y el
otro falla (ML lo rechaza), igual responde 201 con el detalle de cada uno.
    `,
  })
  create(@Body() dto: CreateItemDto): Promise<CreateItemResponse> {
    return this.service.create(dto);
  }
}

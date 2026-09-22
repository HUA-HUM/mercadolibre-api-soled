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
    summary: 'Crea la publicación (gold_special y gold_pro) y su descripción',
    description: `
⚠️ **Endpoint interno**

Publica el SKU en **dos** listing types (\`gold_special\` y \`gold_pro\`) en
una sola llamada. Si ya existe un ítem activo/pausado con ese SKU para
alguno de los dos tipos, ese tipo se marca como conflicto y no se toca; si
ya existen los dos, responde 409 y no crea nada. Si un tipo se crea y el
otro falla (ML lo rechaza), igual responde 201 con el detalle de cada uno.
    `,
  })
  create(@Body() dto: CreateItemDto): Promise<CreateItemResponse> {
    return this.service.create(dto);
  }
}

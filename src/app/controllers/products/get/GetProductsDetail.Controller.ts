import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetMeliProductDetailService } from 'src/app/services/products/get/GetMeliProductDetailService';
import {
  MeliProductDetail,
  MeliProductDetailBulkResult,
} from 'src/core/entitis/mercadolibre/products/get/MeliProductDetail';

interface BulkProductDetailBody {
  itemIds: string[];
}

@ApiTags('MercadoLibre - Products')
@Controller('meli/products')
export class GetProductsDetailController {
  constructor(
    private readonly getMeliProductDetail: GetMeliProductDetailService,
  ) {}

  @Post('bulk')
  @ApiOperation({
    summary: 'Obtener detalle de productos por lote',
    description:
      'Devuelve el detalle completo de varios productos desde Mercado Libre.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['itemIds'],
      properties: {
        itemIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['MLA828961861', 'MLA1424563181'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Detalles de productos encontrados y listado de no encontrados',
    type: Object,
  })
  async getProductsBulk(
    @Body() body: BulkProductDetailBody,
  ): Promise<MeliProductDetailBulkResult> {
    if (!Array.isArray(body?.itemIds) || body.itemIds.length === 0) {
      throw new BadRequestException('itemIds must be a non-empty array');
    }

    return this.getMeliProductDetail.executeBulk(body.itemIds);
  }

  @Get(':itemId')
  @ApiOperation({
    summary: 'Obtener detalle de producto por itemId',
    description:
      'Devuelve información resumida del producto desde Mercado Libre.',
  })
  @ApiParam({
    name: 'itemId',
    required: true,
    example: 'MLA1424563181',
    description: 'ID del item en Mercado Libre',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del producto',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  async getProduct(
    @Param('itemId') itemId: string,
  ): Promise<MeliProductDetail> {
    const product = await this.getMeliProductDetail.execute(itemId);

    if (!product) {
      throw new NotFoundException(`Product with id ${itemId} not found`);
    }

    return product;
  }
}

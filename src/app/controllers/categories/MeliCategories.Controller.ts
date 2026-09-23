import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';
import { GetCategoriesTreeService } from 'src/app/services/categories/GetCategoriesTreeService';
import { PredictMeliCategoryService } from 'src/app/services/categories/PredictMeliCategoryService';
import { GetMeliCategoryAttributesService } from 'src/app/services/categories/GetMeliCategoryAttributesService';
import { InternalApiKeyGuard } from 'src/app/guards/InternalApiKeyGuard';
import { Category } from 'src/core/entitis/mercadolibre/categories/Category';
import { CategoryAttributesResult } from 'src/core/entitis/mercadolibre/categories/CategoryAttribute';
import { CategoryPrediction } from 'src/core/entitis/mercadolibre/categories/CategoryPrediction';
import { PredictCategoryQueryDto } from './dto/PredictCategoryQueryDto';

@ApiTags('MercadoLibre - Categories')
@Controller('meli/categories')
export class MeliCategoriesController {
  constructor(
    private readonly service: GetCategoriesTreeService,
    private readonly predictService: PredictMeliCategoryService,
    private readonly attributesService: GetMeliCategoryAttributesService,
  ) {}

  // 🔹 Nivel 1 solamente (categorías padre)
  @Get()
  @ApiOperation({
    summary: 'Obtiene las categorías raíz (nivel 1)',
    description: `
Devuelve únicamente las categorías principales del site **MLA**.
No incluye subcategorías.
    `,
  })
  @ApiOkResponse({
    description: 'Listado de categorías padre',
    schema: {
      example: [
        { id: 'MLA5725', name: 'Accesorios para Vehículos' },
        { id: 'MLA1512', name: 'Agro' },
        { id: 'MLA1403', name: 'Alimentos y Bebidas' },
      ],
    },
  })
  getRootCategories() {
    return this.service.getRootCategories();
  }

  // 🔒 Interno: sugiere categorías a partir de un título (para publicar)
  // Declarado antes de ':id' para que Nest no lo confunda con ese param.
  @Get('predict')
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('x-internal-api-key')
  @ApiOperation({
    summary: 'Sugiere categorías de ML a partir de un título',
    description: `
⚠️ **Endpoint interno**

Usa \`domain_discovery\` de MercadoLibre para sugerir la categoría de una
publicación a partir de su título.
    `,
  })
  @ApiOkResponse({
    description: 'Categorías sugeridas, en el orden que devuelve ML',
    schema: {
      example: [
        {
          category_id: 'MLA1591',
          category_name: 'Paneles LED',
          domain_id: 'MLA-LED_PANELS',
          domain_name: 'Paneles LED',
        },
      ],
    },
  })
  predict(
    @Query() query: PredictCategoryQueryDto,
  ): Promise<CategoryPrediction[]> {
    return this.predictService.predict(query.title, query.limit);
  }

  // 🔒 Interno: atributos de una categoría, para armar el body de publicación
  @Get(':categoryId/attributes')
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('x-internal-api-key')
  @ApiOperation({
    summary: 'Atributos de una categoría y cuáles son obligatorios',
    description: `
⚠️ **Endpoint interno**

Normaliza los \`tags\` de MercadoLibre: \`required\` es \`true\` si el
atributo trae \`required\` o \`catalog_required\`; se descartan los
atributos \`read_only\`, \`hidden\` o \`fixed\` — **excepto** los que
además traen \`conditional_required\`, que se devuelven igual con ese
campo en \`true\` (ML los puede rechazar en la creación aunque no
figuren como obligatorios acá, ej. VALUE_ADDED_TAX / IMPORT_DUTY en
algunas categorías). Se cachea en memoria 24h por categoría.

⚠️ Este endpoint **no** devuelve los atributos de paquete
(\`SELLER_PACKAGE_HEIGHT/WIDTH/LENGTH/WEIGHT\`) porque no son
específicos de la categoría. MercadoLibre los exige igual, los cuatro
juntos, para crear el ítem — quien arma el body de \`POST /meli/items\`
los tiene que agregar siempre a mano dentro de \`attributes\`.
    `,
  })
  @ApiParam({ name: 'categoryId', example: 'MLA1591' })
  @ApiOkResponse({
    description: 'Atributos normalizados de la categoría',
    schema: {
      example: {
        category_id: 'MLA1591',
        attributes: [
          {
            id: 'BRAND',
            name: 'Marca',
            value_type: 'string',
            required: true,
            conditional_required: false,
            allowed_values: [],
            allowed_units: [],
            hint: null,
          },
          {
            id: 'VALUE_ADDED_TAX',
            name: 'IVA',
            value_type: 'string',
            required: false,
            conditional_required: true,
            allowed_values: [],
            allowed_units: [],
            hint: null,
          },
        ],
      },
    },
  })
  getAttributes(
    @Param('categoryId') categoryId: string,
  ): Promise<CategoryAttributesResult> {
    return this.attributesService.getAttributes(categoryId);
  }

  // 🔹 Categoría puntual (con hijos directos)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtiene una categoría por ID',
    description: `
Devuelve la categoría solicitada junto con sus subcategorías directas.
    `,
  })
  @ApiParam({
    name: 'id',
    example: 'MLA5725',
  })
  getCategory(@Param('id') id: string): Promise<Category> {
    return this.service.getCategoryById(id);
  }
}

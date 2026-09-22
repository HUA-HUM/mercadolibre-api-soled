import { Module } from '@nestjs/common';
import { GetCategoriesTreeService } from 'src/app/services/categories/GetCategoriesTreeService';
import { PredictMeliCategoryService } from 'src/app/services/categories/PredictMeliCategoryService';
import { GetMeliCategoryAttributesService } from 'src/app/services/categories/GetMeliCategoryAttributesService';
import { MeliHttpModule } from '../http/meli-http.module';
import { MeliCategoriesController } from 'src/app/controllers/categories/MeliCategories.Controller';
import { GetCategoriesTreeRepository } from 'src/core/drivers/repositories/mercadolibre/categories/GetCategoriesTreeRepository';
import { PredictMeliCategoryRepository } from 'src/core/drivers/repositories/mercadolibre/categories/PredictMeliCategoryRepository';
import { GetMeliCategoryAttributesRepository } from 'src/core/drivers/repositories/mercadolibre/categories/GetMeliCategoryAttributesRepository';
import { InternalApiKeyGuard } from 'src/app/guards/InternalApiKeyGuard';

@Module({
  imports: [MeliHttpModule],
  controllers: [MeliCategoriesController],
  providers: [
    GetCategoriesTreeService,
    PredictMeliCategoryService,
    GetMeliCategoryAttributesService,
    InternalApiKeyGuard,
    {
      provide: 'IGetCategoriesTreeRepository',
      useClass: GetCategoriesTreeRepository,
    },
    {
      provide: 'IPredictMeliCategoryRepository',
      useClass: PredictMeliCategoryRepository,
    },
    {
      provide: 'IGetMeliCategoryAttributesRepository',
      useClass: GetMeliCategoryAttributesRepository,
    },
  ],
  exports: [GetCategoriesTreeService],
})
export class MeliCategoriesModule {}

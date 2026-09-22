import { Module } from '@nestjs/common';
import { MeliHttpModule } from '../http/meli-http.module';
import { InternalApiKeyGuard } from 'src/app/guards/InternalApiKeyGuard';
import { MeliItemsPublishController } from 'src/app/controllers/items/MeliItemsPublish.Controller';
import { PublishMeliItemService } from 'src/app/services/items/PublishMeliItemService';
import { MeliItemPublishRepository } from 'src/core/drivers/repositories/mercadolibre/items/MeliItemPublishRepository';

/**
 * Groups every meli-api "publicación" write endpoint (items validate/create/
 * update/description/status/bulk-update). All controllers here require
 * x-internal-api-key.
 */
@Module({
  imports: [MeliHttpModule],
  controllers: [MeliItemsPublishController],
  providers: [
    InternalApiKeyGuard,
    PublishMeliItemService,
    {
      provide: 'IMeliItemPublishRepository',
      useClass: MeliItemPublishRepository,
    },
  ],
})
export class MeliItemsPublishingModule {}

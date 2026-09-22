import { Module } from '@nestjs/common';
import { MeliHttpModule } from '../http/meli-http.module';
import { InternalApiKeyGuard } from 'src/app/guards/InternalApiKeyGuard';
import { MeliItemsPublishController } from 'src/app/controllers/items/MeliItemsPublish.Controller';
import { MeliItemsUpdateController } from 'src/app/controllers/items/MeliItemsUpdate.Controller';
import { MeliItemsBulkUpdateController } from 'src/app/controllers/items/MeliItemsBulkUpdate.Controller';
import { PublishMeliItemService } from 'src/app/services/items/PublishMeliItemService';
import { UpdateMeliItemService } from 'src/app/services/items/UpdateMeliItemService';
import { BulkUpdateMeliItemsService } from 'src/app/services/items/BulkUpdateMeliItemsService';
import { MeliItemPublishRepository } from 'src/core/drivers/repositories/mercadolibre/items/MeliItemPublishRepository';

/**
 * Groups every meli-api "publicación" write endpoint (items validate/create/
 * update/description/status/bulk-update). All controllers here require
 * x-internal-api-key.
 */
@Module({
  imports: [MeliHttpModule],
  controllers: [
    MeliItemsPublishController,
    MeliItemsUpdateController,
    MeliItemsBulkUpdateController,
  ],
  providers: [
    InternalApiKeyGuard,
    PublishMeliItemService,
    UpdateMeliItemService,
    BulkUpdateMeliItemsService,
    {
      provide: 'IMeliItemPublishRepository',
      useClass: MeliItemPublishRepository,
    },
  ],
})
export class MeliItemsPublishingModule {}

import { Module } from '@nestjs/common';
import { GetProductsController } from 'src/app/controllers/products/get/GetProducts.Controller';
import { GetValidMeliAccessTokenInteractor } from 'src/core/interactors/GetValidMeliAccessTokenInteractor';
import { IMeliAuthRepository } from 'src/core/adapters/repositories/mercadolibre/auth/IMeliAuthRepository';
import { MeliTokenRepository } from 'src/core/drivers/repositories/soled/mercadolibre/token/MeliTokenRepository';
import { MeliAuthRepository } from 'src/core/drivers/repositories/mercadolibre/auth/MeliAuthRepository';
import { MeliProductsRepository } from 'src/core/drivers/repositories/mercadolibre/products/get/GetProductsRepository';
import { MeliHttpClient } from 'src/core/drivers/repositories/mercadolibre/http/MeliHttpClient';
import { GetProductsService } from 'src/app/services/products/get/GetProductsService';
import { SoledHttpClient } from 'src/core/drivers/repositories/soled/http/SoledHttpClient';
import { ISoledMeliTokenRepository } from 'src/core/adapters/repositories/madre/mercadolibre/token/ISoledMeliTokenRepository';

@Module({
  controllers: [GetProductsController],

  providers: [
    /**
     * =========================
     * HTTP CLIENTS
     * =========================
     */
    {
      provide: 'ISoledHttpClient',
      useClass: SoledHttpClient,
    },
    {
      provide: 'IMeliHttpClient',
      useClass: MeliHttpClient,
    },

    /**
     * =========================
     * REPOSITORIES
     * =========================
     */
    {
      provide: 'IMadreMeliTokenRepository',
      useClass: MeliTokenRepository,
    },
    {
      provide: 'IMeliAuthRepository',
      useClass: MeliAuthRepository,
    },
    {
      provide: 'IMeliProductsRepository',
      useClass: MeliProductsRepository,
    },

    /**
     * =========================
     * INTERACTORS
     * =========================
     */
    {
      provide: GetValidMeliAccessTokenInteractor,
      useFactory: (
        tokenRepo: ISoledMeliTokenRepository,
        authRepo: IMeliAuthRepository,
      ) => new GetValidMeliAccessTokenInteractor(tokenRepo, authRepo),
      inject: ['ISoledMeliTokenRepository', 'IMeliAuthRepository'],
    },

    /**
     * =========================
     * SERVICES
     * =========================
     */
    GetProductsService,
  ],
})
export class GetProductsModule {}

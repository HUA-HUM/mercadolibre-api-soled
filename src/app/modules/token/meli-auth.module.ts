import { Global, Module } from '@nestjs/common';
import { GetValidMeliAccessTokenInteractor } from 'src/core/interactors/GetValidMeliAccessTokenInteractor';
import { MeliAuthRepository } from 'src/core/drivers/repositories/mercadolibre/auth/MeliAuthRepository';
import { MeliTokenRepository } from 'src/core/drivers/repositories/soled/mercadolibre/token/MeliTokenRepository';
import { SoledHttpModule } from '../soled/http/soled-http.module';

@Global()
@Module({
  imports: [SoledHttpModule],
  providers: [
    GetValidMeliAccessTokenInteractor,
    {
      provide: 'IMeliAuthRepository',
      useClass: MeliAuthRepository,
    },
    {
      provide: 'ISoledMeliTokenRepository',
      useClass: MeliTokenRepository,
    },
  ],
  exports: [GetValidMeliAccessTokenInteractor, 'ISoledMeliTokenRepository'],
})
export class MeliAuthModule {}

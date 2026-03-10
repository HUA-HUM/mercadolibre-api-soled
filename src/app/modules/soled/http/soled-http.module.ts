import { Global, Module } from '@nestjs/common';
import { SoledHttpClient } from 'src/core/drivers/repositories/soled/http/SoledHttpClient';

@Global()
@Module({
  providers: [
    {
      provide: 'ISoledHttpClient',
      useClass: SoledHttpClient,
    },
  ],
  exports: ['ISoledHttpClient'],
})
export class SoledHttpModule {}

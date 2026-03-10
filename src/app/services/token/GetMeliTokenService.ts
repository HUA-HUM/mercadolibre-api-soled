import { Inject, Injectable } from '@nestjs/common';
import type { ISoledMeliTokenRepository } from 'src/core/adapters/repositories/madre/mercadolibre/token/ISoledMeliTokenRepository';
import { MeliToken } from 'src/core/entitis/madre/mercadolibre/token/MeliToken';

@Injectable()
export class GetMeliTokenService {
  constructor(
    @Inject('ISoledMeliTokenRepository')
    private readonly tokenRepo: ISoledMeliTokenRepository,
  ) {}

  async getToken(): Promise<MeliToken | null> {
    return this.tokenRepo.getToken();
  }
}

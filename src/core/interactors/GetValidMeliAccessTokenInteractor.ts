import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { IMeliAuthRepository } from 'src/core/adapters/repositories/mercadolibre/auth/IMeliAuthRepository';
import { MeliToken } from 'src/core/entitis/madre/mercadolibre/token/MeliToken';
import type { ISoledMeliTokenRepository } from '../adapters/repositories/madre/mercadolibre/token/ISoledMeliTokenRepository';

@Injectable()
export class GetValidMeliAccessTokenInteractor {
  private readonly refreshThresholdSeconds = 300;

  constructor(
    @Inject('ISoledMeliTokenRepository')
    private readonly tokenRepository: ISoledMeliTokenRepository,

    @Inject('IMeliAuthRepository')
    private readonly authRepository: IMeliAuthRepository,
  ) {}

  async execute(): Promise<string> {
    const token = await this.tokenRepository.getToken();

    if (!token) {
      throw new UnauthorizedException(
        'MercadoLibre token not found. Reauthorize application.',
      );
    }

    if (this.isTokenValid(token)) {
      console.log('[MELI TOKEN] using cached token');
      return token.access_token;
    }

    console.warn('[MELI TOKEN] token expired → refreshing');

    const refreshed = await this.authRepository.refreshToken(
      token.refresh_token,
    );

    if (
      !refreshed ||
      !refreshed.access_token ||
      !refreshed.refresh_token ||
      typeof refreshed.expires_in !== 'number'
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token response from MercadoLibre. Reauthorize application.',
      );
    }

    await this.tokenRepository.updateToken({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_in: refreshed.expires_in,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000),
    });

    console.log('[MELI TOKEN] token refreshed and stored');

    return refreshed.access_token;
  }

  private isTokenValid(token: MeliToken): boolean {
    const now = Date.now();
    const expiresAt = new Date(token.expires_at).getTime();

    return now < expiresAt - this.refreshThresholdSeconds * 1000;
  }
}

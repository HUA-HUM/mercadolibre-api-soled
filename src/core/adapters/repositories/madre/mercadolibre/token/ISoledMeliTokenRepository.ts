import { MeliToken } from 'src/core/entitis/madre/mercadolibre/token/MeliToken';

export interface ISoledMeliTokenRepository {
  getToken(): Promise<MeliToken | null>;
  saveToken(token: MeliToken): Promise<void>;
  updateToken(token: MeliToken): Promise<void>;
}

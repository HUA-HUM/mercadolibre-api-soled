import type { AxiosRequestConfig } from 'axios';
import type { MeliWriteOptions } from 'src/core/drivers/repositories/mercadolibre/http/MeliHttpClient';

export interface IMeliHttpClient {
  get<T>(path: string, config?: AxiosRequestConfig): Promise<T | null>;
  post<T>(
    path: string,
    body: unknown,
    config?: AxiosRequestConfig,
    options?: MeliWriteOptions,
  ): Promise<T>;
  put<T>(
    path: string,
    body: unknown,
    config?: AxiosRequestConfig,
    options?: MeliWriteOptions,
  ): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

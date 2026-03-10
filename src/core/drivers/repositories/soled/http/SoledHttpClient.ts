import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Injectable } from '@nestjs/common';
import { ISoledHttpClient } from 'src/core/adapters/repositories/madre/http/ISoledHttpClient';
import { SoledConfig } from '../config/SoledConfig';

@Injectable()
export class SoledHttpClient implements ISoledHttpClient {
  private readonly client: AxiosInstance;

  constructor() {
    if (!SoledConfig.api.baseUrl) {
      throw new Error('MADRE_API_BASE_URL is not defined');
    }

    if (!SoledConfig.api.internalApiKey) {
      throw new Error('MADRE_INTERNAL_API_KEY is not defined');
    }

    this.client = axios.create({
      baseURL: SoledConfig.api.baseUrl,
      timeout: SoledConfig.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': SoledConfig.api.internalApiKey,
      },
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    body: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, body, config);
    return response.data;
  }

  async put<T>(
    url: string,
    body: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, body, config);
    return response.data;
  }
}

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';
import { GetValidMeliAccessTokenInteractor } from 'src/core/interactors/GetValidMeliAccessTokenInteractor';
import { MeliHttpErrorHandler } from './error/meliHttpError';
import { MeliApiException } from './error/MeliApiException';
import { retryWithBackoff } from './retry/retryWithBackoff';

const READ_TIMEOUT_MS = 5000;
const WRITE_TIMEOUT_MS = 15000;

export interface MeliWriteOptions {
  /** false disables retries — only safe for calls that are NOT idempotent (e.g. POST /items). */
  retryable?: boolean;
}

@Injectable()
export class MeliHttpClient {
  private readonly client: AxiosInstance;

  constructor(private readonly getToken: GetValidMeliAccessTokenInteractor) {
    this.client = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      timeout: READ_TIMEOUT_MS,
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T | null> {
    try {
      const token = await this.getToken.execute();

      const response = await this.client.get<T>(url, {
        ...config,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(config?.headers ?? {}),
        },
      });

      return response.data;
    } catch (error) {
      return MeliHttpErrorHandler.handle(error);
    }
  }

  /**
   * Writes never return null: on failure they throw MeliApiException with
   * ML's normalized status/code/cause. Never swallow errors here — callers
   * (coresa-api) need the real cause to decide whether to retry or surface it.
   */
  async post<T>(
    url: string,
    body: unknown,
    config?: AxiosRequestConfig,
    options?: MeliWriteOptions,
  ): Promise<T> {
    const token = await this.getWriteToken();

    const requestConfig: AxiosRequestConfig = {
      timeout: WRITE_TIMEOUT_MS,
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(config?.headers ?? {}),
      },
    };

    return this.executeWrite<T>(
      () => this.client.post<T>(url, body, requestConfig),
      options,
    );
  }

  async put<T>(
    url: string,
    body: unknown,
    config?: AxiosRequestConfig,
    options?: MeliWriteOptions,
  ): Promise<T> {
    const token = await this.getWriteToken();

    const requestConfig: AxiosRequestConfig = {
      timeout: WRITE_TIMEOUT_MS,
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(config?.headers ?? {}),
      },
    };

    return this.executeWrite<T>(
      () => this.client.put<T>(url, body, requestConfig),
      options,
    );
  }

  private async getWriteToken(): Promise<string> {
    try {
      return await this.getToken.execute();
    } catch {
      throw MeliApiException.tokenUnavailable();
    }
  }

  private async executeWrite<T>(
    call: () => Promise<AxiosResponse<T>>,
    options?: MeliWriteOptions,
  ): Promise<T> {
    try {
      const response = await retryWithBackoff(call, {
        retryable: options?.retryable ?? true,
      });
      return response.data;
    } catch (error) {
      throw MeliApiException.fromAxiosError(error);
    }
  }
}

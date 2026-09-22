import axios from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { isTransientMeliError } from '../retry/retryWithBackoff';

export interface MeliErrorCause {
  code: string;
  type: string; // 'error' | 'warning'
  message: string;
  references?: string[];
}

export interface MeliErrorBody {
  status: number;
  code: string;
  message: string;
  source: 'meli' | 'meli-api';
  retryable: boolean;
  cause: MeliErrorCause[];
}

function mapMlStatusToHttpStatus(mlStatus: number): number {
  if (mlStatus === 404) return HttpStatus.NOT_FOUND;
  if (mlStatus >= 500) return HttpStatus.BAD_GATEWAY;
  return HttpStatus.UNPROCESSABLE_ENTITY;
}

/**
 * Normalized error for meli-api's write endpoints. Body shape matches the
 * "Formato de errores" contract: status/code/message/source/retryable/cause,
 * with ML's cause array passed through unmodified.
 */
export class MeliApiException extends HttpException {
  constructor(body: MeliErrorBody, httpStatus: number) {
    super(body, httpStatus);
  }

  static fromMeliError(
    mlStatus: number,
    code: string,
    message: string,
    cause: MeliErrorCause[] = [],
    retryable = false,
  ): MeliApiException {
    return new MeliApiException(
      { status: mlStatus, code, message, source: 'meli', retryable, cause },
      mapMlStatusToHttpStatus(mlStatus),
    );
  }

  /** Builds the exception directly from a caught axios error (ML response or network failure). */
  static fromAxiosError(error: unknown): MeliApiException {
    if (!axios.isAxiosError(error)) {
      return MeliApiException.upstreamTimeout();
    }

    if (!error.response) {
      return MeliApiException.upstreamTimeout();
    }

    const status = error.response.status;
    const body = error.response.data as
      | { message?: string; error?: string; cause?: MeliErrorCause[] }
      | undefined;

    const cause = Array.isArray(body?.cause) ? body.cause : [];
    const code = cause[0]?.code ?? body?.error ?? 'meli_error';
    const message = body?.message ?? error.message;

    return MeliApiException.fromMeliError(
      status,
      code,
      message,
      cause,
      isTransientMeliError(error),
    );
  }

  static skuConflict(
    sku: string,
    existing: { listing_type_id: string; meli_item_id: string }[],
  ): MeliApiException {
    return new MeliApiException(
      {
        status: HttpStatus.CONFLICT,
        code: 'sku_already_exists',
        message: `SKU ${sku} already has an active or paused listing for: ${existing
          .map((e) => e.listing_type_id)
          .join(', ')}.`,
        source: 'meli-api',
        retryable: false,
        cause: [],
      },
      HttpStatus.CONFLICT,
    );
  }

  static tokenUnavailable(): MeliApiException {
    return new MeliApiException(
      {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'meli_token_unavailable',
        message:
          'MercadoLibre token expired and could not be refreshed. Reauthorize application.',
        source: 'meli-api',
        retryable: false,
        cause: [],
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  static upstreamTimeout(): MeliApiException {
    return new MeliApiException(
      {
        status: HttpStatus.BAD_GATEWAY,
        code: 'meli_upstream_unavailable',
        message: 'MercadoLibre did not respond after retrying.',
        source: 'meli-api',
        retryable: true,
        cause: [],
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

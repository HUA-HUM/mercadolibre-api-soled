import axios from 'axios';

export interface RetryOptions {
  /** false disables retries entirely (e.g. POST /items: a timeout may have created the item). */
  retryable?: boolean;
  maxAttempts?: number;
  delaysMs?: number[];
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_DELAYS_MS = [1000, 2000, 4000];

export function isTransientMeliError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  if (!error.response) return true; // network error, DNS, timeout

  const status = error.response.status;
  return status === 429 || status >= 500;
}

function getRetryAfterMs(error: unknown): number | null {
  if (!axios.isAxiosError(error)) return null;

  const header = error.response?.headers?.['retry-after'] as string | undefined;
  if (!header) return null;

  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1000;

  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());

  return null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries `fn` on 429 / 5xx / network errors with exponential backoff.
 * Never retries 4xx business-rule rejections (400/403/404/422...).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    retryable = true,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    delaysMs = DEFAULT_DELAYS_MS,
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const canRetry =
        retryable && attempt < maxAttempts && isTransientMeliError(error);

      if (!canRetry) {
        throw error;
      }

      const delay =
        getRetryAfterMs(error) ??
        delaysMs[attempt - 1] ??
        delaysMs[delaysMs.length - 1];

      await wait(delay);
    }
  }

  // Unreachable: the loop always returns or throws.
  throw new Error('retryWithBackoff: exhausted attempts without a result');
}

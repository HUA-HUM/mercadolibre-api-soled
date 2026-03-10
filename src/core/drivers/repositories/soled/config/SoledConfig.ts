export const SoledConfig = {
  api: {
    baseUrl: process.env.SOLED_API_BASE_URL,
    timeout: Number(process.env.SOLED_API_TIMEOUT ?? 30000),
    internalApiKey: process.env.SOLED_INTERNAL_API_KEY,
  },
};

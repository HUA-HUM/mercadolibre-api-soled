export const getMeliOfficialStoreId = (): number => {
  const raw = process.env.MELI_OFFICIAL_STORE_ID;

  if (!raw) {
    throw new Error('MELI_OFFICIAL_STORE_ID is not defined');
  }

  const officialStoreId = Number(raw);

  if (Number.isNaN(officialStoreId)) {
    throw new Error('MELI_OFFICIAL_STORE_ID must be a number');
  }

  return officialStoreId;
};

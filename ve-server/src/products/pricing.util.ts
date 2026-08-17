export type PricingSummary = {
  regularPrice: number;
  mrpPrice: number;
  saveAmount: number;
  savePercentage: number;
};

/**
 * BUILD PRICING SUMMARY
 * @param param0 regularPrice, mrpPrice
 * @returns PricingSummary
 */
export function buildPricingSummary({ regularPrice, mrpPrice }: { regularPrice: number; mrpPrice: number; }): PricingSummary {
  const safeRegularPrice = Number.isFinite(regularPrice) ? regularPrice : 0;
  const safeMrpPrice = Number.isFinite(mrpPrice) ? mrpPrice : 0;

  const saveAmount = Math.max(0, safeMrpPrice - safeRegularPrice);
  const savePercentage = safeMrpPrice > 0 && safeRegularPrice <= safeMrpPrice ? Math.round(((safeMrpPrice - safeRegularPrice) / safeMrpPrice) * 100) : 0;

  return {
    regularPrice: safeRegularPrice,
    mrpPrice: safeMrpPrice,
    saveAmount,
    savePercentage,
  };
}

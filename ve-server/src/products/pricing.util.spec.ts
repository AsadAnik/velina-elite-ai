import { buildPricingSummary } from './pricing.util';

describe('buildPricingSummary', () => {
  it('calculates save percentage and amount from mrp and regular price', () => {
    const summary = buildPricingSummary({ regularPrice: 80, mrpPrice: 100 });

    expect(summary.regularPrice).toBe(80);
    expect(summary.mrpPrice).toBe(100);
    expect(summary.saveAmount).toBe(20);
    expect(summary.savePercentage).toBe(20);
  });

  it('clamps discounts to zero when regular price exceeds mrp price', () => {
    const summary = buildPricingSummary({ regularPrice: 140, mrpPrice: 120 });

    expect(summary.saveAmount).toBe(0);
    expect(summary.savePercentage).toBe(0);
  });
});

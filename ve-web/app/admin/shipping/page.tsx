"use client";

import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { Save, Truck, MapPin } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface ShippingCost {
  id: number | null;
  inside_dhaka_cost: number;
  outside_dhaka_cost: number;
  currency_symbol: string;
  created_at: string | null;
  updated_at: string | null;
}

export default function ShippingPage() {
  const [shippingCost, setShippingCost] = useState<ShippingCost>({
    id: null,
    inside_dhaka_cost: 70,
    outside_dhaka_cost: 120,
    currency_symbol: "৳",
    created_at: null,
    updated_at: null,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);

  const loadShippingCost = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<ShippingCost>("/shipping-costs");
      setShippingCost(data);
      setHasExistingConfig(!!data.id);
    } catch (error) {
      console.error("Failed to load shipping cost:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShippingCost();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        inside_dhaka_cost: shippingCost.inside_dhaka_cost,
        outside_dhaka_cost: shippingCost.outside_dhaka_cost,
        currency_symbol: shippingCost.currency_symbol,
      };

      if (hasExistingConfig && shippingCost.id) {
        await fetchApi(`/shipping-costs/${shippingCost.id}`, {
          method: "PUT",
          data: payload,
        });
      } else {
        await fetchApi("/shipping-costs", {
          method: "POST",
          data: payload,
        });
      }
      
      await loadShippingCost();
      alert("Shipping cost configuration saved successfully!");
    } catch (error) {
      console.error("Failed to save shipping cost:", error);
      alert("Failed to save shipping cost configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell title="Shipping Cost" subtitle="Configure shipping rates for different regions">
      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted">Loading shipping cost configuration...</div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-velina-rose/10 text-velina-rose">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Shipping Configuration</h3>
                  <p className="text-sm text-muted">
                    {hasExistingConfig
                      ? "Update your shipping cost settings"
                      : "Set up your initial shipping cost configuration"}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Inside Dhaka Cost */}
              <div className="space-y-2">
                <label htmlFor="inside_dhaka_cost" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPin size={16} className="text-velina-rose" />
                  Inside Dhaka Shipping Cost
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-muted font-medium">{shippingCost.currency_symbol}</span>
                  </div>
                  <input
                    id="inside_dhaka_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingCost.inside_dhaka_cost}
                    onChange={(e) => setShippingCost({ ...shippingCost, inside_dhaka_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                    placeholder="e.g. 70"
                    required
                  />
                </div>
                <p className="text-xs text-muted">Shipping cost for deliveries within Dhaka city (default: ৳70)</p>
              </div>

              {/* Outside Dhaka Cost */}
              <div className="space-y-2">
                <label htmlFor="outside_dhaka_cost" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPin size={16} className="text-velina-gold" />
                  Outside Dhaka Shipping Cost
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-muted font-medium">{shippingCost.currency_symbol}</span>
                  </div>
                  <input
                    id="outside_dhaka_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingCost.outside_dhaka_cost}
                    onChange={(e) => setShippingCost({ ...shippingCost, outside_dhaka_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                    placeholder="e.g. 120"
                    required
                  />
                </div>
                <p className="text-xs text-muted">Shipping cost for deliveries outside Dhaka city (default: ৳120)</p>
              </div>

              {/* Currency Symbol */}
              <div className="space-y-2">
                <label htmlFor="currency_symbol" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="text-velina-magenta">💱</span>
                  Currency
                </label>
                <select
                  id="currency_symbol"
                  value={shippingCost.currency_symbol}
                  onChange={(e) => setShippingCost({ ...shippingCost, currency_symbol: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="৳">BDT (৳)</option>
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                  <option value="¥">CNY (¥)</option>
                  <option value="£">GBP (£)</option>
                  <option value="₹">INR (₹)</option>
                </select>
                <p className="text-xs text-muted">Select currency for displaying prices throughout the storefront</p>
              </div>

              {/* Last Updated Info */}
              {hasExistingConfig && shippingCost.updated_at && (
                <div className="rounded-xl bg-surface/50 border border-border p-4">
                  <p className="text-xs text-muted">
                    Last updated: {new Date(shippingCost.updated_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta px-6 py-3 text-sm font-bold text-white shadow-md shadow-velina-rose/25 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {isSubmitting ? "Saving..." : hasExistingConfig ? "Update Configuration" : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info Card */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-velina-rose/5 via-velina-peach/10 to-velina-gold/5 dark:from-velina-rose/10 dark:via-zinc-900/50 dark:to-velina-gold/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-velina-rose/10 text-velina-rose">
              <Truck size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-foreground mb-1">About Shipping Costs</h4>
              <p className="text-xs text-muted leading-relaxed">
                Configure different shipping rates for inside and outside Dhaka. Default rates are ৳70 for inside Dhaka and ৳120 for outside Dhaka. These costs will be applied to customer orders based on their delivery address location. The selected currency will be displayed throughout the storefront.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

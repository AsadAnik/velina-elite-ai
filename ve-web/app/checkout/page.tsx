"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { getAddresses, Address } from '@/lib/addresses';
import { createOrder, CreateOrderDto } from '@/lib/orders';
import { MapPin, Plus, Check, ArrowRight, ShoppingBag, Truck, Shield, CreditCard, AlertCircle } from 'lucide-react';
import Navbar from '@/app/components/Navbar';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, user, clearCart, validateStock } = useStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [stockErrors, setStockErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    line1: '',
    line2: '',
    city: '',
    counrty: '',
    postal_code: '',
    is_default: false,
  });
  const [note, setNote] = useState('');

  const shipping = cartTotal >= 999 ? 0 : 60;
  const grandTotal = cartTotal + shipping;

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (cart.length === 0) {
      router.push('/cart');
      return;
    }
    
    // Validate stock before proceeding to checkout
    const validation = validateStock();
    if (!validation.isValid) {
      setStockErrors(validation.errors);
      // Don't redirect immediately, let user see the errors
    } else {
      setStockErrors([]);
    }
    
    loadAddresses();
  }, [user, cart, router, validateStock]);

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
      const defaultAddress = data.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (data.length > 0) {
        setSelectedAddress(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAddress = await getAddresses();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('velina_customer_token')}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add address');
      }

      const address = await response.json();
      toast.success('Address added successfully');
      setShowAddressForm(false);
      setFormData({
        line1: '',
        line2: '',
        city: '',
        counrty: '',
        postal_code: '',
        is_default: false,
      });
      loadAddresses();
      setSelectedAddress(address);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setPlacingOrder(true);

      const orderData: CreateOrderDto = {
        shipping_address_id: selectedAddress.id,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        note: note || undefined,
      };

      const order = await createOrder(orderData);
      
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/profile?order=${order.id}`);
    } catch (error: any) {
      // Handle specific stock validation errors
      if (error.message && error.message.includes('Insufficient stock')) {
        toast.error(error.message, {
          duration: 5000,
        });
        // Redirect back to cart to review items
        setTimeout(() => {
          router.push('/cart');
        }, 2000);
      } else {
        toast.error(error.message || 'Failed to place order');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">Complete your order</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Address and Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h2>

                {showAddressForm ? (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Address</h3>
                    <form onSubmit={handleAddAddress} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.line1}
                          onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={formData.line2}
                          onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.counrty}
                            onChange={(e) => setFormData({ ...formData, counrty: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.postal_code}
                          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Add Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    {addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Add a shipping address to continue.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            onClick={() => setSelectedAddress(address)}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedAddress?.id === address.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{address.line1}</p>
                                {address.line2 && <p className="text-gray-600">{address.line2}</p>}
                                <p className="text-gray-600">
                                  {address.city}, {address.counrty}
                                </p>
                                <p className="text-gray-600">{address.postal_code}</p>
                              </div>
                              {selectedAddress?.id === address.id && (
                                <div className="ml-4">
                                  <Check className="w-5 h-5 text-indigo-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Address
                    </button>
                  </>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Items
                </h2>
                <div className="space-y-4">
                  {cart.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center space-x-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">Qty: {quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ৳{(product.salePrice * quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Note */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Note (Optional)</h2>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any special instructions for your order..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Right column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                {/* Stock Errors */}
                {stockErrors.length > 0 && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Stock Issues Detected
                    </h3>
                    <ul className="space-y-1">
                      {stockErrors.map((error, index) => (
                        <li key={index} className="text-xs text-red-700">
                          {error}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => router.push('/cart')}
                      className="mt-3 w-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 px-3 py-2 rounded transition-colors"
                    >
                      Return to Cart to Fix
                    </button>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.length} items)</span>
                    <span className="font-medium text-gray-900">৳{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <Truck size={14} />
                      Shipping
                    </span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      <span className="font-medium text-gray-900">৳{shipping.toFixed(2)}</span>
                    )}
                  </div>
                  {cartTotal < 999 && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                      Add ৳{(999 - cartTotal).toFixed(2)} more for free shipping
                    </p>
                  )}
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-gray-900 font-bold text-lg">
                    <span>Total</span>
                    <span className="text-indigo-600">৳{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Method
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Pay with cash upon delivery</p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={!selectedAddress || stockErrors.length > 0 || placingOrder}
                  className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {placingOrder ? (
                    'Placing Order...'
                  ) : stockErrors.length > 0 ? (
                    'Fix Stock Issues to Continue'
                  ) : (
                    <>
                      Place Order <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Shield size={12} />
                  Secure & Encrypted Checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

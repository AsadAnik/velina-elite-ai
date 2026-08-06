"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress, Address } from '@/lib/addresses';
import { getMyOrders, Order, OrderStatus } from '@/lib/orders';
import { fetchApi } from '@/lib/api';
import { useStore } from '@/lib/store';
import { MapPin, Plus, Edit, Trash2, Check, Package, X, Lock, Activity, Star } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import RatingModal from '@/app/components/RatingModal';

export default function ProfilePage() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'security'>('overview');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [ratingProduct, setRatingProduct] = useState<{ id: number, title: string } | null>(null);
  const [formData, setFormData] = useState({
    line1: '',
    line2: '',
    city: '',
    counrty: '',
    postal_code: '',
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
      loadOrders();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      toast.error('Failed to load addresses');
    }
  };

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
        toast.success('Address updated successfully');
      } else {
        await createAddress(formData);
        toast.success('Address added successfully');
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      setFormData({
        line1: '',
        line2: '',
        city: '',
        counrty: '',
        postal_code: '',
        is_default: false,
      });
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save address');
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      counrty: address.counrty,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddress(id);
      toast.success('Address deleted successfully');
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
      toast.success('Default address updated');
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to set default address');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      setChangingPassword(true);
      await fetchApi('/auth/change-password', {
        method: 'POST',
        data: {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.pending:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.confirmed:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.preparing:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.shipping:
        return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.shipped:
        return 'bg-teal-100 text-teal-800';
      case OrderStatus.ready_for_receive:
        return 'bg-orange-100 text-orange-800';
      case OrderStatus.completed:
        return 'bg-green-100 text-green-800';
      case OrderStatus.cancelled:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950">
          <p className="text-gray-600 dark:text-gray-400">Please login to view your profile</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your orders and addresses</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-medium whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Activity className="inline-block w-5 h-5 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-2 font-medium whitespace-nowrap ${
              activeTab === 'orders'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="inline-block w-5 h-5 mr-2" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-4 px-2 font-medium whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="inline-block w-5 h-5 mr-2" />
            Addresses
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-4 px-2 font-medium whitespace-nowrap ${
              activeTab === 'security'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock className="inline-block w-5 h-5 mr-2" />
            Security
          </button>
        </div>

          {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800 p-4 sm:p-6 transition-colors">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Account Statistics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-6 border border-gray-100 dark:border-zinc-700/50">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 border border-green-100 dark:border-green-900/30">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-500">
                    {orders.filter(o => o.status === OrderStatus.completed).length}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-100 dark:border-red-900/30">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Cancelled</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-500">
                    {orders.filter(o => o.status === OrderStatus.cancelled).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800 p-4 sm:p-6 max-w-2xl transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Change Password
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800 p-4 sm:p-6 transition-colors">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No orders yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start shopping to see your orders here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 dark:border-zinc-800 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Order #{order.id}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    {/* Order Progress Tracker */}
                    {order.status !== OrderStatus.cancelled ? (
                      <div className="mb-4">
                        {(() => {
                          const steps: OrderStatus[] = [
                            OrderStatus.pending,
                            OrderStatus.confirmed,
                            OrderStatus.preparing,
                            OrderStatus.shipping,
                            OrderStatus.shipped,
                            OrderStatus.completed,
                          ];
                          const stepLabels: Record<string, string> = {
                            [OrderStatus.pending]: 'Placed',
                            [OrderStatus.confirmed]: 'Confirmed',
                            [OrderStatus.preparing]: 'Preparing',
                            [OrderStatus.shipping]: 'Shipping',
                            [OrderStatus.shipped]: 'Shipped',
                            [OrderStatus.completed]: 'Delivered',
                          };
                          const currentIdx = steps.indexOf(order.status as OrderStatus);
                          return (
                            <>
                              {/* Step dots + connectors */}
                              <div className="flex items-center">
                                {steps.map((step, i) => {
                                  const isDone = i <= currentIdx;
                                  const isActive = i === currentIdx;
                                  return (
                                    <div key={step} className="flex items-center flex-1 min-w-0">
                                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                        <div
                                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all ${
                                            isActive
                                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40 scale-110'
                                              : isDone
                                              ? 'border-indigo-500 bg-indigo-500 text-white'
                                              : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-400'
                                          }`}
                                        >
                                          {isDone && !isActive ? (
                                            <Check className="w-3 h-3" />
                                          ) : (
                                            i + 1
                                          )}
                                        </div>
                                        {/* Labels: hidden on mobile, visible sm+ */}
                                        <span
                                          className={`hidden sm:block text-[9px] font-bold uppercase tracking-wide text-center leading-tight max-w-[48px] ${
                                            isDone ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'
                                          }`}
                                        >
                                          {stepLabels[step]}
                                        </span>
                                      </div>
                                      {i < steps.length - 1 && (
                                        <div
                                          className={`h-0.5 flex-1 mx-0.5 rounded-full transition-all ${
                                            i < currentIdx
                                              ? 'bg-indigo-500'
                                              : 'bg-gray-200 dark:bg-zinc-700'
                                          }`}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {/* Active step label for mobile only */}
                              <p className="sm:hidden mt-2 text-center text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                {stepLabels[order.status] ?? order.status.replace(/_/g, ' ')}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                        <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">This order was cancelled.</p>
                      </div>
                    )}

                    <div className="space-y-3 mb-4">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4">
                          <img
                            src={item.product.images_url[0] || '/placeholder.png'}
                            alt={item.product.title}
                            className="w-16 h-16 object-cover rounded bg-gray-100 dark:bg-zinc-800"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{item.product.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                            {order.status === OrderStatus.completed && (
                              <button
                                onClick={() => setRatingProduct({ id: item.product_id, title: item.product.title })}
                                className="mt-2 text-xs font-bold text-velina-rose hover:underline flex items-center gap-1"
                              >
                                <Star size={12} className="fill-velina-rose" />
                                Rate Product
                              </button>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            ৳{Number(item.unit_price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 dark:border-zinc-800 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Shipping Address</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.shipping_address.line1}, {order.shipping_address.city}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ৳{Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800 p-4 sm:p-6 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Addresses</h2>
              <button
                onClick={() => {
                  setEditingAddress(null);
                  setFormData({
                    line1: '',
                    line2: '',
                    city: '',
                    counrty: '',
                    postal_code: '',
                    is_default: false,
                  });
                  setShowAddressForm(true);
                }}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </button>
            </div>

            {showAddressForm && (
              <div className="mb-6 p-4 sm:p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.line1}
                      onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={formData.line2}
                      onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.counrty}
                        onChange={(e) => setFormData({ ...formData, counrty: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                    />
                    <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Set as default address
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      {editingAddress ? 'Update Address' : 'Add Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {addresses.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No addresses yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add your first address to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`border rounded-lg p-4 relative transition-colors ${
                      address.is_default 
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' 
                        : 'border-gray-200 dark:border-zinc-700 dark:bg-zinc-800/30'
                    }`}
                  >
                    {address.is_default && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300">
                          <Check className="w-3 h-3 mr-1" />
                          Default
                        </span>
                      </div>
                    )}
                    <div className="mb-4">
                      <p className="font-medium text-gray-900 dark:text-white">{address.line1}</p>
                      {address.line2 && <p className="text-gray-600 dark:text-gray-400">{address.line2}</p>}
                      <p className="text-gray-600 dark:text-gray-400">
                        {address.city}, {address.counrty}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">{address.postal_code}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-red-300 dark:border-red-900/50 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {ratingProduct && (
        <RatingModal
          productId={ratingProduct.id}
          productTitle={ratingProduct.title}
          onClose={() => setRatingProduct(null)}
          onSuccess={() => setRatingProduct(null)}
        />
      )}
    </div>
    </>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress, Address } from '@/lib/addresses';
import { getMyOrders, Order, OrderStatus } from '@/lib/orders';
import { useStore } from '@/lib/store';
import { MapPin, Plus, Edit, Trash2, Check, Package, X } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please login to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your orders and addresses</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-2 font-medium ${
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
            className={`pb-4 px-2 font-medium ${
              activeTab === 'addresses'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="inline-block w-5 h-5 mr-2" />
            Addresses
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4">
                          <img
                            src={item.product.images_url[0] || '/placeholder.png'}
                            alt={item.product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product.title}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ৳{Number(item.unit_price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Shipping Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.shipping_address.line1}, {order.shipping_address.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-lg font-bold text-gray-900">
                          ৳{Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {order.status === OrderStatus.pending && (
                      <div className="mt-4 pt-4 border-t">
                        <button
                          onClick={() => {
                            // Handle cancel order
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Addresses</h2>
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </button>
            </div>

            {showAddressForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
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
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                      Set as default address
                    </label>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {editingAddress ? 'Update Address' : 'Add Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {addresses.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses yet</h3>
                <p className="mt-1 text-sm text-gray-500">Add your first address to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`border rounded-lg p-4 relative ${
                      address.is_default ? 'border-indigo-500 bg-indigo-50' : ''
                    }`}
                  >
                    {address.is_default && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          <Check className="w-3 h-3 mr-1" />
                          Default
                        </span>
                      </div>
                    )}
                    <div className="mb-4">
                      <p className="font-medium text-gray-900">{address.line1}</p>
                      {address.line2 && <p className="text-gray-600">{address.line2}</p>}
                      <p className="text-gray-600">
                        {address.city}, {address.counrty}
                      </p>
                      <p className="text-gray-600">{address.postal_code}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
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
    </div>
  );
}

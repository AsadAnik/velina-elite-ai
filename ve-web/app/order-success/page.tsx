"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Home, Package } from 'lucide-react';
import Navbar from '@/app/components/Navbar';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Successful!</h1>
          <p className="text-gray-600 mb-8">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          
          {orderId && (
            <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Order Reference</p>
              <p className="text-lg font-mono font-semibold text-gray-900">#{orderId}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push(`/profile?order=${orderId}`)}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Package className="w-5 h-5 mr-2" />
              View Order Details
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}

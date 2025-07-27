import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProductManagement } from "./ProductManagement";
import { OrderHistory } from "./OrderHistory";

export function SupplierDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const stats = useQuery(api.dashboard.getSupplierStats);
  const profile = useQuery(api.users.getCurrentProfile);

  if (!stats || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "products", label: "My Products" },
    { id: "orders", label: "Orders" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile.businessName}!</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
              <p className="text-2xl font-bold text-green-600">₹{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Active Vendors</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.activeVendors}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Active Products</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.activeProducts}</p>
            </div>
          </div>

          {/* Pending Orders Alert */}
          {stats.pendingOrders > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Pending Orders</h3>
                  <p className="text-sm text-blue-700">
                    You have {stats.pendingOrders} orders waiting for confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && <ProductManagement />}
      {activeTab === "orders" && <OrderHistory userType="supplier" />}
    </div>
  );
}

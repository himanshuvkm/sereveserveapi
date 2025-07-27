import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { GroupBuyingSection } from "./GroupBuyingSection";
import { ProductCatalog } from "./ProductCatalog";
import { OrderHistory } from "./OrderHistory";

export function VendorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const stats = useQuery(api.dashboard.getVendorStats);
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
    { id: "products", label: "Browse Products" },
    { id: "group-buying", label: "Group Buying" },
    { id: "orders", label: "My Orders" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
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
              <h3 className="text-sm font-medium text-gray-500">Monthly Orders</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyOrders}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Trust Score</h3>
              <p className="text-2xl font-bold text-green-600">{stats.trustScore.toFixed(1)}/5.0</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Active Group Buys</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.activeGroupBuys}</p>
            </div>
          </div>

          {/* Alerts */}
          {stats.lowStockItems > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Stock Alert</h3>
                  <p className="text-sm text-yellow-700">
                    You have {stats.lowStockItems} items running low on stock.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && <ProductCatalog />}
      {activeTab === "group-buying" && <GroupBuyingSection />}
      {activeTab === "orders" && <OrderHistory userType="vendor" />}
    </div>
  );
}

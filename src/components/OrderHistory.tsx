import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface OrderHistoryProps {
  userType: "vendor" | "supplier";
}

export function OrderHistory({ userType }: OrderHistoryProps) {
  const vendorOrders = useQuery(api.orders.getVendorOrders, userType === "vendor" ? {} : "skip");
  const supplierOrders = useQuery(api.orders.getSupplierOrders, userType === "supplier" ? {} : "skip");
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);

  const orders = userType === "vendor" ? vendorOrders : supplierOrders;

  const handleStatusUpdate = async (orderId: Id<"orders">, status: "pending" | "confirmed" | "delivered" | "cancelled") => {
    try {
      await updateOrderStatus({ 
        orderId, 
        status 
      });
      toast.success("Order status updated successfully!");
    } catch (error) {
      toast.error("Failed to update order status");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {userType === "vendor" ? "My Orders" : "Received Orders"}
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {orders?.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No orders found
            </div>
          ) : (
            orders?.map((order: any) => (
              <div key={order._id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{order.productName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {order.groupBuyingId && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Group Buy
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">
                          {userType === "vendor" ? "Supplier:" : "Vendor:"}
                        </span>
                        <span className="ml-1 font-medium">
                          {userType === "vendor" ? order.supplierName : order.vendorName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <span className="ml-1 font-medium">{order.quantity} {order.productUnit}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Unit Price:</span>
                        <span className="ml-1 font-medium">₹{order.unitPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <span className="ml-1 font-medium text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Ordered on: {new Date(order.orderDate).toLocaleDateString()}
                      {order.deliveryDate && (
                        <span className="ml-4">
                          Delivered on: {new Date(order.deliveryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {userType === "supplier" && order.status === "pending" && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleStatusUpdate(order._id, "confirmed")}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order._id, "cancelled")}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {userType === "supplier" && order.status === "confirmed" && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, "delivered")}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors ml-4"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

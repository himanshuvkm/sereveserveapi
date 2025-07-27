import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const products = useQuery(api.products.getAllActiveProducts);
  const createOrder = useMutation(api.orders.createOrder);

  const categories = ["all", "vegetables", "fruits", "spices", "grains", "dairy", "meat", "other"];

  const filteredProducts = products?.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category.toLowerCase() === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const handleOrder = async (productId: string, quantity: number) => {
    try {
      await createOrder({ productId: productId as any, quantity });
      toast.success("Order placed successfully!");
    } catch (error) {
      toast.error("Failed to place order");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name or supplier..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} onOrder={handleOrder} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onOrder }: { product: any; onOrder: (id: string, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(product.minOrderQuantity || 1);
  const [showOrderForm, setShowOrderForm] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600">{product.category}</p>
        <p className="text-sm text-gray-500 mt-1">{product.description}</p>
      </div>

      <div className="mb-4">
        <div className="text-xl font-bold text-green-600">
          ₹{product.price.toFixed(2)}/{product.unit}
        </div>
        <div className="text-sm text-gray-500">
          Available: {product.quantity} {product.unit}
        </div>
      </div>

      <div className="mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Supplier:</span>
          <span className="font-medium">{product.supplierName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Location:</span>
          <span className="font-medium">{product.supplierCity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Min Order:</span>
          <span className="font-medium">{product.minOrderQuantity} {product.unit}</span>
        </div>
      </div>

      {!showOrderForm ? (
        <button
          onClick={() => setShowOrderForm(true)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Order Now
        </button>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity ({product.unit})
            </label>
            <input
              type="number"
              min={product.minOrderQuantity}
              max={product.maxOrderQuantity || product.quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || product.minOrderQuantity)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            Total: ₹{(product.price * quantity).toFixed(2)}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onOrder(product._id, quantity)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Place Order
            </button>
            <button
              onClick={() => setShowOrderForm(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

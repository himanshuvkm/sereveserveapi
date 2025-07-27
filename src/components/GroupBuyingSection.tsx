import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function GroupBuyingSection() {
  const [activeSubTab, setActiveSubTab] = useState("browse");
  const activeGroupBuys = useQuery(api.groupBuying.getActiveGroupBuys);
  const myGroupBuys = useQuery(api.groupBuying.getMyGroupBuys);
  const joinGroupBuy = useMutation(api.groupBuying.joinGroupBuy);

  const handleJoinGroupBuy = async (groupBuyingId: string, quantity: number) => {
    try {
      await joinGroupBuy({ groupBuyingId: groupBuyingId as any, quantity });
      toast.success("Successfully joined group buy!");
    } catch (error) {
      toast.error("Failed to join group buy");
      console.error(error);
    }
  };

  const subTabs = [
    { id: "browse", label: "Browse Group Buys" },
    { id: "my-groups", label: "My Group Buys" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Group Buying</h2>
      </div>

      {/* Sub Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeSubTab === "browse" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">How Group Buying Works</h3>
            <p className="text-blue-700 text-sm">
              Join with other vendors to buy in bulk and get better prices! The more vendors join, the bigger the discount.
            </p>
          </div>

          {activeGroupBuys?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active group buys available</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {activeGroupBuys?.map((groupBuy) => (
                <GroupBuyCard
                  key={groupBuy._id}
                  groupBuy={groupBuy}
                  onJoin={handleJoinGroupBuy}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === "my-groups" && (
        <div className="space-y-6">
          {myGroupBuys && 'created' in myGroupBuys && myGroupBuys.created && myGroupBuys.created.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Buys I Created</h3>
              <div className="grid gap-4">
                {myGroupBuys.created.map((groupBuy: any) => (
                  <div key={groupBuy._id} className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{groupBuy.title}</h4>
                        <p className="text-gray-600 text-sm">{groupBuy.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        groupBuy.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {groupBuy.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Participants:</span>
                        <span className="ml-1 font-medium">{groupBuy.currentParticipants}/{groupBuy.maxParticipants}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <span className="ml-1 font-medium">{groupBuy.currentQuantity}/{groupBuy.targetQuantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Discount:</span>
                        <span className="ml-1 font-medium text-green-600">{groupBuy.discountPercentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {myGroupBuys && 'participating' in myGroupBuys && myGroupBuys.participating && myGroupBuys.participating.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Buys I Joined</h3>
              <div className="grid gap-4">
                {myGroupBuys.participating.map((groupBuy: any) => (
                  <div key={groupBuy._id} className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{groupBuy.title}</h4>
                        <p className="text-gray-600 text-sm">My quantity: {groupBuy.userQuantity}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        groupBuy.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {groupBuy.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!myGroupBuys || !('created' in myGroupBuys) || (!myGroupBuys?.created?.length && !myGroupBuys?.participating?.length)) && (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't joined any group buys yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupBuyCard({ groupBuy, onJoin }: { groupBuy: any; onJoin: (id: string, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const progress = (groupBuy.currentQuantity / groupBuy.targetQuantity) * 100;
  const timeLeft = Math.max(0, groupBuy.deadline - Date.now());
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{groupBuy.title}</h3>
          <p className="text-gray-600">{groupBuy.productName} by {groupBuy.supplierName}</p>
          <p className="text-sm text-gray-500 mt-1">{groupBuy.description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            ₹{groupBuy.discountedPrice.toFixed(2)}/{groupBuy.productUnit}
          </div>
          <div className="text-sm text-gray-500 line-through">
            ₹{groupBuy.originalPrice.toFixed(2)}
          </div>
          <div className="text-sm font-medium text-green-600">
            {groupBuy.discountPercentage}% OFF
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress: {groupBuy.currentQuantity}/{groupBuy.targetQuantity} {groupBuy.productUnit}</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-500">Participants:</span>
          <span className="ml-1 font-medium">{groupBuy.currentParticipants}/{groupBuy.maxParticipants}</span>
        </div>
        <div>
          <span className="text-gray-500">Min participants:</span>
          <span className="ml-1 font-medium">{groupBuy.minParticipants}</span>
        </div>
        <div>
          <span className="text-gray-500">Time left:</span>
          <span className="ml-1 font-medium">{daysLeft} days</span>
        </div>
      </div>

      {!showJoinForm ? (
        <button
          onClick={() => setShowJoinForm(true)}
          disabled={groupBuy.currentParticipants >= groupBuy.maxParticipants}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {groupBuy.currentParticipants >= groupBuy.maxParticipants ? "Group Full" : "Join Group Buy"}
        </button>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity ({groupBuy.productUnit})
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onJoin(groupBuy._id, quantity)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Confirm Join
            </button>
            <button
              onClick={() => setShowJoinForm(false)}
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

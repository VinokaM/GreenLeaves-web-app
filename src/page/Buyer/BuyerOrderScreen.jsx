// BuyerOrderScreen.jsx
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../db/firebase";
import CurrentOrders from "../Orders/CurrentOrders";
import SubmittedOrders from "../Orders/SubmittedOrders";

export default function BuyerOrderScreen() {
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [selectedVeg, setSelectedVeg] = useState(null);
  const [cart, setCart] = useState([]);
  const [quantity, setQuantity] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = "error") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  useEffect(() => {
    fetchBuyers();
    fetchVegetables();
  }, []);

  const fetchBuyers = async () => {
    try {
      const snap = await getDocs(collection(db, "buyers"));
      setBuyers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      showAlert(e.message);
    }
  };

  const fetchVegetables = async () => {
    try {
      const snap = await getDocs(collection(db, "buyerVegetables"));
      setVegetables(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      showAlert(e.message);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVeg || !quantity) return;
    if (cart.find((i) => i.vegetableId === selectedVeg.id)) {
      showAlert("This vegetable is already in the order.");
      return;
    }
    const qty = parseFloat(quantity);
    setCart((prev) => [
      ...prev,
      {
        vegetableId: selectedVeg.id,
        name: selectedVeg.name,
        quantity: qty,
        price: selectedVeg.sellingPrice,
        total: qty * selectedVeg.sellingPrice,
      },
    ]);
    setQuantity("");
    setSelectedVeg(null);
  };

  const handleRemoveFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!selectedBuyer || cart.length === 0) {
      showAlert("Please select a buyer and add vegetables.");
      return;
    }
    setLoading(true);
    try {
      const orderTotal = cart.reduce((s, i) => s + i.total, 0);
      await addDoc(collection(db, "buyerOrders"), {
        buyerId: selectedBuyer.id,
        buyerName: selectedBuyer.name,
        items: cart,
        total: orderTotal,
        isSubmitted: false,
        orderDate: Timestamp.now(),
      });
      showAlert("Order created successfully.", "success");
      setCart([]);
      setSelectedBuyer(null);
      setSelectedVeg(null);
      setShowModal(false);
      setRefreshTrigger((p) => p + 1);
    } catch (e) {
      showAlert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCart([]);
    setSelectedVeg(null);
    setSelectedBuyer(null);
    setQuantity("");
  };

  const orderTotal = cart.reduce((s, i) => s + i.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Toast */}
        {alert && (
          <div
            className={`mb-3 px-4 py-3 rounded-xl text-sm font-medium ${
              alert.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {alert.msg}
          </div>
        )}

        {/* Add Order button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-[#3a8f2a] hover:bg-[#2d7020] text-white font-semibold text-sm py-3 rounded-xl mb-4 transition-colors"
        >
          + Add Order
        </button>

        {/* Tab bar */}
        <div className="flex gap-2 mb-5">
          {["current", "submitted"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                activeTab === tab
                  ? "bg-[#1a2e1a] text-white border-[#1a2e1a]"
                  : "bg-white text-[#1a2e1a] border-[#1a2e1a] hover:bg-gray-50"
              }`}
            >
              {tab === "current" ? "Current Orders" : "Submitted Orders"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "current" ? (
          <CurrentOrders refreshTrigger={refreshTrigger} />
        ) : (
          <SubmittedOrders refreshTrigger={refreshTrigger} />
        )}
      </div>

      {/* ── Add Order Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1a2e1a]">
                Create Buyer Order
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {loading && (
              <p className="text-center text-sm text-gray-400 py-2 mb-3">
                Processing…
              </p>
            )}

            {/* Select Buyer */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Select Buyer
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {buyers.map((buyer) => (
                <button
                  key={buyer.id}
                  onClick={() => setSelectedBuyer(buyer)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap border transition-colors flex-shrink-0 ${
                    selectedBuyer?.id === buyer.id
                      ? "bg-orange-500 border-orange-500 text-white font-semibold"
                      : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👤 {buyer.name}
                </button>
              ))}
            </div>

            {/* Select Vegetable */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Select Vegetable
            </p>
            <div className="max-h-44 overflow-y-auto space-y-1.5 mb-3 pr-1">
              {vegetables.map((veg) => (
                <button
                  key={veg.id}
                  onClick={() => setSelectedVeg(veg)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-colors ${
                    selectedVeg?.id === veg.id
                      ? "bg-green-100 border-green-400 text-green-900 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {veg.name}
                  <span className="float-right text-gray-500 font-normal">
                    Rs. {veg.sellingPrice}
                  </span>
                </button>
              ))}
            </div>

            {/* Quantity row */}
            {selectedVeg && (
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  placeholder="Quantity (kg)"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3a8f2a] focus:ring-2 focus:ring-[#3a8f2a]/10 transition-all"
                />
                <button
                  onClick={handleAddToCart}
                  className="bg-[#3a8f2a] hover:bg-[#2d7020] text-white text-sm font-semibold px-4 rounded-xl transition-colors"
                >
                  Add to cart
                </button>
              </div>
            )}

            {/* Cart */}
            {cart.length > 0 && (
              <div className="border border-gray-200 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Cart
                  </p>
                  <p className="text-sm font-bold text-[#1a2e1a]">
                    Total: Rs. {orderTotal.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  {cart.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity}kg × Rs.{item.price} ={" "}
                          <span className="text-[#1a2e1a] font-semibold">
                            Rs.{item.total}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(i)}
                        className="text-red-400 hover:text-red-600 text-lg ml-3 transition-colors"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#1a2e1a] hover:bg-[#2a4a2a] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                Save Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

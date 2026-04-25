// CurrentOrders.jsx
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  runTransaction,
  getDoc,
} from "firebase/firestore";
import { db } from "../../db/firebase";
import { format } from "date-fns";

export default function CurrentOrders({ refreshTrigger }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [refreshOrders, setRefreshOrders] = useState(0);
  const [addDiscount, setAddDiscount] = useState(false);
  const [discount, setDiscount] = useState("");
  const [transport, setTransport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = "error") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "buyerOrders"),
          where("isSubmitted", "==", false),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(
          data.sort((a, b) => a.orderDate.toDate() - b.orderDate.toDate()),
        );
      } catch (e) {
        showAlert(e.message);
      }
    };
    fetchOrders();
  }, [refreshTrigger, refreshOrders]);

  const openSubmitModal = (order) => {
    setSelectedOrder(order);
    setEditableItems(order.items.map((i) => ({ ...i })));
    setDiscount("");
    setTransport("");
    setAddDiscount(false);
    setShowModal(true);
  };

  const updateItemQty = (index, val) => {
    setEditableItems((prev) => {
      const updated = [...prev];
      if (val === "") {
        updated[index] = { ...updated[index], quantity: "", total: 0 };
      } else {
        const qty = parseFloat(val);
        updated[index] = {
          ...updated[index],
          quantity: isNaN(qty) ? 0 : qty,
          total: isNaN(qty) ? 0 : qty * updated[index].price,
        };
      }
      return updated;
    });
  };

  const generateInvoiceNumber = async () => {
    const counterRef = doc(db, "counters", "invoices");
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      if (!snap.exists()) {
        tx.set(counterRef, { lastNumber: 1000 });
        return 1000;
      }
      const newNum = snap.data().lastNumber + 1;
      tx.update(counterRef, { lastNumber: newNum });
      return newNum;
    });
  };

  const handleConfirmSubmit = async () => {
    if (!selectedOrder?.id) {
      showAlert("Order ID is missing.");
      return;
    }
    setIsLoading(true);
    try {
      const sanitized = editableItems.map((item) => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        total: (parseFloat(item.quantity) || 0) * item.price,
      }));

      const itemsTotal = sanitized.reduce((s, i) => s + i.total, 0);
      const discountValue = addDiscount ? parseFloat(discount) || 0 : 0;
      const transportValue = parseFloat(transport) || 0;
      const finalTotal = itemsTotal - discountValue + transportValue;

      await updateDoc(doc(db, "buyerOrders", selectedOrder.id), {
        items: sanitized,
        finalTotal,
        isSubmitted: true,
      });

      const invoiceNumber = await generateInvoiceNumber();

      await addDoc(collection(db, "submittedOrders"), {
        invoiceNumber,
        orderId: selectedOrder.id,
        buyerId: selectedOrder.buyerId,
        buyerName: selectedOrder.buyerName,
        items: sanitized,
        itemsTotal,
        discount: discountValue,
        transport: transportValue,
        finalTotal,
        submittedAt: new Date(),
      });

      const buyerRef = doc(db, "buyers", selectedOrder.buyerId);
      const buyerSnap = await getDoc(buyerRef);
      const currentDue = buyerSnap.exists()
        ? buyerSnap.data().totalDue || 0
        : 0;
      await updateDoc(buyerRef, { totalDue: currentDue + finalTotal });

      showAlert("Order submitted successfully.", "success");
      setShowModal(false);
      setSelectedOrder(null);
      setRefreshOrders((p) => p + 1);
    } catch (e) {
      console.error(e);
      showAlert(e.message || "Failed to submit order.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Computed totals for the modal ──
  const itemsTotal = editableItems.reduce((s, i) => s + (i.total || 0), 0);
  const discountValue = addDiscount ? parseFloat(discount) || 0 : 0;
  const transportValue = parseFloat(transport) || 0;
  const grandTotal = itemsTotal - discountValue + transportValue;

  const inputCls =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1a2e1a] focus:ring-2 focus:ring-[#1a2e1a]/10 transition-all";

  return (
    <div>
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

      {/* ── Order list ── */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-400 text-sm mt-10">
          No orders found.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-gray-800 mb-0.5">
                🧑‍🌾{" "}
                <span className="font-normal text-gray-600">
                  {order.buyerName}
                </span>
              </p>
              <p className="text-xs text-gray-400 mb-3">
                🕒 {format(order.orderDate.toDate(), "dd MMM yyyy hh:mm a")}
              </p>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                🥦 Vegetables
              </p>
              <div className="space-y-0.5 mb-4">
                {order.items.map((veg, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    👉 {veg.name} — {veg.quantity}kg × Rs.{veg.price}
                  </p>
                ))}
              </div>

              <button
                onClick={() => openSubmitModal(order)}
                className="w-full bg-[#1a2e1a] hover:bg-[#2a4a2a] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                Submit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Submit / Confirm Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl max-h-[90vh] flex flex-col">
            <h2 className="text-base font-semibold text-[#1a2e1a] text-center mb-4">
              📝 Confirm & Submit Order
            </h2>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* Editable items */}
              {editableItems.map((item, i) => (
                <div
                  key={item.vegetableId}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    {item.name}
                  </p>
                  <input
                    type="number"
                    placeholder="Enter quantity (kg)"
                    value={item.quantity === "" ? "" : item.quantity}
                    onChange={(e) => updateItemQty(i, e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Total:{" "}
                    <span className="font-semibold text-[#1a2e1a]">
                      Rs. {(item.total || 0).toFixed(2)}
                    </span>
                  </p>
                </div>
              ))}

              {/* Discount checkbox */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <div
                    onClick={() => setAddDiscount((v) => !v)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      addDiscount
                        ? "bg-green-500 border-green-500"
                        : "border-gray-400 bg-white"
                    }`}
                  >
                    {addDiscount && (
                      <span className="text-white text-xs font-bold">✓</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">Add discount</span>
                </label>

                {addDiscount && (
                  <input
                    type="number"
                    placeholder="Enter discount amount"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className={`${inputCls} mt-2`}
                  />
                )}
              </div>

              {/* Transport */}
              <input
                type="number"
                placeholder="Enter transport cost"
                value={transport}
                onChange={(e) => setTransport(e.target.value)}
                className={inputCls}
              />

              {/* Grand total */}
              <div className="bg-[#1a2e1a]/5 border border-[#1a2e1a]/10 rounded-xl px-4 py-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Items total</span>
                  <span>Rs. {itemsTotal.toFixed(2)}</span>
                </div>
                {addDiscount && discountValue > 0 && (
                  <div className="flex justify-between text-xs text-green-700 mb-1">
                    <span>Discount</span>
                    <span>− Rs. {discountValue.toFixed(2)}</span>
                  </div>
                )}
                {transportValue > 0 && (
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Transport</span>
                    <span>+ Rs. {transportValue.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#1a2e1a] border-t border-[#1a2e1a]/10 pt-2 mt-1">
                  <span>🧾 Grand total</span>
                  <span>Rs. {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setDiscount("");
                  setTransport("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#1a2e1a] hover:bg-[#2a4a2a] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {isLoading ? "Submitting…" : "✅ Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

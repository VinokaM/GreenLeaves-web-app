// BuyerManagement.jsx
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../db/firebase";

const EMPTY_FORM = { name: "", phone: "", location: "" };

export default function BuyerManagement() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  // Add / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [payHistory, setPayHistory] = useState([]);

  // Alerts
  const [alert, setAlert] = useState(null); // {msg, type}

  const showAlert = (msg, type = "error") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "buyers"));
      setBuyers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      showAlert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (buyer) => {
    setForm({ name: buyer.name, phone: buyer.phone, location: buyer.location });
    setIsEditing(true);
    setEditingId(buyer.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.location) {
      showAlert("Please fill in all fields.");
      return;
    }
    setIsDisabled(true);
    setLoading(true);
    try {
      if (isEditing) {
        await updateDoc(doc(db, "buyers", editingId), form);
      } else {
        await addDoc(collection(db, "buyers"), { ...form, totalDue: 0 });
      }
      setShowModal(false);
      fetchBuyers();
    } catch (e) {
      showAlert(e.message);
    } finally {
      setIsDisabled(false);
      setLoading(false);
    }
  };

  const openPayment = (buyer) => {
    setSelectedBuyer(buyer);
    setPayAmount("");
    setShowPayModal(true);
  };

  const handlePayment = async () => {
    const amount = parseFloat(payAmount);
    if (!selectedBuyer || isNaN(amount) || amount <= 0) {
      showAlert("Invalid amount.");
      return;
    }
    if (amount > selectedBuyer.totalDue) {
      showAlert("Payment cannot exceed total due.");
      return;
    }
    setIsDisabled(true);
    setLoading(true);
    try {
      await addDoc(collection(db, "BuyerPayments"), {
        buyerId: selectedBuyer.id,
        amount,
        date: new Date().toISOString().split("T")[0],
      });
      await updateDoc(doc(db, "buyers", selectedBuyer.id), {
        totalDue: Math.max(selectedBuyer.totalDue - amount, 0),
      });
      showAlert("Payment completed.", "success");
      setShowPayModal(false);
      fetchBuyers();
    } catch (e) {
      showAlert(e.message);
    } finally {
      setIsDisabled(false);
      setLoading(false);
    }
  };

  const openHistory = async (buyerId) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "BuyerPayments"),
        where("buyerId", "==", buyerId),
      );
      const snap = await getDocs(q);
      const hist = snap.docs
        .map((d) => d.data())
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setPayHistory(hist);
      setShowHistory(true);
    } catch (e) {
      showAlert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input class ──
  const inputCls =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a2e1a] focus:ring-2 focus:ring-[#1a2e1a]/10 transition-all mb-3";

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <div className="max-w-lg mx-auto">
        {/* ── Toast alert ── */}
        {alert && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
              alert.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {alert.msg}
          </div>
        )}

        {/* ── Add button ── */}
        <button
          onClick={openAdd}
          className="w-full bg-[#1a2e1a] hover:bg-[#2a4a2a] text-white font-semibold text-sm py-3 rounded-xl mb-4 transition-colors"
        >
          + Add Buyer
        </button>

        {/* ── Loading ── */}
        {loading && (
          <p className="text-center text-sm text-gray-400 py-4">Loading…</p>
        )}

        {/* ── Buyer list ── */}
        {!loading && buyers.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">
            No buyers found.
          </p>
        )}

        <div className="space-y-3">
          {buyers.map((buyer) => (
            <div
              key={buyer.id}
              className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex justify-between items-start shadow-sm"
            >
              {/* Left info */}
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {buyer.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{buyer.phone}</p>
                <p className="text-xs text-gray-500">{buyer.location}</p>
                <p className="text-sm font-bold text-[#1a2e1a] mt-2">
                  Rs. {buyer.totalDue?.toLocaleString() ?? 0}
                </p>
              </div>

              {/* Right actions */}
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => openEdit(buyer)}
                  className="text-orange-500 hover:text-orange-600 text-lg transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => openHistory(buyer.id)}
                  className="text-orange-500 hover:text-orange-600 text-lg transition-colors"
                  title="Payment history"
                >
                  🕓
                </button>
                <button
                  onClick={() => openPayment(buyer)}
                  className="bg-[#1a2e1a] hover:bg-[#2a4a2a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  💵 Pay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-[#1a2e1a] mb-4">
              {isEditing ? "Edit Buyer" : "Add Buyer"}
            </h2>
            <input
              className={inputCls}
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className={inputCls}
              placeholder="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
            <input
              className={inputCls}
              placeholder="Location"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
            />
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isDisabled}
                className="flex-1 py-2.5 rounded-xl bg-[#1a2e1a] text-white text-sm font-semibold hover:bg-[#2a4a2a] disabled:opacity-60 transition-colors"
              >
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-[#1a2e1a] mb-3">
              Manual Payment
            </h2>
            <p className="text-sm text-gray-600 mb-1">
              Buyer:{" "}
              <span className="font-medium text-gray-800">
                {selectedBuyer?.name}
              </span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Current due:{" "}
              <span className="font-medium text-[#1a2e1a]">
                Rs. {selectedBuyer?.totalDue?.toLocaleString()}
              </span>
            </p>
            <input
              className={inputCls}
              type="number"
              placeholder="Enter amount"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isDisabled}
                className="flex-1 py-2.5 rounded-xl bg-[#1a2e1a] text-white text-sm font-semibold hover:bg-[#2a4a2a] disabled:opacity-60 transition-colors"
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── History Modal ── */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[80vh] flex flex-col">
            <h2 className="text-base font-semibold text-[#1a2e1a] mb-4">
              Payment History
            </h2>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {payHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No payments yet.
                </p>
              ) : (
                payHistory.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Rs. {p.amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{p.date}</p>
                    </div>
                    <span className="text-[#1a2e1a] text-lg">↗</span>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="w-full mt-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

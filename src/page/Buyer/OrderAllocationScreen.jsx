// OrderAllocationScreen.jsx
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../db/firebase";

export default function OrderAllocationScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [orderedVegetables, setOrderedVegs] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [activeTab, setActiveTab] = useState("ordered");
  const [showModal, setShowModal] = useState(false);
  const [editingAlloc, setEditingAlloc] = useState(null);
  const [selectedVeg, setSelectedVeg] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [qtyKg, setQtyKg] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [alert, setAlert] = useState(null);
  const [confirmDismissTarget, setConfirmTarget] = useState(null);

  const showAlert = (msg, type = "error") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  useEffect(() => {
    loadAll();
  }, [refreshFlag]);

  useEffect(() => {
    fetchOrderedVegetables().then((data) => {
      if (data) setOrderedVegs(data);
    });
    fetchAllocations();
  }, [showModal, refreshFlag]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchVegetables(), fetchFarmers()]);
    setLoading(false);
  };

  const fetchVegetables = async () => {
    const snap = await getDocs(collection(db, "farmerVegetables"));
    setVegetables(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchFarmers = async () => {
    const snap = await getDocs(collection(db, "farmers"));
    setFarmers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchOrderedVegetables = async () => {
    try {
      const q = query(
        collection(db, "buyerOrders"),
        where("isSubmitted", "==", false),
      );
      const snap = await getDocs(q);
      const map = {};
      snap.docs.forEach((d) => {
        (d.data().items || []).forEach((item) => {
          if (!map[item.vegetableId]) {
            map[item.vegetableId] = {
              id: item.vegetableId,
              name: item.name,
              quantity: 0,
            };
          }
          map[item.vegetableId].quantity += item.quantity || 0;
        });
      });
      return Object.values(map);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllocations = async () => {
    setLoading(true);
    const q = query(
      collection(db, "farmerOrderAllocations"),
      where("status", "==", "pending"),
    );
    const snap = await getDocs(q);
    setAllocations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const handleSaveAllocation = async () => {
    if (!selectedVeg || !selectedFarmer || !qtyKg) {
      showAlert("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setIsDisabled(true);
    try {
      const payload = {
        vegetableId: selectedVeg.vegetableId || selectedVeg.id,
        farmerId: selectedFarmer,
        qty: parseFloat(qtyKg) || 0,
        status: "pending",
        updatedAt: serverTimestamp(),
      };
      if (editingAlloc) {
        await updateDoc(
          doc(db, "farmerOrderAllocations", editingAlloc.id),
          payload,
        );
        showAlert("Allocation updated.", "success");
      } else {
        await addDoc(collection(db, "farmerOrderAllocations"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showAlert("Allocation saved.", "success");
      }
      resetModal();
      setRefreshFlag((p) => !p);
    } catch (e) {
      showAlert(e.message);
    } finally {
      setLoading(false);
      setIsDisabled(false);
    }
  };

  const handleDismiss = async (allocation) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "farmerOrderAllocations", allocation.id), {
        status: "dismissed",
        updatedAt: serverTimestamp(),
      });
      showAlert("Allocation dismissed.", "success");
      setRefreshFlag((p) => !p);
    } catch (e) {
      showAlert(e.message);
    } finally {
      setLoading(false);
      setConfirmTarget(null);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingAlloc(null);
    setSelectedVeg(null);
    setSelectedFarmer("");
    setQtyKg("");
  };

  const openCreateModal = (veg = null) => {
    setEditingAlloc(null);
    setSelectedVeg(veg);
    setSelectedFarmer("");
    setQtyKg("");
    setShowModal(true);
  };

  const openEditModal = (alloc) => {
    setEditingAlloc(alloc);
    const veg = vegetables.find((v) => v.id === alloc.vegetableId);
    setSelectedVeg(
      veg
        ? { vegetableId: veg.id, name: veg.name }
        : { vegetableId: alloc.vegetableId, name: "Unknown" },
    );
    setSelectedFarmer(alloc.farmerId);
    setQtyKg(String(alloc.qty || 0));
    setShowModal(true);
  };

  // Pending qty per vegetable
  const pendingCounts = allocations
    .filter((a) => a.status === "pending")
    .reduce((acc, a) => {
      acc[a.vegetableId] = (acc[a.vegetableId] || 0) + a.qty;
      return acc;
    }, {});

  const inputCls =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a2e1a] focus:ring-2 focus:ring-[#1a2e1a]/10 transition-all";
  const selectCls = `${inputCls} cursor-pointer`;

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

        {/* New allocation button */}
        <button
          onClick={() => openCreateModal(null)}
          className="w-full bg-[#3a8f2a] hover:bg-[#2d7020] text-white font-semibold text-sm py-3 rounded-xl mb-4 transition-colors"
        >
          + New Allocation
        </button>

        {/* Tab bar */}
        <div className="flex gap-2 mb-5">
          {[
            { key: "ordered", label: "Summary" },
            { key: "allocation", label: "Allocations" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                activeTab === tab.key
                  ? "bg-[#1a2e1a] text-white border-[#1a2e1a]"
                  : "bg-white text-[#1a2e1a] border-[#1a2e1a] hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-center text-sm text-gray-400 py-4">Loading…</p>
        )}

        {/* ── Summary Tab ── */}
        {activeTab === "ordered" && (
          <div>
            {/* Allocation summary */}
            <h2 className="text-sm font-bold text-gray-700 mb-2">
              Allocation Summary
            </h2>
            {Object.keys(pendingCounts).length > 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-5">
                <div className="space-y-1.5">
                  {Object.entries(pendingCounts).map(([vegId, totalQty]) => {
                    const veg = vegetables.find((v) => v.id === vegId);
                    return (
                      <div
                        key={vegId}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700">
                          {veg?.name || "Unknown"}
                        </span>
                        <span className="text-sm font-semibold text-[#1a2e1a]">
                          {totalQty} units
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 mb-5">
                No allocated orders found.
              </p>
            )}

            {/* Ordered vegetables */}
            <h2 className="text-sm font-bold text-gray-700 mb-2">
              Ordered Vegetables
            </h2>
            {orderedVegetables.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-6">
                No pending orders found.
              </p>
            ) : (
              <div className="space-y-2">
                {orderedVegetables.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {item.name}
                    </span>
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      {item.quantity} kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Allocations Tab ── */}
        {activeTab === "allocation" && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-2">
              Allocations
            </h2>
            {allocations.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-6">
                No allocations found.
              </p>
            ) : (
              <div className="space-y-2">
                {allocations.map((a) => {
                  const farmer = farmers.find((f) => f.id === a.farmerId);
                  const veg = vegetables.find((v) => v.id === a.vegetableId);
                  return (
                    <div
                      key={a.id}
                      className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-start justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {farmer?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {veg?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">{a.qty} kg</p>
                        <span
                          className={`text-xs font-semibold mt-1 inline-block ${
                            a.status === "dismissed"
                              ? "text-red-500"
                              : a.status === "delivered"
                                ? "text-green-600"
                                : "text-gray-500"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>

                      {a.status === "pending" && (
                        <div className="flex flex-col gap-1.5 items-end">
                          <button
                            onClick={() => setConfirmTarget(a)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => openEditModal(a)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Confirm Dismiss Dialog ── */}
      {confirmDismissTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl text-center">
            <p className="text-base font-semibold text-gray-800 mb-2">
              Confirm Dismiss
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to dismiss this allocation?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDismiss(confirmDismissTarget)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
              >
                Yes, Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Allocation Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1a2e1a]">
                {editingAlloc ? "Update Allocation" : "New Allocation"}
              </h2>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Farmer select */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Select Farmer
              </label>
              <select
                value={selectedFarmer}
                onChange={(e) => setSelectedFarmer(e.target.value)}
                className={selectCls}
              >
                <option value="">Select Farmer</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vegetable select — only show if not pre-selected */}
            {!selectedVeg ? (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Select Vegetable
                </label>
                <select
                  value={selectedVeg?.vegetableId || ""}
                  onChange={(e) => {
                    const veg = vegetables.find((v) => v.id === e.target.value);
                    setSelectedVeg(
                      veg ? { vegetableId: veg.id, name: veg.name } : null,
                    );
                  }}
                  className={selectCls}
                >
                  <option value="">Select Vegetable</option>
                  {vegetables.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Rs.{v.buyPrice})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Vegetable
                </label>
                <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 flex items-center justify-between">
                  <span>{selectedVeg.name}</span>
                  <button
                    onClick={() => setSelectedVeg(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs ml-2"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Quantity (kg)
              </label>
              <input
                type="number"
                placeholder="Enter quantity"
                value={qtyKg}
                onChange={(e) => setQtyKg(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={resetModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSaveAllocation();
                  setRefreshFlag((p) => !p);
                }}
                disabled={isDisabled}
                className="flex-1 py-2.5 rounded-xl bg-[#1a2e1a] hover:bg-[#2a4a2a] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {editingAlloc ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

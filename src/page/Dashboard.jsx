// DashboardScreen.jsx
import { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../db/firebase";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Farmers", icon: "👤", route: "FarmerManagement" },
  { label: "Vegetables", icon: "🥬", route: "VegetableManagement" },
  { label: "Employees", icon: "👥", route: "EmployeeManagement" },
  { label: "Buyers", icon: "🛒", route: "BuyerManagement" },
  { label: "Buyer Order", icon: "📦", route: "BuyerOrder" },
  { label: "Order Allocation", icon: "📋", route: "OrderAllocation" },
  { label: "Collections", icon: "📝", route: "Allocation" },
  { label: "Daily Duty", icon: "📅", route: "duties" },
  { label: "Farmer Payroll", icon: "💰", route: "FarmerPayroll" },
  { label: "Employee Payroll", icon: "💰", route: "EmployeePayroll" },
  { label: "Reports", icon: "📄", route: "Reports" },
];

const QUICK_ACCESS = [
  { label: "Buyer Order", icon: "🛒", route: "BuyerOrder" },
  { label: "Order Allocation", icon: "📋", route: "OrderAllocation" },
  { label: "Collection", icon: "📝", route: "Allocation" },
  { label: "Daily Duty", icon: "📅", route: "duties" },
];

export default function DashboardScreen({ onNavigate, onLogout }) {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [farmerTotal, setFarmerTotal] = useState(0);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [orderedVegs, setOrderedVegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12
        ? "Good Morning"
        : hour < 18
          ? "Good Afternoon"
          : "Good Evening",
    );

    const stored = localStorage.getItem("userData");
    if (stored) setUserName(JSON.parse(stored).name || "User");

    loadDashboard();
    loadRecentOrders();
    loadOrderedVegs();
  }, []);

  const loadDashboard = async () => {
    try {
      const farmerSnap = await getDocs(collection(db, "farmers"));
      const employeeSnap = await getDocs(collection(db, "employees"));
      const orderSnap = await getDocs(collection(db, "buyerOrders"));

      setFarmerTotal(
        farmerSnap.docs.reduce((s, d) => s + (d.data().totalDue || 0), 0),
      );
      setEmployeeTotal(
        employeeSnap.docs.reduce((s, d) => s + (d.data().totalDue || 0), 0),
      );
      setPendingCount(
        orderSnap.docs.filter((d) => d.data().isSubmitted === false).length,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentOrders = async () => {
    setOrderLoading(true);
    try {
      const q = query(
        collection(db, "buyerOrders"),
        orderBy("orderDate", "desc"),
        limit(3),
      );
      const snap = await getDocs(q);
      const orders = [];

      for (const d of snap.docs) {
        const data = d.data();
        const buyerSnap = await getDocs(collection(db, "buyers"));
        const buyer = buyerSnap.docs.find((b) => b.id === data.buyerId);
        orders.push({
          id: d.id,
          buyerName: buyer?.data()?.name || "Unknown",
          date: data.orderDate?.toDate?.().toLocaleDateString("en-GB"),
          total: data.total || 0,
          isSubmitted: data.isSubmitted,
        });
      }
      setRecentOrders(orders);
    } catch (e) {
      console.error(e);
    } finally {
      setOrderLoading(false);
    }
  };

  const loadOrderedVegs = async () => {
    try {
      const q = query(
        collection(db, "buyerOrders"),
        where("isSubmitted", "==", false),
      );
      const snap = await getDocs(q);
      const map = {};
      snap.docs.forEach((d) => {
        (d.data().items || []).forEach((item) => {
          if (!map[item.vegetableId])
            map[item.vegetableId] = {
              id: item.vegetableId,
              name: item.name,
              quantity: 0,
            };
          map[item.vegetableId].quantity += item.quantity || 0;
        });
      });
      setOrderedVegs(Object.values(map));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    onLogout?.();
  };

  return (
    <div className="min-h-screen bg-[#1a2e1a] flex flex-col">
      {/* ── Sidebar overlay ── */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="absolute top-0 left-0 h-full w-72 bg-white shadow-2xl rounded-r-2xl flex flex-col py-10 px-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#3a8f2a] flex items-center justify-center text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-yellow-600 font-medium">
                  {greeting}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {userName}
                </p>
              </div>
            </div>

            <hr className="border-gray-100 mb-4" />

            {/* Nav items */}
            <nav className="flex flex-col gap-1 flex-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.route}
                  onClick={() => {
                    navigate(item.route);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="text-base w-6 text-center">{item.icon}</span>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl transition-colors text-sm font-semibold"
            >
              <span>⏻</span> Logout
            </button>

            <div className="mt-5 text-center text-gray-400 text-xs space-y-0.5">
              <p>Powered by Ceylon Cyber Mart</p>
              <p>0725000987</p>
              <p>v 2.0.0</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-5 pt-10 pb-5">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="text-white text-xl p-1 hover:opacity-75 transition-opacity"
        >
          ☰
        </button>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-yellow-400 text-xs font-medium">{greeting}!</p>
          <p className="text-white text-base font-bold leading-tight">
            Hello, {userName}
          </p>
        </div>
      </div>

      {/* ── Main white panel ── */}
      <div className="flex-1 bg-white rounded-t-3xl px-15 pt-5 pb-10 overflow-y-auto">
        {/* Dashboard heading + bell */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#1a2e1a]">Dashboard</h1>
          <div className="relative">
            <button
              onClick={() => setShowNotifPopup((v) => !v)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">🔔</span>
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {pendingCount}
                </span>
              )}
            </button>
            {showNotifPopup && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 w-52 z-10">
                <p className="text-sm text-gray-700 font-medium">
                  {pendingCount > 0
                    ? `You have ${pendingCount} pending order(s).`
                    : "No pending orders."}
                </p>
                <button
                  onClick={() => setShowNotifPopup(false)}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── To be paid cards ── */}
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
          To be paid
        </p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Farmer Payments", value: farmerTotal },
            { label: "Employee Payments", value: employeeTotal },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-gray-500 leading-tight">
                  {card.label}
                </p>
                <span className="text-green-700 text-base">💰</span>
              </div>
              <p className="text-lg font-bold text-[#1f6f4a]">
                Rs. {loading ? "—" : card.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* ── Quick access ── */}
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
          Quick access
        </p>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {QUICK_ACCESS.map((item) => (
            <button
              key={item.route}
              onClick={() => onNavigate?.(item.route)}
              className="flex flex-col items-center justify-center bg-gray-50 hover:bg-green-50 border border-gray-100 rounded-2xl py-3 gap-1 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[11px] text-gray-600 text-center leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* ── Recent orders ── */}
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
          Recent orders
        </p>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-5">
          {orderLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">
              No recent orders found
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, i) => (
                <div key={order.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1a2e1a]">
                        👤 {order.buyerName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        💰 Rs. {order.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">📅 {order.date}</p>
                      {!order.isSubmitted && (
                        <span className="text-xs text-red-500 font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  {i < recentOrders.length - 1 && (
                    <hr className="border-gray-100 mt-3" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Ordered vegetables ── */}
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
          Ordered vegetables
        </p>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          {orderedVegs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">
              No pending vegetable orders
            </p>
          ) : (
            <div className="space-y-2">
              {orderedVegs.map((veg, i) => (
                <div key={veg.id}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#1a2e1a]">
                      {veg.name}
                    </p>
                    <span className="text-sm font-semibold text-orange-500">
                      {veg.quantity} kg
                    </span>
                  </div>
                  {i < orderedVegs.length - 1 && (
                    <hr className="border-gray-100 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

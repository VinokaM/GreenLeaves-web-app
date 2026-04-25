// SubmittedOrders.jsx
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../db/firebase";
import { format } from "date-fns";

export default function SubmittedOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFiltered] = useState([]);
  const [searchBuyer, setSearchBuyer] = useState("");
  const [searchInvoice, setSearchInvoice] = useState("");
  const [searchDate, setSearchDate] = useState("");
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
          collection(db, "submittedOrders"),
          orderBy("submittedAt", "desc"),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(data);
        setFiltered(data);
      } catch (e) {
        showAlert(e.message);
      }
    };
    fetchOrders();
  }, []);

  // ── Filter logic ──
  useEffect(() => {
    let result = orders;

    if (searchBuyer) {
      result = result.filter((o) =>
        (o.buyerName || "").toLowerCase().includes(searchBuyer.toLowerCase()),
      );
    }

    if (searchInvoice) {
      result = result.filter((o) =>
        String(o.invoiceNumber ?? "").includes(searchInvoice),
      );
    }

    if (searchDate) {
      result = result.filter((o) => {
        try {
          return (
            format(o.submittedAt?.toDate?.() || new Date(0), "yyyy-MM-dd") ===
            searchDate
          );
        } catch {
          return false;
        }
      });
    }

    setFiltered(result);
  }, [searchBuyer, searchInvoice, searchDate, orders]);

  // ── PDF invoice generation using browser print ──
  const generateInvoicePDF = (order) => {
    setIsLoading(true);
    const currentDate = new Date().toLocaleDateString();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice #${order.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .company { font-size: 20px; font-weight: bold; color: #4CAF50; }
          .invoice-title { font-size: 14px; margin-top: 6px; }
          .info { margin: 20px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #4CAF50; color: #fff; }
          .amount { text-align: right; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">Green Leaves Agro Farm (pvt) ltd</div>
          <div class="invoice-title">Invoice #${order.invoiceNumber}</div>
          <div class="invoice-title">0774096781  |  0760466012</div>
          <div class="invoice-title">Sippikalana, Mugunuwatawana, Sri Lanka</div>
          <div class="invoice-title">greenleavesagrofarm@gmail.com</div>
        </div>
        <div class="info">
          <p><strong>${order.buyerName}</strong></p>
          <p><strong>Date:</strong> ${currentDate}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Vegetable</th>
              <th>Quantity (kg)</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (veg) => `
              <tr>
                <td>${veg.name}</td>
                <td>${veg.quantity}</td>
                <td>Rs.${veg.price}</td>
                <td class="amount">Rs.${(veg.price * veg.quantity).toLocaleString()}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div class="info">
          <p>Transport: Rs.${order.transport}</p>
          <p>Discount: Rs.${order.discount}</p>
          <h3>Total: Rs.${order.finalTotal}</h3>
        </div>
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated report. No signature required.</p>
          <p>© 2025 Green Leaves Agro Farm (pvt) ltd.</p>
          <br/>
          <p>Powered by Ceylon Cyber Mart · 0725000987</p>
        </div>
      </body>
      </html>
    `;

    // Open in new tab and trigger browser print dialog
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      setIsLoading(false);
    };
  };

  const inputCls =
    "w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a2e1a] focus:ring-2 focus:ring-[#1a2e1a]/10 transition-all placeholder-gray-400";

  return (
    <div className="pb-10">
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

      {/* ── Search filters ── */}
      <div className="space-y-2 mb-4">
        <input
          type="text"
          placeholder="Search by buyer name"
          value={searchBuyer}
          onChange={(e) => setSearchBuyer(e.target.value)}
          className={inputCls}
        />

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Search by invoice number"
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            className={inputCls}
          />

          {/* Native date picker — works on all browsers */}
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="bg-orange-500 text-white text-sm rounded-xl px-3 py-2 outline-none cursor-pointer min-w-[44px] border-none"
            title="Filter by date"
          />

          {searchDate && (
            <button
              onClick={() => setSearchDate("")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-3 rounded-xl whitespace-nowrap transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Active date filter badge */}
        {searchDate && (
          <p className="text-xs text-orange-600 font-medium">
            📅 Filtering by: {format(new Date(searchDate), "dd MMM yyyy")}
          </p>
        )}
      </div>

      {/* ── Orders list ── */}
      {filteredOrders.length === 0 ? (
        <p className="text-center text-gray-400 text-sm mt-10">
          No orders found.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {order.buyerName}
                  </p>
                  <p className="text-sm font-bold text-orange-500">
                    Rs. {order.finalTotal?.toLocaleString()}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                  #{order.invoiceNumber}
                </span>
              </div>

              {/* Transport & discount */}
              <div className="flex gap-4 mb-2 mt-2">
                <p className="text-xs text-gray-500">
                  🚛 Transport:{" "}
                  <span className="font-medium text-gray-700">
                    Rs. {order.transport}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  🏷 Discount:{" "}
                  <span className="font-medium text-gray-700">
                    Rs. {order.discount}
                  </span>
                </p>
              </div>

              {/* Vegetables */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                🥦 Vegetables
              </p>
              <div className="space-y-0.5 mb-3">
                {order.items.map((veg, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    👉 {veg.name} — {veg.quantity}kg × Rs.{veg.price}
                  </p>
                ))}
              </div>

              {/* Date */}
              <p className="text-xs text-gray-400 text-right mb-3">
                {format(order.submittedAt.toDate(), "dd MMM yyyy hh:mm a")}
              </p>

              {/* Download button */}
              <button
                onClick={() => generateInvoicePDF(order)}
                disabled={isLoading}
                className="w-full bg-[#1a2e1a] hover:bg-[#2a4a2a] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? "Generating…" : "🖨 Download Invoice"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

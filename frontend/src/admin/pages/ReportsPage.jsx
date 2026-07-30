import React, { useState } from "react";
import { Download } from "lucide-react";
import { getSalesReport, getBestSellersReport, getInventoryReport, getCustomersReport } from "../api/adminApi.js";

const REPORTS = [
  { key: "sales", label: "Sales Report", fetch: getSalesReport, withDates: true },
  { key: "best-sellers", label: "Best Sellers", fetch: getBestSellersReport },
  { key: "inventory", label: "Inventory Report", fetch: getInventoryReport },
  { key: "customers", label: "Customers Report", fetch: getCustomersReport },
];

export default function ReportsPage() {
  const [active, setActive] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const report = REPORTS.find((r) => r.key === active);

  const runReport = async () => {
    setLoading(true);
    try {
      const params = report.withDates && (from || to) ? { from, to } : {};
      const res = await report.fetch(params);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const params = report.withDates && (from || to) ? { from, to, format: "csv" } : { format: "csv" };
    const query = new URLSearchParams(params).toString();
    window.open(`/api/admin/reports/${report.key}?${query}`, "_blank");
  };

  const rows = data?.rows || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-maroon">Reports & Analytics</h2>

      <div className="flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            onClick={() => { setActive(r.key); setData(null); }}
            className={`px-4 py-2 rounded-full text-sm border ${active === r.key ? "bg-rakhired text-white border-rakhired" : "border-gray-300 text-gray-600 hover:border-rakhired"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-wrap items-end gap-3">
        {report.withDates && (
          <>
            <div>
              <label className="text-xs text-gray-500 block mb-1">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </>
        )}
        <button onClick={runReport} className="bg-gray-800 text-white px-5 py-2 rounded-full text-sm hover:bg-gray-900">
          {loading ? "Running..." : "Run Report"}
        </button>
        <button onClick={downloadCSV} className="flex items-center gap-1 border border-gray-300 px-5 py-2 rounded-full text-sm hover:bg-gray-50">
          <Download size={14} /> Export CSV
        </button>
        <span className="text-xs text-gray-400">PDF/Excel export: use "Print" from your browser on this view, or process the CSV in Excel.</span>
      </div>

      {data?.totalRevenue !== undefined && (
        <div className="flex gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-sm"><span className="text-gray-400">Total Revenue:</span> <span className="font-semibold">₹{data.totalRevenue}</span></div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-sm"><span className="text-gray-400">Total Orders:</span> <span className="font-semibold">{data.totalOrders}</span></div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                {Object.keys(rows[0]).map((k) => <th key={k} className="px-4 py-3 capitalize">{k}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  {Object.values(row).map((v, j) => <td key={j} className="px-4 py-2">{String(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

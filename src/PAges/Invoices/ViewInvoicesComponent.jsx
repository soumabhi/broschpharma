// /components/ViewInvoicesComponent.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Download, Store as StoreIcon } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import PDFGeneration from "./PDFGenerations"; // We'll create this next

const ViewInvoicesComponent = ({ userRole, selectedStore }) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [invoices, setInvoices] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeFilter, setStoreFilter] = useState("");
  const [stockData, setStockData] = useState([]);
  const [hoverStoreId, setHoverStoreId] = useState(null);

  useEffect(() => {
    axios.get(`${apiUrl}/stores`).then(res => setStores(res.data));
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [userRole, selectedStore, storeFilter]);

  const fetchInvoices = async () => {
    try {
      let url = `${apiUrl}/invoices`;
      if (userRole === "store" && selectedStore) {
        url += `?storeId=${selectedStore._id}`;
      } else if (userRole === "central" && storeFilter) {
        url += `?storeId=${storeFilter}`;
      }
      const res = await axios.get(url);
      setInvoices(res.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const handleHoverStore = async (storeId) => {
    try {
      const res = await axios.get(`${apiUrl}/stores/${storeId}/stock`);
      setStockData(res.data || []);
      setHoverStoreId(storeId);
    } catch (error) {
      console.error("Error fetching stock:", error);
    }
  };

  const handleDownloadPdf = async (invoice) => {
    const blob = await pdf(<PDFGeneration invoice={invoice} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {userRole === "central" && (
        <div className="mb-4">
          <label className="text-sm">Filter by Store:</label>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="p-2 border rounded w-full"
          >
            <option value="">All Stores</option>
            {stores.map((store) => (
              <option key={store._id} value={store._id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Invoice</th>
            <th className="p-2">Date</th>
            <th className="p-2">Bill To</th>
            <th className="p-2">Ship To</th>
            <th className="p-2">Store</th>
            <th className="p-2">Total</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv._id} className="hover:bg-gray-50">
              <td className="p-2">{inv.invoice}</td>
              <td className="p-2">{new Date(inv.date).toLocaleDateString()}</td>
              <td className="p-2">{inv.bill_to?.billerName || "-"}</td>
              <td className="p-2">{inv.ship_to || "-"}</td>
              <td
                className="p-2 relative"
                onMouseEnter={() => handleHoverStore(inv.storeId?._id)}
                onMouseLeave={() => setHoverStoreId(null)}
              >
                {inv.storeId?.name || "-"}
                {userRole === "central" && hoverStoreId === inv.storeId?._id && (
                  <div className="absolute z-20 bg-white shadow p-2 border rounded text-xs top-full mt-1">
                    {stockData.length > 0 ? (
                      stockData.map((s, i) => (
                        <div key={i}>{s.product}: {s.stock}</div>
                      ))
                    ) : (
                      <div>No stock data</div>
                    )}
                  </div>
                )}
              </td>
              <td className="p-2">₹{inv.total || "-"}</td>
              <td className="p-2">
                <button onClick={() => handleDownloadPdf(inv)} className="flex items-center space-x-1 text-blue-600">
                  <Download size={14} />
                  <span>PDF</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewInvoicesComponent;

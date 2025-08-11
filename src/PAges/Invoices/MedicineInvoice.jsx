// /pages/MedicineInvoice.jsx
import React, { useState, useEffect } from "react";
import StoreSelector from "./StoreSelector";
import CreateInvoiceComponent from "./CreateInvoiceComponent";
import ViewInvoicesComponent from "./ViewInvoicesComponent";

import { Shield, Store, ChevronRight } from "lucide-react";
import axios from "axios";

const MedicineInvoice = () => {
  const [userRole, setUserRole] = useState(null); // 'central' or 'store'
  const [selectedStore, setSelectedStore] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stores, setStores] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (userRole === "store") {
      axios.get(`${apiUrl}/stores`)
        .then(res => setStores(res.data))
        .catch(err => console.error("Error fetching stores:", err));
    }
  }, [userRole]);

  const handleLogin = (role) => {
    setUserRole(role);
    if (role === "central") {
      setIsAuthenticated(true);
    }
  };

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setIsAuthenticated(true);
  };

  // Login and Store selection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        {userRole === null ? (
          <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Medicine Invoice System</h1>
            <div className="space-y-4">
              <button
                onClick={() => handleLogin("central")}
                className="w-full flex justify-between items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium">Central User</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>
              <button
                onClick={() => handleLogin("store")}
                className="w-full flex justify-between items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <Store className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Store User</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        ) : (
          <StoreSelector stores={stores} onSelectStore={handleStoreSelect} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Medicine Invoice</h1>
          <div className="bg-gray-100 text-xs px-3 py-1 rounded-full">
            {userRole === "central" ? "Central User" : `Store: ${selectedStore?.name}`}
          </div>
        </div>
        <div className="space-x-2">
          <button onClick={() => setActiveTab("create")} className={`px-4 py-2 rounded ${activeTab === "create" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}>Create Invoice</button>
          <button onClick={() => setActiveTab("list")} className={`px-4 py-2 rounded ${activeTab === "list" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}>View Invoices</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4">
        {activeTab === "create" && <CreateInvoiceComponent userRole={userRole} selectedStore={selectedStore} />}
        {activeTab === "list" && <ViewInvoicesComponent userRole={userRole} selectedStore={selectedStore} />}
      </div>
    </div>
  );
};

export default MedicineInvoice;

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Eye,
  User,
  Calendar,
  Stethoscope,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Package,
  Building2,
  Zap,
  Plus,
  Search,
  Download,
} from "lucide-react";
import axios from "axios";
import PDFGeneration from "../PDF/PDFGeneration";

const ShipperConfirmation = () => {
  // Default form data utility
  const defaultFormData = {
    serialNo: "",
    patientDetails: {
      patientName: "",
      patientUhid: "",
      patientGender: "Male",
      opdId: "",
      IpdId: "",
      patientType: "hospital",
      patientCategory: "ABPMJAY",
      otDate: "",
      SurgeonName: "",
      insuranceCompany: "",
      packageAmount: "",
      remarks: "",
    },
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedIOL, setSelectedIOL] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // For immediate input display
  const [filterStatus, setFilterStatus] = useState("available");
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hoveredIOL, setHoveredIOL] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [invoiceLogs, setInvoiceLogs] = useState([]);
  const [overallStats, setOverallStats] = useState({
    available: 0,
    consumed: 0,
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [availableLimits] = useState([10, 25, 50, 100]);
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const logedinUser = JSON.parse(localStorage.getItem("user"));
  const shipperId = logedinUser?.shippingUnitId;
  // IOL inventory data from API
  const [iolInventory, setIolInventory] = useState([]);

  // Toast notification function
  const showToast = useCallback((message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 5000);
  }, []);

  const fetchIolInventory = async (page = 1, limit = itemsPerPage) => {
    if (!shipperId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${apiUrl}/billers/shipperwiseInventory`,
        {
          params: {
            shipperId: shipperId,
            storeStatus: filterStatus === "all" ? "" : filterStatus,
            search: searchTerm,
            page: page,
            limit: limit,
          },
        }
      );
      console.log("IOL Inventory Response:", response.data);
      setIolInventory(response.data.results);
      setTotalItems(response.data.total);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error("Error fetching IOL inventory:", error);
      showToast(
        error.response?.data?.message || "Failed to load inventory data",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch overall statistics (independent of filters)
  const fetchOverallStats = async () => {
    if (!shipperId) return;

    try {
      const response = await axios.get(
        `${apiUrl}/billers/shipperwiseInventory`,
        {
          params: {
            shipperId: shipperId,
            storeStatus: "", // Get all statuses
            search: "", // No search filter
            page: 1,
            limit: 10000, // Large limit to get all records for counting
          },
        }
      );

      const allItems = response.data.results;
      const availableCount = allItems.filter(
        (item) => item.storeStatus === "available"
      ).length;
      const consumedCount = allItems.filter(
        (item) => item.storeStatus === "consumed"
      ).length;

      setOverallStats({
        available: availableCount,
        consumed: consumedCount,
      });
    } catch (error) {
      console.error("Error fetching overall stats:", error);
      // Don't show error toast for stats, as it's secondary functionality
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchIolInventory(currentPage, itemsPerPage);
  }, [shipperId, filterStatus, searchTerm, currentPage, itemsPerPage]);

  // Fetch overall statistics (independent of filters)
  useEffect(() => {
    fetchOverallStats();
  }, [shipperId]); // Only depends on shipperId, not on filters

  // Fetch invoice logs from backend
  useEffect(() => {
    axios
      .get(`${apiUrl}/invoices`)
      .then((res) => {
        setInvoiceLogs(res.data?.data);
      })
      .catch(() => setInvoiceLogs([]));
  }, []);

  // Modal scroll lock effect
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.patientDetails) {
      setFormData({
        ...formData,
        patientDetails: {
          ...formData.patientDetails,
          [name]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const openModal = (iol = null) => {
    if (iol) {
      setSelectedIOL(iol);
      setFormData({
        ...formData,
        serialNo: iol.serialNo,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIOL(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Call the new confirmConsume API endpoint
      await axios.post(`${apiUrl}/billers/confirmConsume`, {
        serialNo: formData.serialNo,
        patientDetails: formData.patientDetails,
        shipperId: shipperId,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        closeModal();
        // Refresh inventory after modal closes
        fetchIolInventory(currentPage, itemsPerPage);
        // Refresh overall stats
        fetchOverallStats();
      }, 2000);
    } catch (error) {
      console.error("Error marking IOL as consumed:", error);
      showToast(
        error.response?.data?.message || "Failed to mark IOL as consumed",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate || !expiryDate.year || !expiryDate.month || !expiryDate.day)
      return false;
    const today = new Date();
    const expire = new Date(
      expiryDate.year,
      expiryDate.month - 1,
      expiryDate.day
    );
    const diffTime = expire - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate || !expiryDate.year || !expiryDate.month || !expiryDate.day)
      return false;
    const today = new Date();
    const expire = new Date(
      expiryDate.year,
      expiryDate.month - 1,
      expiryDate.day
    );
    return expire < today;
  };

  // Pagination functions
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(totalItems / itemsPerPage)) {
      setCurrentPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    setItemsPerPage(parseInt(newLimit));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Function to handle invoice download for consumed IOLs
  const handleInvoiceDownload = async (iol) => {
    try {
      // const invoice = invoiceLogs.find(
      //   (inv) =>
      //     Array.isArray(inv.items) &&
      //     inv.items.some(
      //       (it) => it.serialNo === iol.serialNo
      //     )
      // );
      const response = await axios.get(
        `${apiUrl}/invoices?search=${iol?.saleInvoiceNo}`
      );
      let invoice = response?.data?.data[0]

      if (!invoice) {
        showToast("No invoice found for this IOL.", "error");
        return;
      }

      // Prepare the invoice data for PDF generation
      const invoiceData = {
        ...invoice,
        discount: invoice.discount ?? 0,
        bill_to_name: invoice.bill_to?.billerName || "",
        bill_to_address: invoice.bill_to?.billerAddress || "",
        bill_to_gst: invoice.bill_to?.billerGst || "",
        bill_to_phone: invoice.bill_to?.billerPhone || "",
        bill_to_state: invoice.bill_to?.billerState || "",
        ship_to_name: (() => {
          if (
            invoice.billedToShippingUnitId === "_USE_BILLER_" ||
            !invoice.billedToShippingUnitId
          ) {
            return invoice.bill_to?.billerName || "";
          }
          const su = invoice.bill_to?.shippingUnit?.find(
            (u) => u._id === invoice.billedToShippingUnitId
          );
          return su?.shippingUnitName || "";
        })(),
        ship_to_address: (() => {
          if (
            invoice.billedToShippingUnitId === "_USE_BILLER_" ||
            !invoice.billedToShippingUnitId
          ) {
            return invoice.bill_to?.billerAddress || "";
          }
          const su = invoice.bill_to?.shippingUnit?.find(
            (u) => u._id === invoice.billedToShippingUnitId
          );
          return su?.shippingUnitAddress || "";
        })(),
        ship_to_phone: (() => {
          if (
            invoice.billedToShippingUnitId === "_USE_BILLER_" ||
            !invoice.billedToShippingUnitId
          ) {
            return invoice.bill_to?.billerPhone || "";
          }
          const su = invoice.bill_to?.shippingUnit?.find(
            (u) => u._id === invoice.billedToShippingUnitId
          );
          return su?.shippingPhone || "";
        })(),
        ship_to_state: (() => {
          if (
            invoice.billedToShippingUnitId === "_USE_BILLER_" ||
            !invoice.billedToShippingUnitId
          ) {
            return invoice.bill_to?.billerState || "";
          }
          const su = invoice.bill_to?.shippingUnit?.find(
            (u) => u._id === invoice.billedToShippingUnitId
          );
          return su?.shippingState || "";
        })(),
        items: (invoice.items || []).map((itm) => ({
          ...itm,
          item_name: itm.item_name || "",
          hsn_sac: itm.hsn || itm.Hsn || "-",
          serial_no: itm.serial_no || itm.serialNo || "-",
          power: itm.power || "",
          expDate:
            itm.exp_date &&
              itm.exp_date.day != null &&
              itm.exp_date.month != null &&
              itm.exp_date.year != null
              ? `${itm.exp_date.day
                ?.toString()
                .padStart(2, "0")}/${itm.exp_date.month
                  ?.toString()
                  .padStart(2, "0")}/${itm.exp_date.year}`
              : itm.expDate || "",
          quantity: itm.quantity || 0,
          unit: itm.unit || "PCS",
          price_per_unit: itm.selling_price || itm.price_per_unit || 0,
          gst_percent: itm.gst_percent ?? itm.gstPercentage ?? 0,
          gst: itm.gst ?? itm.gstAmount ?? 0,
          amount: itm.amount || 0,
        })),
      };

      // Create a temporary link element for download
      const downloadLink = document.createElement("a");
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);

      // Use the PDFDownloadLink approach programmatically
      import("@react-pdf/renderer")
        .then(({ pdf }) => {
          const doc = <PDFGeneration invoice={invoiceData} />;
          pdf(doc)
            .toBlob()
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              downloadLink.href = url;
              downloadLink.download = `Invoice_${iol.serialNo}_${iol.patientDetails?.patientName || "Patient"
                }.pdf`;
              downloadLink.click();

              // Clean up
              document.body.removeChild(downloadLink);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            })
            .catch((error) => {
              console.error("PDF generation error:", error);
              showToast("Failed to generate invoice PDF.", "error");
              document.body.removeChild(downloadLink);
            });
        })
        .catch((error) => {
          console.error("PDF import error:", error);
          showToast("Failed to load PDF generation library.", "error");
          document.body.removeChild(downloadLink);
        });
    } catch (error) {
      console.error("Error preparing invoice download:", error);
      showToast("Failed to prepare invoice download.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Simple Centered Title */}
      <div className="w-full mx-auto mb-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center uppercase">
          IOL Inventory Management
        </h1>
      </div>

      {/* Filters and Search Section */}
      <div className="w-full mx-auto mb-4">
        <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search
                  className={`w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 ${loading ? "text-blue-500 animate-pulse" : "text-gray-500"
                    }`}
                />
                <input
                  type="text"
                  placeholder="Search IOLs by product, serial, or power..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search IOL inventory"
                  className="pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm w-72 transition-all duration-200"
                />
                {loading && searchInput && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter IOLs by status"
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm min-w-[120px] transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="available">Available Only</option>
                <option value="consumed">Consumed Only</option>
              </select>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Available</span>
                <div className="w-5 h-5 bg-green-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {overallStats.available}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-medium text-red-800">Consumed</span>
                <div className="w-5 h-5 bg-red-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {overallStats.consumed}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* IOL Inventory Table */}
      <div className="w-full mx-auto">
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div
            className="overflow-x-auto"
            style={{ maxHeight: "calc(100vh - 300px)", minHeight: "500px" }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800"></div>
                  <p className="text-gray-600 font-medium">
                    Loading inventory data...
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      #
                    </th>
                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Product Details
                    </th>
                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Serial Number
                    </th>
                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Expiry Date
                    </th>
                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Power
                    </th>
                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Patient
                    </th>
                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Surgery Type
                    </th>
                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Status
                    </th>
                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {iolInventory.length > 0 ? (
                    iolInventory.map((iol, idx) => (
                      <tr
                        key={iol._id}
                        className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 border-b border-gray-100"
                      >
                        <td className="px-2 py-2 whitespace-nowrap text-gray-900 font-medium text-xs text-left">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="text-left">
                                <div className="relative group">
                                  <span className="cursor-help hover:text-green-600 transition-colors duration-200">
                                    {iol.productDetailsId?.ProductName &&
                                      iol.productDetailsId?.ProductName.length >
                                      20
                                      ? `${iol.productDetailsId?.ProductName.substring(
                                        0,
                                        20
                                      )}...`
                                      : iol.productDetailsId?.ProductName}
                                  </span>
                                  {iol.productDetailsId?.ProductName &&
                                    iol.productDetailsId?.ProductName.length >
                                    20 && (
                                      <div className="absolute z-20 invisible group-hover:visible w-64 p-4 text-xs bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-xl shadow-2xl top-8 left-0 transform transition-all duration-300">
                                        <div className="flex items-center mb-3">
                                          <div className="w-6 h-6 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full flex items-center justify-center mr-2">
                                            <Search className="w-3 h-3 text-white" />
                                          </div>
                                          <div>
                                            <h4 className="font-bold text-gray-900 text-sm">
                                              Full Product
                                            </h4>
                                            <p className="text-gray-600 text-[10px]">
                                              Complete Product Name
                                            </p>
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                          <p className="text-gray-900 font-medium text-xs leading-relaxed break-words">
                                            {iol.productDetailsId?.ProductName}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap font-mono text-xs text-gray-900 text-left">
                          <div className="relative group">
                            <span className="max-w-[100px] inline-block truncate">
                              {iol.serialNo?.length > 12
                                ? `${iol.serialNo.substring(0, 12)}...`
                                : iol.serialNo}
                            </span>
                            {iol.serialNo?.length > 12 && (
                              <div className="absolute z-20 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-md px-2 py-1 -top-8 left-0 whitespace-nowrap shadow-lg border border-gray-700">
                                {iol.serialNo}
                                <div className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                            <span
                              className={`text-xs font-medium ${isExpired(iol.expiryDate)
                                ? "text-red-600 bg-red-50 px-1 py-0.5 rounded"
                                : isExpiringSoon(iol.expiryDate)
                                  ? "text-orange-600 bg-orange-50 px-1 py-0.5 rounded"
                                  : "text-gray-900"
                                }`}
                            >
                              {iol?.expiryDate
                                ? [
                                  iol.expiryDate.day
                                    ? String(iol.expiryDate.day).padStart(
                                      2,
                                      "0"
                                    )
                                    : null,
                                  iol.expiryDate.month
                                    ? String(iol.expiryDate.month).padStart(
                                      2,
                                      "0"
                                    )
                                    : null,
                                  iol.expiryDate.year || null,
                                ]
                                  .filter(Boolean)
                                  .join("-")
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                              {iol.power || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="font-mono text-xs">
                              {iol?.patientDetails?.patientName || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="font-mono text-xs">
                              {iol?.patientDetails?.patientCategory || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-left">
                          {iol.storeStatus === "available" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 shadow-sm">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300 shadow-sm">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Consumed
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-left">
                          {iol.storeStatus === "available" ? (
                            <button
                              onClick={() => openModal(iol)}
                              disabled={isExpired(iol.expiryDate)}
                              aria-label={
                                isExpired(iol.expiryDate)
                                  ? "IOL expired, cannot consume"
                                  : `Mark IOL ${iol.serialNo} as consumed`
                              }
                              className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-300 transform hover:-translate-y-0.5 ${isExpired(iol.expiryDate)
                                ? "text-gray-500 cursor-not-allowed bg-gray-100 border border-gray-300"
                                : "text-white bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 shadow-lg hover:shadow-xl border border-gray-600"
                                }`}
                            >
                              {isExpired(iol.expiryDate) ? (
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  Expired
                                </>
                              ) : (
                                <>
                                  <Package className="w-3 h-3 mr-1" />
                                  Consume
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex justify-start space-x-2">
                              {iol.patientDetails && (
                                <>
                                  {/* View Details Button */}
                                  <div
                                    className="relative"
                                    onMouseEnter={() => setHoveredIOL(iol._id)}
                                    onMouseLeave={() => setHoveredIOL(null)}
                                  >
                                    <button
                                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                      aria-label={`View details for consumed IOL ${iol.serialNo}`}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                    {hoveredIOL === iol._id &&
                                      iol.patientDetails && (
                                        <div className="absolute z-20 w-64 p-4 text-xs bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-xl shadow-2xl top-8 right-0 transform transition-all duration-300">
                                          <div className="flex items-center mb-3">
                                            <div className="w-6 h-6 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full flex items-center justify-center mr-2">
                                              <User className="w-3 h-3 text-white" />
                                            </div>
                                            <div>
                                              <h4 className="font-bold text-gray-900 text-sm">
                                                Patient Details
                                              </h4>
                                              <p className="text-gray-600 text-[10px]">
                                                Consumption Information
                                              </p>
                                            </div>
                                          </div>
                                          <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <div className="flex justify-between">
                                              <span className="font-semibold text-gray-700 text-[10px]">
                                                Name:
                                              </span>
                                              <span className="text-gray-900 font-medium text-[10px] max-w-[100px] truncate">
                                                {iol.patientDetails
                                                  .patientName || "N/A"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="font-semibold text-gray-700 text-[10px]">
                                                UHID:
                                              </span>
                                              <span className="text-gray-900 font-mono text-[10px]">
                                                {iol.patientDetails
                                                  .patientUhid || "N/A"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="font-semibold text-gray-700 text-[10px]">
                                                Date:
                                              </span>
                                              <span className="text-gray-900 font-medium text-[10px]">
                                                {formatDate(
                                                  iol.patientDetails.otDate
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="font-semibold text-gray-700 text-[10px]">
                                                Surgeon:
                                              </span>
                                              <span className="text-gray-900 font-medium text-[10px] max-w-[80px] truncate">
                                                {iol.patientDetails
                                                  .SurgeonName || "N/A"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                  </div>

                                  {/* Download Invoice Button */}
                                  <button
                                    onClick={() => handleInvoiceDownload(iol)}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    aria-label={`Download invoice for IOL ${iol.serialNo}`}
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              No IOLs Found
                            </h3>
                            <p className="text-gray-600 text-xs">
                              No intraocular lenses match your current search
                              criteria.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Professional Pagination Controls */}
        <div className="mt-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-gray-700">
                  Rows per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  aria-label="Select rows per page"
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm"
                >
                  {availableLimits.map((limit) => (
                    <option key={limit} value={limit}>
                      {limit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                Showing{" "}
                <span className="font-bold text-gray-900">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-gray-900">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of <span className="font-bold text-gray-900">{totalItems}</span>{" "}
                entries
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        aria-label={`Go to page ${pageNum}`}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === pageNum
                          ? "bg-gradient-to-r from-gray-800 to-black text-white shadow-md transform -translate-y-0.5"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNum}
                        className="px-1 py-1 text-xs text-gray-500 font-bold"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl border border-gray-300">
            {showSuccess ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <CheckCircle className="w-6 h-6 text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  IOL Consumption Confirmed!
                </h2>
                <p className="text-gray-600 text-sm">
                  The intraocular lens has been successfully marked as consumed.
                </p>
              </div>
            ) : (
              <>
                {/* Compact Modal Header */}
                <div className="bg-black p-3 rounded-t-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-100 rounded-lg flex items-center justify-center shadow-lg">
                        <Package className="w-4 h-4 text-gray-800" />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-white">
                          You Are Going To Consume IOL{" "}
                          <span className="font-bold text-green-400">
                            {selectedIOL?.productDetailsId?.ProductName ||
                              "N/A"}
                          </span>{" "}
                          With Power{" "}
                          <span className="font-bold text-yellow-400">
                            {selectedIOL?.power || "N/A"}
                          </span>
                        </h2>
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-1.5 hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4 text-gray-300 group-hover:text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
                  {/* IOL Information Card - Ultra Compact */}
                  {selectedIOL && (
                    <div className="mb-4 p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                          <Eye className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          IOL Details
                        </h3>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white p-2 rounded border border-gray-300 shadow-sm">
                          <span className="font-medium text-gray-600 text-[10px] uppercase">
                            Product
                          </span>
                          <p className="text-gray-900 font-semibold truncate text-xs">
                            {selectedIOL.productDetailsId?.ProductName || "N/A"}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-300 shadow-sm">
                          <span className="font-medium text-gray-600 text-[10px] uppercase">
                            Power
                          </span>
                          <p className="text-gray-900 font-semibold font-mono text-xs">
                            {selectedIOL.power || "N/A"}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-300 shadow-sm">
                          <span className="font-medium text-gray-600 text-[10px] uppercase">
                            Serial No
                          </span>
                          <p className="text-gray-900 font-semibold font-mono text-xs">
                            {formData.serialNo || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Patient & Surgery Information - Ultra Compact Side by Side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                    {/* Patient Information */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          Patient Information
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                              Patient Name *
                            </label>
                            <input
                              type="text"
                              name="patientName"
                              value={formData.patientDetails.patientName}
                              onChange={handleChange}
                              placeholder="Enter patient name"
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                              UHID *
                            </label>
                            <input
                              type="text"
                              name="patientUhid"
                              value={formData.patientDetails.patientUhid}
                              onChange={handleChange}
                              placeholder="Unique Health ID"
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                              Gender
                            </label>
                            <select
                              name="patientGender"
                              value={formData.patientDetails.patientGender}
                              onChange={handleChange}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                              OPD ID
                            </label>
                            <input
                              type="text"
                              name="opdId"
                              value={formData.patientDetails.opdId}
                              onChange={handleChange}
                              placeholder="OPD ID"
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                              IPD ID
                            </label>
                            <input
                              type="text"
                              name="IpdId"
                              value={formData.patientDetails.IpdId}
                              onChange={handleChange}
                              required
                              placeholder="IPD ID"
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                              Patient Type
                            </label>
                            <select
                              name="patientType"
                              value={formData.patientDetails.patientType}
                              onChange={handleChange}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            >
                              <option value="hospital">Hospital</option>
                              <option value="outreach">Outreach</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                              Patient Category
                            </label>
                            <select
                              name="patientCategory"
                              value={formData.patientDetails.patientCategory}
                              onChange={handleChange}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            >
                              <option value="ABPMJAY">ABPMJAY/Gjay</option>
                              <option value="DBCS">DBCS</option>
                              <option value="ECHS">ECHS</option>
                              <option value="CGHS">CGHS</option>
                              <option value="INSURANCE">INSURANCE</option>
                              <option value="PACKAGE">PACKAGE</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        {/* Conditional Fields */}
                        {(["INSURANCE", "PACKAGE", "other"].includes(
                          formData?.patientDetails?.patientCategory
                        ) ||
                          formData?.patientDetails?.patientCategory ===
                          "INSURANCE") && (
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-300">
                              {["INSURANCE", "PACKAGE"].includes(
                                formData?.patientDetails?.patientCategory
                              ) && (
                                  <div>
                                    <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                                      Package Amount
                                    </label>
                                    <input
                                      type="number"
                                      name="packageAmount"
                                      value={formData.patientDetails.packageAmount}
                                      onChange={handleChange}
                                      placeholder="Amount"
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                                    />
                                  </div>
                                )}
                              {formData?.patientDetails?.patientCategory ===
                                "INSURANCE" && (
                                  <div>
                                    <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                                      Insurance Company
                                    </label>
                                    <input
                                      type="text"
                                      name="insuranceCompany"
                                      value={
                                        formData.patientDetails.insuranceCompany
                                      }
                                      onChange={handleChange}
                                      placeholder="Company name"
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                                    />
                                  </div>
                                )}
                              {formData?.patientDetails?.patientCategory ===
                                "other" && (
                                  <div>
                                    <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                                      Remarks
                                    </label>
                                    <input
                                      type="text"
                                      name="remarks"
                                      value={
                                        formData.patientDetails.remarks
                                      }
                                      onChange={handleChange}
                                      placeholder="Enter any additional information"
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                                    />
                                  </div>
                                )}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Surgery Information */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                          <Stethoscope className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          Surgery Information
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                            Operation Date *
                          </label>
                          <input
                            type="date"
                            name="otDate"
                            value={formData.patientDetails.otDate}
                            onChange={handleChange}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                            Surgeon Name *
                          </label>
                          <input
                            type="text"
                            name="SurgeonName"
                            value={formData.patientDetails.SurgeonName}
                            onChange={handleChange}
                            placeholder="Operating surgeon name"
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ultra Compact Warning */}
                  <div className="mb-4 p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded border-l-4 border-gray-500 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          Important Notice
                        </p>
                        <p className="text-[10px] text-gray-700">
                          Please verify all information. Once confirmed, this
                          IOL will be permanently marked as consumed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compact Modal Footer */}
                  <div className="flex justify-end space-x-2 pt-3 border-t border-gray-300">
                    <button
                      onClick={closeModal}
                      className="px-4 py-1.5 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded transition-all duration-200 font-medium border border-gray-300 text-xs shadow-sm hover:shadow-md"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={
                        isSubmitting ||
                        !formData.serialNo ||
                        !formData.patientDetails.patientName ||
                        !formData.patientDetails.patientUhid ||
                        !formData.patientDetails.otDate ||
                        !formData.patientDetails.SurgeonName
                      }
                      className={`px-4 py-1.5 rounded font-semibold transition-all duration-200 flex items-center space-x-1 text-xs shadow-sm hover:shadow-lg ${isSubmitting ||
                        !formData.serialNo ||
                        !formData.patientDetails.patientName ||
                        !formData.patientDetails.IpdId ||
                        !formData.patientDetails.patientUhid ||
                        !formData.patientDetails.otDate ||
                        !formData.patientDetails.SurgeonName
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
                        : "bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-700 border border-gray-600"
                        }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Confirming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Confirm Consumption</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div
            className={`max-w-md p-4 rounded-lg shadow-lg border ${toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-green-50 border-green-200 text-green-800"
              }`}
          >
            <div className="flex items-center">
              {toast.type === "error" ? (
                <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => setToast({ show: false, message: "", type: "" })}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipperConfirmation;

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from 'react-toastify';

const Inventory = () => {
  // Add pageSize state, default 10
  const [pageSize, setPageSize] = useState(10);

  const [inventoryList, setInventoryList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [tempItems, setTempItems] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [dateFormat, setDateFormat] = useState("month"); // 'month' or 'date'
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Pagination states
  const [mainPage, setMainPage] = useState(1);
  const [addPage, setAddPage] = useState(1);

  // For warning on leaving unsaved data
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const warningTimerRef = useRef(null);

  // Add ref for quantity input to manage focus
  const QuantityInputRef = useRef(null);

  const [form, setForm] = useState({
    invoiceNo: "",
    productDetailsId: "",
      Quantity : "",
    manufacturingDate: "",
    expiryDate: "",
    BatchNo: "",
    broschSerialNO: "",
    billedTo: "",
    shippedTo: "",
    billingDate: "",
  });
  const apiUrl = import.meta.env.VITE_API_URL;
  // Function to format date from YYYY-MM to Month-YY format
  function formatMonthYear(dateString) {
    if (!dateString) return "";

    const [year, month] = dateString.split("-");
    if (!year || !month) return dateString;

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthIndex = parseInt(month) - 1;
    const shortYear = year.slice(-2);

    return `${months[monthIndex]}-${shortYear}`;
  }

  function formatCustomDate(dateObj) {
    if (!dateObj) return "";
    if (typeof dateObj === "string") {
      // Check if it's in YYYY-MM format (month input)
      if (dateObj.match(/^\d{4}-\d{2}$/)) {
        return formatMonthYear(dateObj);
      }
      // ISO string
      return dateObj.split("T")[0];
    }
    if (typeof dateObj === "object" && dateObj.year && dateObj.month) {
      // If day is present, use dd/mm/yyyy, else mm/yyyy
      if (dateObj.day) {
        // Pad day and month
        const day = String(dateObj.day).padStart(2, "0");
        const month = String(dateObj.month).padStart(2, "0");
        return `${day}/${month}/${dateObj.year}`;
      } else {
        const month = String(dateObj.month).padStart(2, "0");
        return `${month}/${dateObj.year}`;
      }
    }
    return "";
  }

  // Add this state for editing
  const [editIndex, setEditIndex] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Warn if leaving with unsaved data
  const handleBack = () => {
    if (
      form.invoiceNo ||
      form.productDetailsId ||
      form.Quantity ||
      form.manufacturingDate ||
      form.expiryDate ||
      form.BatchNo ||
      tempItems.length > 0
    ) {
      setShowLeaveWarning(true);
    } else {
      setFormVisible(false);
      setStep(1);
      setTempItems([]);
      setCompanyName("");
      setCompanyStep(false);
      setAddPage(1);
    }
  };

  // Auto-hide warning after 1 second
  useEffect(() => {
    if (showLeaveWarning) {
      warningTimerRef.current = setTimeout(
        () => setShowLeaveWarning(false),
        3000
      );
    }
    return () => clearTimeout(warningTimerRef.current);
  }, [showLeaveWarning]);

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${apiUrl}/iol-inventory/`);
      setInventoryList(res.data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    }
  };

  const handleCreate = async () => {
    // Validate required fields
    if (!form.manufacturingDate || !form.expiryDate || !form.BatchNo) {
      toast.warning("Please fill all fields.");
      return;
    }
    const BatchNoTrimmed = form.BatchNo.trim();
    const isDuplicate = tempItems.some(
      (item, index) =>
        item.BatchNo.trim() === BatchNoTrimmed && index !== editIndex // Allow editing the same item
    );
    if (isDuplicate) {
      toast.warning("This Serial No  already exists in the added list.");
      return;
    }

    // If editing, update the existing item
    if (editIndex !== null) {
      await handleUpdate();
      return;
    }

    // For new items, save immediately to backend
    try {
      const payload = {
        invoiceNo: form.invoiceNo,
        productDetailsId: form.productDetailsId,
        Quantity: form.Quantity,
        manufacturingDate: form.manufacturingDate,
        expiryDate: form.expiryDate,
        BatchNo: form.BatchNo,
        broschSerialNO: form.broschSerialNO,
        companyName: companyName,
      };

      const response = await axios.post(`${apiUrl}/iol-inventory/`, payload);

      // Add the created item to tempItems with the returned ID
      const newItem = {
        ...payload,
        _id: response.data._id || response.data.id, // Store the ID for future updates
      };

      setTempItems([...tempItems, newItem]);

      // Clear form
      setForm({
        ...form,
        Quantity: "",
        manufacturingDate: "",
        expiryDate: "",
        BatchNo: "",
      });

      // Focus on Quantity input after clearing the form
      setTimeout(() => {
        if (QuantityInputRef.current) {
          QuantityInputRef.current.focus();
        }
      }, 0);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      if (error.response) {
        console.error("Backend says:", error.response.data);
      }
      toast.error("Failed to create inventory item.");
    }
  };

  const handleUpdate = async () => {
    if (editIndex === null) return;

    const itemToUpdate = tempItems[editIndex];
    if (!itemToUpdate._id) {
      toast.warning("Cannot update item: No ID found.");
      return;
    }

    try {
      const payload = {
        invoiceNo: form.invoiceNo,
        productDetailsId: form.productDetailsId,
        Quantity: form.Quantity,
        manufacturingDate: form.manufacturingDate,
        expiryDate: form.expiryDate,
        BatchNo: form.BatchNo,
        companyName: companyName,
      };

      await axios.put(`${apiUrl}/iol-inventory/${itemToUpdate._id}`, payload);

      const updatedItems = tempItems.map((item, idx) =>
        idx === editIndex
          ? {
              ...item,
              Quantity: form.Quantity,
              manufacturingDate: form.manufacturingDate,
              expiryDate: form.expiryDate,
              BatchNo: form.BatchNo,
              // Keep original broschSerialNO from existing item
              broschSerialNO: item.broschSerialNO,
            }
          : item
      );

      setTempItems(updatedItems);
      setEditIndex(null);

      setForm({
        ...form,
        Quantity: "",
        manufacturingDate: "",
        expiryDate: "",
        BatchNo: "",
      });

      setTimeout(() => {
        if (QuantityInputRef.current) QuantityInputRef.current.focus();
      }, 0);
toast.success("Item updated successfully!");
    } catch (error) {
      console.error("Error updating inventory item:", error);
      if (error.response) {
        console.error("Backend says:", error.response.data);
      }
      toast.error("Failed to update inventory item.");
    }
  };

  const handleEdit = (index) => {
    const item = tempItems[index];
    setForm({
      ...form,
      Quantity: item.Quantity,
      manufacturingDate: item.manufacturingDate,
      expiryDate: item.expiryDate,
      BatchNo: item.BatchNo,
    });
    setEditIndex(index);
  };

  const handleFinalSubmit = async () => {
    // Since items are already saved, we just need to refresh the inventory
    // and reset the form state
    try {
      await fetchInventory();

      setForm({
        invoiceNo: "",
        productDetailsId: "",
        Quantity: "",
        manufacturingDate: "",
        expiryDate: "",
        BatchNo: "",
        broschSerialNO: "",
        billedTo: "",
        shippedTo: "",
        billingDate: "",
      });

      setTempItems([]);
      setFormVisible(false);
      setStep(1);
      setCompanyName("");
      setCompanyStep(false);
      setAddPage(1);
      setEditIndex(null);
toast.success("Process completed successfully!");
    } catch (error) {
      console.error("Error refreshing inventory:", error);
      toast.error("Items were saved but failed to refresh the inventory list.");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    axios.get(`${apiUrl}/iol-products/`).then((res) => {
      setProductList(res.data);
    });
    axios.get(`${apiUrl}/billers/`).then((res) => {
      setBillerList(res.data);
    });

    axios.get(`${apiUrl}/iol-masters/`).then((res) => {
      setCompanyList(res.data);
    });
  }, []);

  // 1. Add this state to fetch invoices from your API
  const [invoiceLogs, setInvoiceLogs] = useState([]);

  // 2. Fetch invoices on mount
  useEffect(() => {
    axios
      .get(`${apiUrl}/invoices`)
      .then((res) => {
        setInvoiceLogs(res.data);
      })
      .catch(() => setInvoiceLogs([]));
  }, []);

  const filteredInventory = inventoryList.filter((item) => {
    const name = item?.productDetailsId?.ProductName?.toLowerCase() || "";
    const serial = item?.BatchNo?.toLowerCase() || "";
    return (
      name.includes(searchQuery.toLowerCase()) ||
      serial.includes(searchQuery.toLowerCase())
    );
  });

  // Pagination logic for main table (use pageSize)
  const mainPageCount = Math.ceil(filteredInventory.length / pageSize);
  const mainTableData = filteredInventory.slice(
    (mainPage - 1) * pageSize,
    mainPage * pageSize
  );

  // Pagination logic for add inventory table (use pageSize)
  const addPageCount = Math.ceil(tempItems.length / pageSize);
  const addTableData = tempItems.slice(
    (addPage - 1) * pageSize,
    addPage * pageSize
  );

  // Pagination component
  const Pagination = ({ page, setPage, pageCount }) => (
    <div className="flex justify-center items-center gap-2 mt-3">
      <button
        className={`px-3 py-1 rounded-full border border-gray-300 shadow-sm text-xs font-semibold transition-all duration-150
        ${
          page <= 1
            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
            : "bg-white hover:bg-blue-300 text-blue-600 cursor-pointer"
        }`}
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous Page"
      >
        &#8592; Prev
      </button>
      <span className="px-3 py-1 rounded-full bg-blue-300 text-blue-600 font-bold text-xs border border-blue-200">
        {page} <span className="text-gray-700">/</span> {pageCount || 1}
      </span>
      <button
        className={`px-3 py-1 rounded-full border border-gray-300 shadow-sm text-xs font-semibold transition-all duration-150
        ${
          page >= pageCount
            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
            : "bg-white hover:bg-blue-100 text-blue-600 cursor-pointer"
        }`}
        onClick={() => setPage(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next Page"
      >
        Next &#8594;
      </button>
    </div>
  );

  // --- MODALS FOR ADD FLOW ---
  const [modalStep, setModalStep] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  // Open modal when Add is clicked
  useEffect(() => {
    if (formVisible) {
      setModalStep(1);
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  }, [formVisible]);

  // Modal content for add flow
  const renderAddModal = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-zinc-200 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
          {/* Step 1: Invoice Number */}
          {modalStep === 1 && (
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                setModalStep(2);
              }}
              className="space-y-5"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 bg-clip-text text-transparent mb-4">
                Enter Invoice Number
              </h2>

              <input
                type="text"
                name="invoiceNo"
                value={form.invoiceNo}
                onChange={handleChange}
                required
                className="px-4 py-3 bg-blue-100 bg-opacity-60 rounded-xl w-full text-base font-medium outline-none text-black placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400"
                placeholder="Invoice No"
                autoComplete="off"
              />

              {form.invoiceNo && (
                <div className="bg-zinc-50 rounded-lg p-3 text-sm text-zinc-600 shadow-sm">
                  <div>
                    <span className="font-semibold">Invoice No:</span>{" "}
                    <span className="text-blue-600 font-bold">
                      {form.invoiceNo}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormVisible(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="Next"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
                >
                  Next
                </button>
              </div>
            </form>
          )}
          {/* Step 2: Company Name (dropdown from iol-masters) */}
          {modalStep === 2 && (
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                setModalStep(3);
              }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 bg-clip-text text-transparent mb-4">
                Select Company Name
              </h2>

              {/* Show previous data */}
              <div className="bg-zinc-50 rounded-lg p-3 text-sm text-zinc-600 shadow-sm">
                <div>
                  <span className="font-semibold">Invoice No:</span>{" "}
                  <span className="text-blue-600 font-bold">
                    {form.invoiceNo}
                  </span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Company"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (!e.target.value) {
                      setShowDropdown(false); // Hide dropdown when input is cleared
                    } else {
                      setShowDropdown(true); // Show dropdown when typing
                    }
                  }}
                  onFocus={() => {
                    if (companyName) setShowDropdown(true);
                  }}
                  required
                  className="px-4 py-2 bg-blue-100 bg-opacity-60 rounded-xl w-full text-base font-medium outline-none text-black placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400"
                  autoComplete="off"
                />

                {showDropdown && companyName && (
                  <div className="absolute z-50 bg-white border border-gray-300 rounded-lg w-full max-h-40 overflow-y-auto mt-2 shadow-lg">
                    {companyList
                      .filter((company) =>
                        company.IOLCompanyName.toLowerCase().includes(
                          companyName.toLowerCase()
                        )
                      )
                      .map((company) => (
                        <div
                          key={company._id}
                          onClick={() => {
                            setCompanyName(company.IOLCompanyName);
                            setShowDropdown(false); // Hide dropdown on select
                          }}
                          className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                        >
                          {company.IOLCompanyName}
                        </div>
                      ))}

                    {companyList.filter((company) =>
                      company.IOLCompanyName.toLowerCase().includes(
                        companyName.toLowerCase()
                      )
                    ).length === 0 && (
                      <div className="px-3 py-2 text-gray-400 text-sm">
                        No matches found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setModalStep(1)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
                >
                  Next
                </button>
              </div>
            </form>
          )}
          Step 3: Select Product
          {modalStep === 3 && (
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.productDetailsId || form.productDetailsId === " ") {
                  toast.info("Please select a product before proceeding.");
                  return;
                }
                setModalOpen(false);
                setFormVisible(true);
                setStep(2);
                setCompanyStep(false);
              }}
              className="space-y-5"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 bg-clip-text text-transparent mb-4">
                Select Product
              </h2>

              {/* Show previous data */}
              <div className="bg-gray-100 rounded-xl p-3 text-xs text-gray-700 space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Invoice No:</span>
                  <span className="text-blue-600 font-bold">
                    {form.invoiceNo}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Company:</span>
                  <span className="text-blue-600 font-bold">{companyName}</span>
                </div>
              </div>

              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search Product"
                  value={
                    productList.find((p) => p._id === form.productDetailsId)
                      ?.ProductName || searchTerm
                  }
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    handleChange({
                      target: { name: "productDetailsId", value: "" },
                    });
                  }}
                  onFocus={() => setShowDropdown(true)}
                  required
                  className="px-4 py-2 bg-blue-100 bg-opacity-50 rounded-xl w-full text-md font-medium outline-none text-black placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400"
                  autoComplete="off"
                />

                {showDropdown && searchTerm.trim() !== "" && (
                  <div className="absolute z-50 bg-white border border-gray-300 rounded-lg w-full max-h-52 overflow-y-auto mt-2 shadow-lg">
                    {productList
                      .filter((product) =>
                        product.ProductName.toLowerCase().includes(
                          searchTerm.toLowerCase()
                        )
                      )
                      .map((product) => (
                        <div
                          key={product._id}
                          onClick={() => {
                            handleChange({
                              target: {
                                name: "productDetailsId",
                                value: product._id,
                              },
                            });
                            setSearchTerm(product.ProductName);
                            setShowDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                        >
                          {product.ProductName}
                        </div>
                      ))}

                    {productList.filter((product) =>
                      product.ProductName.toLowerCase().includes(
                        searchTerm.toLowerCase()
                      )
                    ).length === 0 && (
                      <div className="px-3 py-2 text-gray-400 text-sm">
                        No matches found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-xs transition-colors"
                  onClick={() => setModalStep(2)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-xs text-white transition-colors"
                >
                  Next
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // --- END MODALS ---

  // Only show add form after modal steps are done
  if (formVisible && step === 2 && !modalOpen) {
    return (
      <div className="min-h-screen bg-white p-8">
        {/* Leave warning modal */}
        {showLeaveWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl max-w-xs w-full text-center">
              <div className="text-gray-800 font-bold mb-4 text-lg">
                Are you complete?
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => {
                    // User clicked "Yes"
                    setFormVisible(false);
                    setStep(1);
                    setTempItems([]);
                    setCompanyName("");
                    setCompanyStep(false);
                    setAddPage(1);
                    setShowLeaveWarning(false);
                    fetchInventory();
                  }}
                  className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 text-sm"
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    // User clicked "No"
                    setShowLeaveWarning(false);
                  }}
                  className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 text-sm"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-800">Add Inventory</h1>
          <button
            className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-xs"
            onClick={handleBack}
            style={{ minWidth: "60px" }}
          >
            ← Back
          </button>
        </div>

        {/* Step 3: Add Items */}
        <div className="w-full flex flex-wrap items-center gap-2 mb-2">
          <div
            className="flex flex-row flex-1 items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-100 rounded-lg p-1 shadow border border-blue-400"
            style={{ overflowX: "auto", minWidth: 0 }}
          >
            {/* Serial No first */}
            <label className="text-xs font-bold text-blue-900">BH-No:</label>
            <input
              type="text"
              name="BatchNo"
              value={form.BatchNo}
              onChange={handleChange}
              placeholder="Serial No"
              className="p-1 bg-white border border-blue-300 flex-1 rounded h-7 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm text-xs font-semibold"
              style={{ minWidth: "100px" }}
              autoComplete="off"
            />

            {/* Date Format Selector */}
            <label className="text-xs font-bold text-blue-900">Format:</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="p-1 bg-white border border-blue-400 rounded h-7 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm text-xs font-semibold"
              style={{ minWidth: "90px", maxWidth: "120px", flexShrink: 0 }}
            >
              <option value="month">MM/YYYY</option>
              <option value="date">DD/MM/YYYY</option>
            </select>

            {/* Dynamic Date Inputs */}
            {dateFormat === "month" ? (
              <>
                <label className="text-xs font-bold text-blue-900">Mfg:</label>
                <input
                  type="month"
                  name="manufacturingDate"
                  value={form.manufacturingDate}
                  onChange={handleChange}
                  className="p-1 bg-white border border-blue-400 rounded h-7 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm text-xs font-semibold"
                  style={{ minWidth: "90px", maxWidth: "120px", flexShrink: 0 }}
                  autoComplete="off"
                />
                <label className="text-xs font-bold text-blue-900">Exp:</label>
                <input
                  type="month"
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleChange}
                  className="p-1 bg-white border border-blue-400 rounded h-7 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm text-xs font-semibold"
                  style={{ minWidth: "90px", maxWidth: "120px", flexShrink: 0 }}
                  autoComplete="off"
                />
              </>
            ) : (
              <>
                <label className="text-xs font-bold text-blue-900">Mfg:</label>
                <input
                  type="date"
                  name="manufacturingDate"
                  value={form.manufacturingDate}
                  onChange={handleChange}
                  className="p-1 bg-white border border-blue-400 rounded h-7 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm text-xs font-semibold"
                  style={{ minWidth: "90px", maxWidth: "120px", flexShrink: 0 }}
                  autoComplete="off"
                />
                <label className="text-xs font-bold text-blue-900">Exp:</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleChange}
                  className="p-1 bg-white border border-blue-400 rounded h-7 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm text-xs font-semibold"
                  style={{ minWidth: "90px", maxWidth: "120px", flexShrink: 0 }}
                  autoComplete="off"
                />
              </>
            )}
            <label className="text-xs font-bold text-blue-900">Quantity:</label>
            <input
              list="Quantity"
              name="Quantity"
              value={form.Quantity}
              onChange={handleChange}
              required
              className="p-1 bg-white border border-blue-600 rounded h-7 focus:ring-2 focus:ring-blue-600 transition-all duration-200 shadow-sm text-xs font-semibold"
              style={{ minWidth: "70px", maxWidth: "90px", flexShrink: 0 }}
              placeholder="Select Quantity"
            />

            {/* <datalist id="powerOptions">
              {Array.from({ length: 97 }, (_, i) => {
                const numValue = (2 + i * 0.5).toFixed(2);
                const [whole, fraction] = numValue.split(".");
                const formattedWhole = whole.length === 1 ? `0${whole}` : whole;
                const display = `+${formattedWhole}.${fraction}D`;

                return <option key={display} value={display} />;
              })}
            </datalist> */}

            {/* Create button */}
            <button
              type="button"
              onClick={handleCreate}
              className={`bg-gradient-to-r ${
                editIndex !== null
                  ? "from-gray-700 to-blue-600"
                  : "from-blue-600 to-blue-900"
              } text-white rounded px-3 py-1 font-bold shadow hover:scale-105 transition-all duration-200 text-xs border ${
                editIndex !== null ? "border-blue-600" : "border-zinc-500"
              }`}
              style={{ minWidth: "60px", height: "28px", flexShrink: 0 }}
            >
              {editIndex !== null ? "Update" : "+ add"}
            </button>
          </div>
        </div>
        {/* Table with tight, small, bordered, and attractive UI */}
        <table className="w-full text-xs mt-2 shadow rounded-xs overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-gray-500 to-gray-800 text-white text-xs leading-tight h-7">
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px] rounded-xs">
                Product Name
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Serial No
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Mfg Date
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Exp Date
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Quantity
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {addTableData.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-2 text-gray-400 border border-blue-400 bg-white rounded"
                >
                  No items added yet.
                </td>
              </tr>
            ) : (
              addTableData.map((item, index) => (
                <tr
                  key={index}
                  className="bg-white hover:bg-yellow-500 transition-all duration-150 shadow rounded"
                  style={{ height: "24px" }} // Add this line for minimal height
                >
                  <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                    {productList.find((p) => p._id === form.productDetailsId)
                      ?.ProductName || "N/A"}
                  </td>
                  <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                    {item.BatchNo}
                  </td>
                  <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                    {formatMonthYear(item.manufacturingDate)}
                  </td>
                  <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                    {formatMonthYear(item.expiryDate)}
                  </td>
                  <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                    {item.Quantity}
                  </td>
                  <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit((addPage - 1) * pageSize + index)
                      }
                      className="group relative flex items-center justify-center bg-white hover:bg-yellow-600 text-black rounded px-1 py-[1px] text-[10px] font-bold shadow transition-all duration-200"
                      style={{
                        width: "56px",
                        height: "18px",
                        padding: "0 10px",
                      }} // fixed width to prevent jump
                    >
                      <span className="transition-opacity duration-200 group-hover:opacity-0">
                        →
                      </span>
                      <span
                        className="absolute top-1/2 left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                        style={{ transform: "translate(-50%, -50%)" }}
                      >
                        Update
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination for add inventory table */}
        <Pagination
          page={addPage}
          setPage={setAddPage}
          pageCount={addPageCount}
        />
      </div>
    );
  }

  // Show modal for add flow steps
  if (modalOpen) {
    return renderAddModal();
  }

  // --- Main inventory table ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 p-4">
      <div className="bg-gradient-to-r from-gray-500 to-gray-800 text-white rounded-xl p-4 flex items-center justify-between shadow-md mb-">
        <div>
          <h1 className="text-xl font-bold">Inventory Management</h1>
          <p className="text-xs">
            Track and manage inventory items efficiently
          </p>
        </div>
        <button
          className="bg-blue-200 text-blue-900 font-semibold px-2 py-1 rounded-xl shadow hover:bg-gray-800 text-xs"
          onClick={() => {
            setFormVisible(true);
            setStep(1);
            setCompanyStep(false);
            setTempItems([]);
            setCompanyName("");
            setAddPage(1);
            setForm({
              invoiceNo: "",
              productDetailsId: "",
              Quantity: "",
              manufacturingDate: "",
              expiryDate: "",
              BatchNo: "",
              broschSerialNO: "",
              billedTo: "",
              shippedTo: "",
              billingDate: "",
            });
          }}
          style={{ minWidth: "100px" }}
        >
          + Add inventory
        </button>
      </div>

      {/* Search bar and rows per page selector in one row */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded shadow p-2 mt-0.5 mb-0.5">
        <div className="flex flex-col md:flex-row gap-2 items-center">
          {/* Rows per page selector - left side */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-white">Page Size:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setMainPage(1);
                setAddPage(1);
              }}
              className="border border-blue-600 rounded px-2 py-1 text-xs"
            >
              {[10, 20, 30, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          {/* Search bar - right side, takes remaining space */}
          <div className="flex items-center flex-grow bg-gray-100 rounded-xl px-2 py-1">
            <input
              type="text"
              placeholder="Search invoices..."
              className="bg-transparent outline-none w-full text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-0 text-xs rounded shadow-xl overflow-hidden mt-0">
          <thead>
            <tr className="bg-gradient-to-r from-gray-500 to-gray-800 text-white text-xs">
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px] rounded-x-1">
                #
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Product
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Quantity
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                [Mfg Date | Exp Date]
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Serial No
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Brosch SN
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                [ Billed To | Shipped To ]
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                Billing Date
              </th>
              <th className="px-[2px] py-[1px] border border-gray-400 text-[10px] rounded-x-1">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody>
            {mainTableData.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-2 text-gray-400 border-2 border-gray-400 bg-white rounded-b-2xl"
                >
                  No inventory data found.
                </td>
              </tr>
            ) : (
              mainTableData.map((item, i) => {
                const billed =
                  typeof item.billedTo === "object"
                    ? item?.billedTo?.billerUnitName || item?.billedTo?._id
                    : item?.billedTo;
                const shipped =
                  typeof item.shippedTo === "object"
                    ? item?.shippedTo?.shippingUnitName || item?.shippedTo?._id
                    : item?.shippedTo;
                return (
                  <tr
                    key={i}
                    className="bg-white hover:bg-yellow-500 transition-all duration-150 shadow rounded-xl"
                  >
                    <td className="px-[2px] py-[1px] border border-gray-400 font-semibold text-[10px]">
                      {(mainPage - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                      {item.productDetailsId?.ProductName || "N/A"}
                    </td>
                    <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                      {item.Quantity || "N/A" }
                    </td>
                    <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                      {formatCustomDate(item.manufacturingDate)} |{" "}
                      {formatCustomDate(item.expiryDate)}
                    </td>
                    <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                      {item.BatchNo}
                    </td>
                    <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                      {item.broschSerialNO}
                    </td>

                    <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                      {(() => {
                        // Match inventory BatchNowith invoice.items[].BatchNo
                        const invoice = invoiceLogs.find(
                          (inv) =>
                            Array.isArray(inv.items) &&
                            inv.items.some(
                              (it) => it.BatchNo === item.BatchNo
                            )
                        );
                        const billTo = invoice?.bill_to;
                        const shippingUnit = billTo?.shippingUnit?.find(
                          (su) => su._id === invoice?.billedToShippingUnitId
                        );
                        return (
                          <>
                            {/* Billed To with hover tooltip */}
                            <span className="relative group cursor-pointer text-blue-800 font-semibold">
                              {billTo?.billerName || "N/A"}
                              <div
                                className="fixed left-1/2 top-1/2 z-50 hidden group-hover:flex flex-col items-start bg-white border border-blue-600 rounded shadow-2xl p-4"
                                style={{
                                  width: "20vw",
                                  height: "20vh",
                                  maxWidth: "500px",
                                  minHeight: "180px",
                                  transform: "translate(-50%, 8px)",
                                  pointerEvents: "auto",
                                  overflowY: "auto",
                                }}
                              >
                                <div>
                                  <b>Biller Name:</b>{" "}
                                  {billTo?.billerName || "N/A"}
                                </div>
                                <div>
                                  <b>Phone:</b> {billTo?.billerPhone || "N/A"}
                                </div>
                                <div>
                                  <b>GST:</b> {billTo?.billerGst || "N/A"}
                                </div>
                                <div>
                                  <b>Email:</b> {billTo?.billerEmail || "N/A"}
                                </div>
                                <div>
                                  <b>Address:</b>{" "}
                                  {billTo?.billerAddress || "N/A"}
                                </div>
                              </div>
                            </span>
                            {" | "}
                            {/* Shipped To with hover tooltip */}
                            <span className="relative group cursor-pointer text-sky-800 font-semibold">
                              {shippingUnit?.shippingUnitName || "N/A"}
                              <div
                                className="fixed left-1/2 top-1/2 z-50 hidden group-hover:flex flex-col items-start bg-white border border-sky-700 rounded shadow-2xl p-4"
                                style={{
                                  width: "20vw",
                                  height: "20vh",
                                  maxWidth: "500px",
                                  minHeight: "180px",
                                  transform: "translate(-50%, 8px)",
                                  pointerEvents: "auto",
                                  overflowY: "auto",
                                }}
                              >
                                <div>
                                  <b>Shipper Name:</b>{" "}
                                  {shippingUnit?.shippingUnitName || "N/A"}
                                </div>
                                <div>
                                  <b>Phone:</b>{" "}
                                  {shippingUnit?.shippingPhone || "N/A"}
                                </div>

                                <div>
                                  <b>Email:</b>{" "}
                                  {shippingUnit?.shippingEmail || "N/A"}
                                </div>
                                <div>
                                  <b>Address:</b>{" "}
                                  {shippingUnit?.shippingUnitAddress || "N/A"}
                                </div>
                              </div>
                            </span>
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                      {(() => {
                        const invoice = invoiceLogs.find(
                          (inv) =>
                            Array.isArray(inv.items) &&
                            inv.items.some(
                              (it) => it.BatchNo === item.BatchNo
                            )
                        );
                        return invoice ? invoice.date.split("T")[0] : "";
                      })()}
                    </td>
                    <td className="px-[2px] py-[1px] border border-gray-400 text-[10px]">
                      {item.invoiceNo}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination
          page={mainPage}
          setPage={setMainPage}
          pageCount={mainPageCount}
        />
      </div>
    </div>
  );
};

export default Inventory;

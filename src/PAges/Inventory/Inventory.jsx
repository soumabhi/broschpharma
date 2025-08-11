import React, { useEffect, useState, useRef } from "react";
import { Eye, Search, Building2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import PDFGeneration from "../PDF/PDFGeneration";
import { pdf } from "@react-pdf/renderer"; // Add this import

const Inventory = () => {
  // Add pageSize state, default 20
  const [pageSize, setPageSize] = useState(20);

  const [inventoryList, setInventoryList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredSerial, setHoveredSerial] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [tempItems, setTempItems] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [dateFormat, setDateFormat] = useState("month"); // 'month' or 'date'
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchableElement, setSearchableElement] = useState("ProductName");
  const [status, setStatus] = useState("available");

  // Pagination states
  const [mainPage, setMainPage] = useState(1);
  const [addPage, setAddPage] = useState(1);

  // For warning on leaving unsaved data
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const warningTimerRef = useRef(null);
  const serialNoRef = useRef(null);
  const mfgDateRef = useRef(null);
  const expDateRef = useRef(null);
  const powerRef = useRef(null);
  const tooltipAnchorRef = useRef(null);
  const [totalCount, setTotalCount] = useState(0);
  const [billerList, setBillerList] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add ref for power input to manage focus
  const powerInputRef = useRef(null);

  const [form, setForm] = useState({
    invoiceNo: "",
    productDetailsId: "",
    power: "",
    manufacturingDate: "",
    expiryDate: "",
    serialNo: "",
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
      form.power ||
      form.manufacturingDate ||
      form.expiryDate ||
      form.serialNo ||
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
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/iol-inventory`, {
        params: {
          page: mainPage,
          limit: pageSize,
          search: searchQuery,
          searchableElement,
          status,
        },
      });
      setInventoryList(res.data || []);
      setTotalCount(res.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchInventory();
  }, [mainPage, pageSize, searchQuery, status, searchableElement]);

  const handleCreate = async () => {
    // Validate required fields
    if (!form.manufacturingDate || !form.expiryDate || !form.serialNo) {
      toast.warning("Please fill all fields.");
      return;
    }
    const serialNoTrimmed = form.serialNo.trim();
    const isDuplicate = tempItems.some(
      (item, index) =>
        item.serialNo.trim() === serialNoTrimmed && index !== editIndex // Allow editing the same item
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
        power: form.power,
        manufacturingDate: form.manufacturingDate,
        expiryDate: form.expiryDate,
        serialNo: form.serialNo,
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
        power: "",
        manufacturingDate: "",
        expiryDate: "",
        serialNo: "",
      });

      // Focus on power input after clearing the form
      setTimeout(() => {
        if (powerInputRef.current) {
          powerInputRef.current.focus();
        }
      }, 0);

      // Rerender main inventory table
      await fetchInventory();
    } catch (error) {
      console.error("Error creating inventory item:", error);
      if (error.response) {
        console.error("Backend says:", error.response.data);
      }
      toast.error(
        error?.response?.data?.message || "Failed to create inventory item."
      );
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
        power: form.power,
        manufacturingDate: form.manufacturingDate,
        expiryDate: form.expiryDate,
        serialNo: form.serialNo,
        companyName: companyName,
      };

      await axios.put(`${apiUrl}/iol-inventory/${itemToUpdate._id}`, payload);

      const updatedItems = tempItems.map((item, idx) =>
        idx === editIndex
          ? {
            ...item,
            power: form.power,
            manufacturingDate: form.manufacturingDate,
            expiryDate: form.expiryDate,
            serialNo: form.serialNo,
            // Keep original broschSerialNO from existing item
            broschSerialNO: item.broschSerialNO,
          }
          : item
      );

      setTempItems(updatedItems);
      setEditIndex(null);

      setForm({
        ...form,
        power: "",
        manufacturingDate: "",
        expiryDate: "",
        serialNo: "",
      });

      setTimeout(() => {
        if (powerInputRef.current) powerInputRef.current.focus();
      }, 0);
      toast.success("Item updated successfully!");
      await fetchInventory();
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
      power: item.power,
      manufacturingDate: item.manufacturingDate,
      expiryDate: item.expiryDate,
      serialNo: item.serialNo,
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
        power: "",
        manufacturingDate: "",
        expiryDate: "",
        serialNo: "",
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
      setProductList(res.data?.data || []);
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
        setInvoiceLogs(res.data.data);
      })
      .catch(() => setInvoiceLogs([]));
  }, []);

  // const filteredInventory = inventoryList.filter((item) => {
  //   const name = item?.productDetailsId?.ProductName?.toLowerCase() || "";
  //   const serial = item?.serialNo?.toLowerCase() || "";
  //   return (
  //     name.includes(searchQuery.toLowerCase()) ||
  //     serial.includes(searchQuery.toLowerCase())
  //   );
  // });

  // Pagination logic for main table (use pageSize)
  const mainPageCount = Math.ceil(totalCount / pageSize);

  // const mainTableData = filteredInventory.slice(
  //   (mainPage - 1) * pageSize,
  //   mainPage * pageSize
  // );

  const mainTableData = inventoryList;

  // Pagination logic for add inventory table (use pageSize)
  const addPageCount = Math.ceil(tempItems.length / pageSize);
  const addTableData = tempItems.slice(
    (addPage - 1) * pageSize,
    addPage * pageSize
  );
  // Compact Pagination component
  const Pagination = ({ page, setPage, pageCount }) => (
    <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-lg shadow-sm border border-gray-200 p-2">
      <div className="flex items-center justify-center gap-2">
        <button
          className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${page <= 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            }`}
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous Page"
        >
          Previous
        </button>

        <div className="flex items-center space-x-1 text-xs">
          <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
            Page <span className="font-bold text-gray-900">{page}</span> of{" "}
            <span className="font-bold text-gray-900">{pageCount || 1}</span>
          </span>
        </div>

        <button
          className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${page >= pageCount
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            }`}
          onClick={() => setPage(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next Page"
        >
          Next
        </button>
      </div>
    </div>
  );

  // --- MODALS FOR ADD FLOW ---
  const [modalStep, setModalStep] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const invoiceInputRef = useRef(null);
  const companyInputRef = useRef(null);
  const productInputRef = useRef(null);

  useEffect(() => {
    if (modalOpen) {
      if (modalStep === 1 && invoiceInputRef.current) {
        invoiceInputRef.current.focus();
      } else if (modalStep === 2 && companyInputRef.current) {
        companyInputRef.current.focus();
      } else if (modalStep === 3 && productInputRef.current) {
        productInputRef.current.focus();
      }
    }
  }, [modalOpen, modalStep]);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto border border-gray-200 transform transition-all duration-300">
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
              {/* Modal Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                  Enter Invoice Number
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  Please provide the invoice number for this inventory batch
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  ref={invoiceInputRef}
                  type="text"
                  name="invoiceNo"
                  value={form.invoiceNo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                  placeholder="Enter invoice number"
                  autoComplete="off"
                />
              </div>

              {form.invoiceNo && (
                <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Invoice No:</span>
                    <span className="text-gray-900 font-bold">
                      {form.invoiceNo}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setFormVisible(false)}
                  className="px-4 py-2 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-md hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-gray-800 to-black text-white rounded-md hover:from-gray-900 hover:to-gray-800 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
              className="space-y-5"
            >
              {/* Modal Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                  Select Company Name
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  Choose the vendor company for this inventory
                </p>
              </div>

              {/* Show previous data */}
              <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Invoice No:</span>
                  <span className="text-gray-900 font-bold">
                    {form.invoiceNo}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={companyInputRef}
                    type="text"
                    placeholder="Search Company"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (!e.target.value) {
                        setShowDropdown(false);
                      } else {
                        setShowDropdown(true);
                      }
                    }}
                    onFocus={() => {
                      if (companyName) setShowDropdown(true);
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
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
                              setShowDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
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
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalStep(1)}
                  className="px-4 py-2 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-md hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-gray-800 to-black text-white rounded-md hover:from-gray-900 hover:to-gray-800 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Next
                </button>
              </div>
            </form>
          )}
          {/* Step 3: Select Product */}
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
              {/* Modal Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                  Select Product
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  Choose the product for this inventory batch
                </p>
              </div>

              {/* Show previous data */}
              <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700 shadow-inner space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Invoice No:</span>
                  <span className="text-gray-900 font-bold">
                    {form.invoiceNo}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Company:</span>
                  <span className="text-gray-900 font-bold">{companyName}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    ref={productInputRef}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
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
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
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
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalStep(2)}
                  className="px-4 py-2 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-md hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-gray-800 to-black text-white rounded-md hover:from-gray-900 hover:to-gray-800 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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

  //modal for tooltip
  const Tooltip = ({ item, anchorRef }) => {
    const [position, setPosition] = useState(null);

    useEffect(() => {
      if (anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }
    }, [anchorRef]);

    const invoice = invoiceLogs.find(
      (inv) =>
        Array.isArray(inv.items) &&
        inv.items.some((it) => it.serialNo === item.serialNo)
    );

    const billTo = invoice?.bill_to;
    const shippingUnit = billTo?.shippingUnit?.find(
      (su) => su._id === invoice?.billedToShippingUnitId
    );

    if (!position) return null;

    return createPortal(
      <div
        className="z-[9999] fixed bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300 shadow-2xl rounded-xl p-4 text-xs text-gray-800 w-[320px] max-w-[90vw]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: "translateX(-50%)",
        }}
      >
        <div className="text-gray-900 font-bold mb-2 text-sm uppercase tracking-wide border-b border-gray-200 pb-1">
          Billed To
        </div>
        <div className="space-y-1 mb-3">
          <div>
            <span className="font-semibold text-gray-700">Name:</span>{" "}
            {billTo?.billerName || "N/A"}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Phone:</span>{" "}
            {billTo?.billerPhone || "N/A"}
          </div>
          <div>
            <span className="font-semibold text-gray-700">GST:</span>{" "}
            {billTo?.billerGst || "N/A"}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Email:</span>{" "}
            {billTo?.billerEmail || "N/A"}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Address:</span>{" "}
            {billTo?.billerAddress || "N/A"}
          </div>
        </div>

        <div className="text-gray-900 font-bold mb-2 text-sm uppercase tracking-wide border-b border-gray-200 pb-1">
          Shipped To
        </div>
        <div className="space-y-1">
          <div>
            <span className="font-semibold text-gray-700">Name:</span>{" "}
            {shippingUnit?.shippingUnitName || "N/A"}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Phone:</span>{" "}
            {shippingUnit?.shippingPhone || "N/A"}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Email:</span>{" "}
            {shippingUnit?.shippingEmail || "N/A"}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Address:</span>{" "}
            {shippingUnit?.shippingUnitAddress || "N/A"}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Only show add form after modal steps are done
  useEffect(() => {
    if (formVisible && step === 2 && !modalOpen && serialNoRef.current) {
      serialNoRef.current.focus();
    }
  }, [formVisible, step, modalOpen]);
  if (formVisible && step === 2 && !modalOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
        {/* Leave warning modal */}
        {showLeaveWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl shadow-2xl p-6 max-w-sm w-full text-center border border-gray-200">
              <div className="text-gray-900 font-bold mb-4 text-lg">
                Are you complete?
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => {
                    // User clicked "Yes"
                    setShowLeaveWarning(false);
                    setFormVisible(false);
                    setStep(1);
                    setTempItems([]);
                    setCompanyName("");
                    setCompanyStep(false);
                    setAddPage(1);
                    setMainPage(1);
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    // User clicked "No"
                    setShowLeaveWarning(false);
                  }}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Header with Title and Back Button */}
        <div className="w-full mx-auto mb-4">
          <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                Add Inventory
              </h1>
              <button
                onClick={handleBack}
                className="bg-black hover:bg-gray-900 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-900"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Compact Form Layout */}
        <div className="w-full mx-auto mb-3">
          <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-3">
            <div className="grid grid-cols-2  sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 items-end">
              {/* Serial No */}
              <div className="flex flex-col min-w-0 col-span-2 ">
                <label className="text-xs font-bold text-gray-800 mb-1 uppercase tracking-wide">
                  Serial No
                </label>
                <input
                  ref={serialNoRef}
                  type="text"
                  name="serialNo"
                  value={form.serialNo}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      mfgDateRef.current?.focus();
                    }
                  }}
                  placeholder="Serial No"
                  className="px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-xs w-full min-w-[100px]"
                  autoComplete="off"
                />
              </div>

              {/* Date Format Selector */}
              <div className="flex flex-col min-w-0">
                <label className="text-xs font-bold text-gray-800 mb-1 uppercase tracking-wide">
                  Format
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-xs w-full min-w-[90px]"
                >
                  <option value="month">MM/YYYY</option>
                  <option value="date">DD/MM/YYYY</option>
                </select>
              </div>

              {/* Dynamic Date Inputs */}
              {dateFormat === "month" ? (
                <>
                  <div className="flex flex-col min-w-0">
                    <label className="text-xs font-bold text-gray-800 mb-1 uppercase tracking-wide">
                      Mfg Date
                    </label>
                    <input
                      ref={mfgDateRef}
                      type="month"
                      name="manufacturingDate"
                      value={form.manufacturingDate}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          expDateRef.current?.focus();
                        }
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-xs w-full min-w-[110px]"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <label className="text-xs font-bold text-gray-800 mb-1 uppercase tracking-wide">
                      Exp Date
                    </label>
                    <input
                      ref={expDateRef}
                      type="month"
                      name="expiryDate"
                      value={form.expiryDate}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          powerRef.current?.focus();
                        }
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-xs w-full min-w-[110px]"
                      autoComplete="off"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col min-w-0">
                    <label className="text-xs font-bold text-gray-800 mb-1 uppercase tracking-wide">
                      Mfg Date
                    </label>
                    <input
                      ref={mfgDateRef}
                      type="date"
                      name="manufacturingDate"
                      value={form.manufacturingDate}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          expDateRef.current?.focus();
                        }
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-xs w-full min-w-[120px]"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <label className="text-xs font-bold text-gray-800 mb-1 uppercase tracking-wide">
                      Exp Date
                    </label>
                    <input
                      ref={expDateRef}
                      type="date"
                      name="expiryDate"
                      value={form.expiryDate}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          powerRef.current?.focus();
                        }
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-xs w-full min-w-[120px]"
                      autoComplete="off"
                    />
                  </div>
                </>
              )}

              {/* Power Input */}
              <div className="flex flex-col min-w-0">
                <label className="text-xs font-bold text-gray-800 mb-1 uppercase tracking-wide">
                  Power
                </label>
                <input
                  ref={powerRef}
                  list="powerOptions"
                  name="power"
                  value={form.power}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreate();
                      serialNoRef.current?.focus();
                    }
                  }}
                  required
                  className="px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-xs w-full min-w-[80px]"
                  placeholder="Power"
                />
                <datalist id="powerOptions">
                  {Array.from({ length: 97 }, (_, i) => {
                    const numValue = (2 + i * 0.5).toFixed(2);
                    const [whole, fraction] = numValue.split(".");
                    const formattedWhole =
                      whole.length === 1 ? `0${whole}` : whole;
                    const display = `+${formattedWhole}.${fraction}D`;
                    return <option key={display} value={display} />;
                  })}
                </datalist>
              </div>

              {/* Create/Update button */}
              <div className="flex flex-col justify-end min-w-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      // Prevent duplicate serial numbers in tempItems
                      const serialNoTrimmed = form.serialNo.trim();
                      const isDuplicate = tempItems.some(
                        (item, index) =>
                          item.serialNo.trim() === serialNoTrimmed &&
                          index !== editIndex
                      );
                      if (isDuplicate) {
                        toast.warning(
                          "This Serial No already exists in the added list."
                        );
                        return;
                      }
                      await handleCreate();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl min-w-[80px] ${editIndex !== null
                      ? "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                      : "bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white"
                      }`}
                  >
                    {editIndex !== null ? "Update" : "+ Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Compact Add Inventory Table */}
        <div className="w-full mx-auto">
          <div className="bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div
              className="overflow-x-auto scrollbar-hide"
              style={{ maxHeight: "calc(100vh - 250px)", minHeight: "200px" }}
            >
              <table className="w-full text-xs">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Product Name
                    </th>
                    <th className="px-2 py-1.5 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Serial No
                    </th>
                    <th className="px-2 py-1.5 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Mfg Date
                    </th>
                    <th className="px-2 py-1.5 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Exp Date
                    </th>
                    <th className="px-2 py-1.5 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Power
                    </th>
                    <th className="px-2 py-1.5 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {addTableData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-3xl text-gray-400">📦</span>
                          </div>
                          <div className="text-center">
                            <h3 className="text-base font-bold text-gray-900 mb-1 tracking-wide">
                              No items added yet
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                              Add inventory items using the form above
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    addTableData.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 h-6"
                      >
                        <td className="px-2 py-0.5 text-xs font-semibold text-gray-900 text-left align-middle">
                          {productList.find(
                            (p) => p._id === form.productDetailsId
                          )?.ProductName || "N/A"}
                        </td>
                        <td className="px-2 py-0.5 text-xs text-gray-900 text-left align-middle">
                          {item.serialNo}
                        </td>
                        <td className="px-2 py-0.5 text-xs text-gray-900 text-left align-middle">
                          {formatMonthYear(item.manufacturingDate)}
                        </td>
                        <td className="px-2 py-0.5 text-xs text-gray-900 text-left align-middle">
                          {formatMonthYear(item.expiryDate)}
                        </td>
                        <td className="px-2 py-0.5 text-xs text-gray-900 text-left align-middle">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                            {item.power}
                          </span>
                        </td>
                        <td className="px-2 py-0.5 text-left align-middle">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit((addPage - 1) * pageSize + index)
                            }
                            className="py-0.5 transition-all duration-300 hover:scale-110"
                            title="Edit Item"
                          >
                            <span className="w-3 h-3 text-black hover:text-gray-800">
                              ✏️
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compact Pagination for add inventory table */}
          <div className="mt-2">
            <Pagination
              page={addPage}
              setPage={setAddPage}
              pageCount={addPageCount}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show modal for add flow steps
  if (modalOpen) {
    return renderAddModal();
  }

  // --- Main inventory table ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Simple Centered Title */}
      <div className="w-full mx-auto mb-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center uppercase">
          IOL Inventory Management
        </h1>
      </div>

      {/* Header Section with Search Filters and Add Button */}
      <div className="w-full mx-auto mb-4">
        <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 gap-4">
            {/* Left Side - Search and Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg border border-green-200 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Total Items</span>
                <div
                  className={`h-5 bg-green-800 flex items-center justify-center ${(totalCount || 0).toString().length >= 2
                    ? "px-2 rounded-full"
                    : "w-5 rounded-full"
                    }`}
                >
                  <span className="text-white text-[10px] font-bold">
                    {totalCount || 0}
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-[20rem] pl-3 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    ✕
                  </button>
                )}
              </div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setMainPage(1);
                }}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
              <select
                value={searchableElement}
                onChange={(e) => {
                  setSearchableElement(e.target.value);
                  setMainPage(1);
                }}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="">Search By</option>
                <option value="ProductName">Product Name</option>
                <option value="broschSerialNO">Brosch SN</option>
                <option value="serialNo">Serial No</option>
              </select>
            </div>

            {/* Right Side - Add Button */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  setFormVisible(true);
                  setStep(1);
                  setTempItems([]);
                  setCompanyName("");
                  setAddPage(1);
                  setForm({
                    invoiceNo: "",
                    productDetailsId: "",
                    power: "",
                    manufacturingDate: "",
                    expiryDate: "",
                    serialNo: "",
                    broschSerialNO: "",
                    billedTo: "",
                    shippedTo: "",
                    billingDate: "",
                  });
                }}
                className="bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white px-4 py-1 rounded-lg font-medium flex items-center gap-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span className="text-lg">+</span>
                Add Inventory
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="w-full mx-auto">
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{ maxHeight: "calc(100vh - 300px)", minHeight: "500px" }}
          >
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    #
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Power
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Exp Date
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Serial No
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Brosch SN
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Billed / Shipped To
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Billing Date
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="9">
                      <div className="w-full h-64 flex items-center justify-center bg-white">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800"></div>
                          <p className="text-gray-600 font-medium">
                            Loading Inventory data...
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : mainTableData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                          <span className="w-6 h-6 text-gray-500">📦</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            No inventory data found
                          </h3>
                          <p className="text-gray-600 text-xs">
                            Add your first inventory item to get started
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  mainTableData?.data?.map((item, i) => {
                    const billed =
                      typeof item.billedTo === "object"
                        ? item?.billedTo?.billerUnitName || item?.billedTo?._id
                        : item?.billedTo;
                    const shipped =
                      typeof item.shippedTo === "object"
                        ? item?.shippedTo?.shippingUnitName ||
                        item?.shippedTo?._id
                        : item?.shippedTo;
                    return (
                      <tr
                        key={i}
                        className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 h-6"
                      >
                        <td className="px-3 py-0.5 text-xs font-medium text-gray-900 text-left align-middle">
                          {(mainPage - 1) * pageSize + i + 1}
                        </td>
                        <td className="px-3 py-0.5 text-xs font-semibold text-gray-900 text-left align-middle">
                          <div className="text-left">
                            <div className="relative group">
                              <span className="cursor-help hover:text-green-600 transition-colors duration-200">
                                {item.productDetailsId?.ProductName &&
                                  item.productDetailsId?.ProductName.length > 20
                                  ? `${item.productDetailsId?.ProductName.substring(
                                    0,
                                    20
                                  )}...`
                                  : item.productDetailsId?.ProductName}
                              </span>
                              {item.productDetailsId?.ProductName &&
                                item.productDetailsId?.ProductName.length >
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
                                        {item.productDetailsId?.ProductName}
                                      </p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-0.5 text-xs text-gray-900 text-left align-middle">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                            {item.power}
                          </span>
                        </td>
                        <td className="px-3 py-0.5 text-xs text-gray-900 text-left align-middle">
                          {formatCustomDate(item.expiryDate)}
                        </td>
                        <td className="px-3 py-0.5 text-xs text-gray-900 text-left align-middle">
                          {item.serialNo}
                        </td>
                        <td className="px-3 py-0.5 text-xs text-gray-900 text-left align-middle">
                          {item.broschSerialNO}
                        </td>
                        <td className="px-3 py-0.5 text-xs text-gray-900 text-left align-middle relative">
                          {(() => {
                            const invoice = invoiceLogs.find(
                              (inv) =>
                                Array.isArray(inv.items) &&
                                inv.items.some(
                                  (it) => it.serialNo === item.serialNo
                                )
                            );

                            if (!invoice)
                              return (
                                <span className="text-gray-500 font-semibold">
                                  NA
                                </span>
                              );

                            return (
                              <>
                                <button
                                  ref={(el) => {
                                    if (hoveredSerial === item.serialNo) {
                                      tooltipAnchorRef.current = el;
                                    }
                                  }}
                                  onMouseEnter={() =>
                                    setHoveredSerial(item.serialNo)
                                  }
                                  onMouseLeave={() => setHoveredSerial(null)}
                                  onClick={async () => {
                                    const invoice = invoiceLogs.find(
                                      (inv) =>
                                        Array.isArray(inv.items) &&
                                        inv.items.some(
                                          (it) => it.serialNo === item.serialNo
                                        )
                                    );

                                    if (!invoice) {
                                      toast.warning(
                                        "No invoice found for this item."
                                      );
                                      return;
                                    }

                                    const doc = (
                                      <PDFGeneration
                                        invoice={{
                                          ...invoice,
                                          discount: invoice.discount ?? 0,
                                          bill_to_name:
                                            invoice.bill_to?.billerName || "",
                                          bill_to_address:
                                            invoice.bill_to?.billerAddress ||
                                            "",
                                          bill_to_gst:
                                            invoice.bill_to?.billerGst || "",
                                          bill_to_phone:
                                            invoice.bill_to?.billerPhone || "",
                                          bill_to_state:
                                            invoice.bill_to?.billerState || "",
                                          ship_to_name: (() => {
                                            if (
                                              invoice.billedToShippingUnitId ===
                                              "__USE_BILLER__" ||
                                              !invoice.billedToShippingUnitId
                                            ) {
                                              return (
                                                invoice.bill_to?.billerName ||
                                                ""
                                              );
                                            }
                                            const su =
                                              invoice.bill_to?.shippingUnit?.find(
                                                (u) =>
                                                  u._id ===
                                                  invoice.billedToShippingUnitId
                                              );
                                            return su?.shippingUnitName || "";
                                          })(),
                                          ship_to_address: (() => {
                                            if (
                                              invoice.billedToShippingUnitId ===
                                              "__USE_BILLER__" ||
                                              !invoice.billedToShippingUnitId
                                            ) {
                                              return (
                                                invoice.bill_to
                                                  ?.billerAddress || ""
                                              );
                                            }
                                            const su =
                                              invoice.bill_to?.shippingUnit?.find(
                                                (u) =>
                                                  u._id ===
                                                  invoice.billedToShippingUnitId
                                              );
                                            return (
                                              su?.shippingUnitAddress || ""
                                            );
                                          })(),
                                          ship_to_phone: (() => {
                                            if (
                                              invoice.billedToShippingUnitId ===
                                              "__USE_BILLER__" ||
                                              !invoice.billedToShippingUnitId
                                            ) {
                                              return (
                                                invoice.bill_to?.billerPhone ||
                                                ""
                                              );
                                            }
                                            const su =
                                              invoice.bill_to?.shippingUnit?.find(
                                                (u) =>
                                                  u._id ===
                                                  invoice.billedToShippingUnitId
                                              );
                                            return su?.shippingPhone || "";
                                          })(),
                                          ship_to_state: (() => {
                                            if (
                                              invoice.billedToShippingUnitId ===
                                              "__USE_BILLER__" ||
                                              !invoice.billedToShippingUnitId
                                            ) {
                                              return (
                                                invoice.bill_to?.billerState ||
                                                ""
                                              );
                                            }
                                            const su =
                                              invoice.bill_to?.shippingUnit?.find(
                                                (u) =>
                                                  u._id ===
                                                  invoice.billedToShippingUnitId
                                              );
                                            return su?.shippingState || "";
                                          })(),
                                          items: (invoice.items || []).map(
                                            (itm) => ({
                                              ...itm,
                                              item_name: itm.item_name,
                                              hsn_sac:
                                                itm.hsn || itm.Hsn || "-",
                                              serial_no:
                                                itm.serial_no ||
                                                itm.serialNo ||
                                                "-",
                                              power: itm.power || "",
                                              expDate:
                                                itm.exp_date &&
                                                  itm.exp_date.day != null &&
                                                  itm.exp_date.month != null &&
                                                  itm.exp_date.year != null
                                                  ? `${itm.exp_date.day
                                                    ?.toString()
                                                    .padStart(
                                                      2,
                                                      "0"
                                                    )}/${itm.exp_date.month
                                                      ?.toString()
                                                      .padStart(2, "0")}/${itm.exp_date.year
                                                  }`
                                                  : itm.expDate || "",
                                              quantity: itm.quantity,
                                              unit: itm.unit,
                                              price_per_unit:
                                                itm.selling_price ||
                                                itm.price_per_unit,
                                              gst_percent:
                                                itm.gst_percent ??
                                                itm.gstPercentage ??
                                                0,
                                              gst:
                                                itm.gst ?? itm.gstAmount ?? 0,
                                              amount: itm.amount,
                                            })
                                          ),
                                        }}
                                      />
                                    );

                                    const { pdf } = await import(
                                      "@react-pdf/renderer"
                                    );
                                    const blob = await pdf(doc).toBlob();
                                    const url = URL.createObjectURL(blob);
                                    window.open(url, "_blank");
                                  }}
                                  className="py-1 transition-all duration-300 hover:scale-110"
                                  title="View Invoice"
                                >
                                  <Eye className="w-4 h-4 text-green-600 hover:text-green-800" />
                                </button>

                                {hoveredSerial === item.serialNo && (
                                  <Tooltip
                                    item={item}
                                    anchorRef={tooltipAnchorRef}
                                  />
                                )}
                              </>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-0.5 text-xs text-gray-900 text-left align-middle">
                          {(() => {
                            const invoice = invoiceLogs.find(
                              (inv) =>
                                Array.isArray(inv.items) &&
                                inv.items.some(
                                  (it) => it.serialNo === item.serialNo
                                )
                            );
                            return invoice ? invoice.date.split("T")[0] : "";
                          })()}
                        </td>
                        <td className="px-3 py-0.5 text-xs text-gray-900 text-left align-middle">
                          {item.invoiceNo}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rows per page selector */}
        <div className="mt-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left Side - Rows per page */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-gray-700">
                  Rows per page:
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setMainPage(1);
                    setAddPage(1);
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
                >
                  {[10, 20, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                Showing{" "}
                <span className="font-bold text-gray-900">
                  {(mainPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-gray-900">
                  {Math.min(mainPage * pageSize, totalCount || 0)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-900">
                  {totalCount || 0}
                </span>{" "}
                entries
              </div>
            </div>

            {/* Right Side - Pagination Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMainPage(mainPage - 1)}
                disabled={mainPage <= 1}
                aria-label="Go to previous page"
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${mainPage <= 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
              >
                Previous
              </button>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                  Page{" "}
                  <span className="font-bold text-gray-900">{mainPage}</span> of{" "}
                  <span className="font-bold text-gray-900">
                    {mainPageCount || 1}
                  </span>
                </span>
              </div>

              <button
                onClick={() => setMainPage(mainPage + 1)}
                disabled={mainPage >= mainPageCount}
                aria-label="Go to next page"
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${mainPage >= mainPageCount
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
    </div>
  );
};

export default Inventory;

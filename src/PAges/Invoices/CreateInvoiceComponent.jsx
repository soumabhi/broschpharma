import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import {
  Plus,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Building,
  Package,
  Send,
  Home,
  ChevronDown,
  ChevronUp,
  X,
  ShoppingCart,
  AlertTriangle,
  Hash,
  Zap,
} from "lucide-react";
import axios from "axios";

const initialItem = {
  item_name: "",
  Hsn: "",
  serialNo: "",
  power: "",
  exp_date: "",
  mfg_date: "",
  quantity: "",
  unit: "",
  price_per_unit: "",
  gst: "",
};

const CreateInvoiceComponent = () => {
  const navigate = useNavigate();

  const [billers, setBillers] = useState([]);
  const [invoiceDetails, setInvoiceDetails] = useState({
  invoice: `INV-${Math.floor(Math.random() * 10000)}`,
  date: new Date().toISOString().split("T")[0],
  placeofsupply: "",
  bill_to: "",
  billedToShippingUnitId: "",
  store_name: "", // ➕ added
});

  const serialNoRef = useRef(null);
  const [item, setItem] = useState(initialItem);
  const [items, setItems] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const addButtonRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    index: null,
  });
  
  const apiUrl = import.meta.env.VITE_API_URL;

  // 🔃 Fetch billers
  useEffect(() => {
    const fetchBillers = async () => {
      try {
        const res = await fetch(`${apiUrl}/billers`);
        const data = await res.json();
        setBillers(data);
      } catch (error) {
        // Error fetching billers can be handled here if needed
      }
    };
    fetchBillers();
  }, []);
  useEffect(() => {
    if (showModal) {
      // Add a slight delay to wait for the modal to render
      setTimeout(() => {
        addButtonRef.current?.focus();
      }, 100);
    }
  }, [showModal]);

  // 🔁 Handle item updates
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };
  const handleSerialNoBlur = async () => {
    const serialNo = item.serialNo.trim();
    if (!serialNo) return; // Don't call API if serialNo is empty

    try {
      const res = await axios.get(`${apiUrl}/invoices/serialNo/${serialNo}`);
      const data = res.data;
      const formatMonthYearForInput = (dateObj) => {
        if (!dateObj) return "";

        if (typeof dateObj === "object") {
          const { year, month, day } = dateObj;
          if (!year || !month) return "";

          const y = year.toString().padStart(4, "0");
          const m = month.toString().padStart(2, "0");
          if (day) {
            const d = day.toString().padStart(2, "0");
            return `${y}-${m}-${d}`;
          } else {
            return `${y}-${m}`; // Only year and month
          }
        }

        if (typeof dateObj === "string") {
          return dateObj;
        }

        return "";
      };

      const newItem = {
        serialNo,
        item_name: data.item_name || "",
        Hsn: data.Hsn || "",
        power: data.power || "",
        mfg_date: formatMonthYearForInput(data.manufacturingDate),
        exp_date: formatMonthYearForInput(data.exp_date),
        quantity: data.quantity || 0,
        unit: data.unit || "",
        price_per_unit: data.selling_price || 0,
        gst: data.gst || 0,
      };

      setItem(newItem);
      setShowModal(true);
    } catch (err) {
      setShowModal(false);
      toast.info("No data found for this serial number.");
    }
  };
  const handleAddOrUpdateItem = () => {
    // Validation: serialNo and quantity must be present and valid
    if (!item.serialNo || !item.serialNo.trim()) {
         toast.info("Serial number is required for each item.");
      return;
    }

    const quantity = parseFloat(item.quantity || 0);
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      toast.error("Quantity must be a valid number greater than 0.");
      return;
    }
    const serialNoTrimmed = item.serialNo.trim();
    const isDuplicate = items.some(
      (it, index) =>
        it.serialNo.trim() === serialNoTrimmed && index !== editIndex // Allow editing same item
    );
    if (isDuplicate) {
      toast.warning("This Item With the SERIALNO already exist.");
      serialNoRef.current?.focus();
      setShowModal(false);
      return;
    }

    const price_per_unit = parseFloat(item.price_per_unit || 0);
    const gst = parseFloat(item.gst || 0);
    const amount = price_per_unit * quantity;

    const newItem = { ...item, quantity, price_per_unit, gst, amount };

    if (editIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editIndex] = newItem;
      setItems(updatedItems);
      setEditIndex(null);
    } else {
      setItems([...items, newItem]);
    }

    setItem(initialItem);
    setShowModal(false);
    serialNoRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setItem(initialItem);
    setEditIndex(null);
  };

  const handleEdit = (index) => {
    setItem(items[index]);
    setEditIndex(index);
  };

  const handleDeleteConfirm = (index) => {
    setDeleteConfirm({ show: true, index });
  };

  const handleDelete = () => {
    const updated = items.filter((_, i) => i !== deleteConfirm.index);
    setItems(updated);
    setDeleteConfirm({ show: false, index: null });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ show: false, index: null });
  };

  const validateInvoiceDetails = () => {
    const { invoice, date, placeofsupply, bill_to, billedToShippingUnitId } =
      invoiceDetails;
    return (
      invoice && date && placeofsupply && bill_to && billedToShippingUnitId
    );
  };

  const handleSubmit = async () => {
    if (!validateInvoiceDetails()) {
      toast.warning("Please fill in all invoice details before submitting.");
      setIsDetailsCollapsed(false);
      return;
    }

    if (items.length === 0) {
      toast.warning("Please add at least one item to the invoice..");
      return;
    }

    // Validate all items before submit
    if (
      items.some(
        (it) =>
          !it.serialNo ||
          !it.serialNo.trim() ||
          !it.quantity ||
          isNaN(it.quantity) ||
          Number(it.quantity) <= 0
      )
    ) {
      toast.warning("Each item must have a serial number and a valid quantity.");
      return;
    }

    const selectedBiller = billers.find(
      (b) => b._id === invoiceDetails.bill_to
    );
    const hasShippingUnits = selectedBiller?.shippingUnit?.length > 0;

    let finalShipTo = "";
    // Only include billedToShippingUnitId if it's a real shipping unit id (not __USE_BILLER__ and not empty)
    if (
      hasShippingUnits &&
      invoiceDetails.billedToShippingUnitId &&
      invoiceDetails.billedToShippingUnitId !== "__USE_BILLER__"
    ) {
      finalShipTo = invoiceDetails.billedToShippingUnitId;
    }

    const payload = {
      invoice: invoiceDetails.invoice,
      date: invoiceDetails.date,
      placeofsupply: invoiceDetails.placeofsupply,
      bill_to: invoiceDetails.bill_to,
      ...(finalShipTo ? { billedToShippingUnitId: finalShipTo } : {}),
      items,
    };

    // Debug log removed

    try {
      const result = await axios.post(`${apiUrl}/invoices`, payload);
      if (result.status === 200 || result.status === 201) {
        navigate("/invoicepage");
      }
    } catch (error) {
      toast.error("Failed to submit invoice. Please try again.");

    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const totalGST = items.reduce(
    (sum, item) => sum + (item.amount * item.gst) / 100,
    0
  );
  const grandTotal = totalAmount + totalGST;
  const payload = {
  invoice: invoiceDetails.invoice,
  date: invoiceDetails.date,
  placeofsupply: invoiceDetails.placeofsupply,
  bill_to: invoiceDetails.bill_to,
  billedToShippingUnitId: invoiceDetails.billedToShippingUnitId,
  store_name: invoiceDetails.store_name, // ➕ added
  items,
};


  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {showModal && item && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl max-h-[80vh] bg-white rounded-3xl shadow-2xl relative overflow-hidden border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 rounded-t-3xl">
              <h2 className="text-lg font-bold text-white flex items-center">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl mr-3">
                  <Package className="h-5 w-5 text-white" />
                </div>
                Item Details
              </h2>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-3 overflow-hidden">
              {/* Serial No */}
              <div className="flex gap-2">
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg w-1/3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Hash className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      Serial No
                    </p>
                    <p className="text-sm font-semibold text-gray-900 font-mono">
                      {item?.serialNo || "N/A"}
                    </p>
                  </div>
                </div>

                {/* HSN */}
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg  w-1/3 ">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Hash className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      HSN
                    </p>
                    <p className="text-sm font-semibold text-gray-900 font-mono">
                      {item.Hsn || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Power */}
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg  w-1/3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Zap className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      Power
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.power || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Item Name */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-600 uppercase">
                  Item Name
                </p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {item.item_name || "N/A"}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-1 mb-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      Mfg Date
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 font-mono">
                    {item.mfg_date || "N/A"}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-1 mb-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      Exp Date
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 font-mono">
                    {item.exp_date || "N/A"}
                  </p>
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </p>
                  <span className="inline-flex mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {item.quantity || "N/A"}
                  </span>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Unit
                  </p>
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    {item.unit || "N/A"}
                  </p>
                </div>
              </div>

              {/* Price & GST */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                  <p className="text-xs font-medium text-green-600 uppercase">
                    Price/Unit
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    ₹{item.price_per_unit || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <p className="text-xs font-medium text-purple-600 uppercase">
                    GST
                  </p>
                  <span className="inline-flex mt-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                    {item.gst || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-3xl">
              <div className="flex justify-end">
                <button
                  ref={addButtonRef}
                  onClick={handleAddOrUpdateItem}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          {/* Collapse Toggle */}
          <div
            className="flex items-start justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)}
          >
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Invoice Details
              </h2>
              {!validateInvoiceDetails() && (
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                  Required
                </span>
              )}
            </div>
            {isDetailsCollapsed ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            )}
          </div>

          {/* Invoice Details (for Central User: manual input) */}
<div className="px-4 py-3 text-left space-y-3">
  {/* Store Name */}
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      <Building className="h-3 w-3 inline mr-1 text-indigo-500" />
      Store Name
    </label>
    <input
      type="text"
      name="store_name"
      value={invoiceDetails.store_name || ""}
      onChange={(e) => setInvoiceDetails((prev) => ({
        ...prev,
        store_name: e.target.value,
      }))}
      placeholder="Enter store name"
      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-400"
    />
  </div>

  {/* Bill To */}
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      <Package className="h-3 w-3 inline mr-1 text-indigo-500" />
      Bill To
    </label>
    <input
      type="text"
      name="bill_to"
      value={invoiceDetails.bill_to}
      onChange={(e) => setInvoiceDetails((prev) => ({
        ...prev,
        bill_to: e.target.value,
      }))}
      placeholder="Enter bill to"
      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-400"
    />
  </div>

  {/* Ship To */}
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      <Package className="h-3 w-3 inline mr-1 text-indigo-500" />
      Ship To
    </label>
    <input
      type="text"
      name="ship_to"
      value={invoiceDetails.billedToShippingUnitId}
      onChange={(e) => setInvoiceDetails((prev) => ({
        ...prev,
        billedToShippingUnitId: e.target.value,
      }))}
      placeholder="Enter ship to"
      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-400"
    />
  </div>

  {/* Place of Supply */}
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      <MapPin className="h-3 w-3 inline mr-1 text-indigo-500" />
      Place of Supply
    </label>
    <input
      type="text"
      name="placeofsupply"
      value={invoiceDetails.placeofsupply}
      onChange={(e) => setInvoiceDetails((prev) => ({
        ...prev,
        placeofsupply: e.target.value,
      }))}
      placeholder="City, State"
      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-400"
    />
  </div>

  {/* Date */}
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      <Calendar className="h-3 w-3 inline mr-1 text-indigo-500" />
      Date
    </label>
    <input
      type="date"
      name="date"
      value={invoiceDetails.date}
      onChange={(e) =>
        setInvoiceDetails((prev) => ({
          ...prev,
          date: e.target.value,
        }))
      }
      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-400"
    />
  </div>
</div>

        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-6 text-left">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center">
              <div className="p-1 bg-purple-100 rounded-md mr-2">
                <Package className="h-3.5 w-3.5 text-purple-600" />
              </div>
              {editIndex !== null ? "Edit Item" : "Add New Item"}
            </h2>
            {items.length > 0 && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-500">{items.length} items</span>
                <span className="font-medium text-indigo-600">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4  gap-0.5">
            <div className="col-span-2 space-y-0.5">
              <label className="text-xs text-gray-600">Serial No</label>
              <input
                name="serialNo"
                value={item.serialNo}
                onChange={handleItemChange}
                ref={serialNoRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSerialNoBlur();
                  }
                  if (e.key === "Delete") {
                    e.preventDefault();
                    setItem(initialItem); // ✅ Reset to initialItem, not null
                  }
                }}
                placeholder="Serial number"
                className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-start pb-2 items-center space-x-0.5 ">
          {editIndex !== null && (
            <button
              onClick={handleCancelEdit}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* Items Table - Shown only when there are items */}
        {items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden text-left">
            <div className="p-4 border-b">
              <h2 className="text-md font-semibold text-gray-800 flex items-center">
                <div className="p-1.5 bg-green-100 rounded-md mr-2">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                </div>
                Invoice Items
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HSN Number
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.item_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.Hsn}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.serialNo}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                        {item.unit}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                        ₹{item.price_per_unit.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                        {item.gst}%
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        ₹{item.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(index)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(index)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-2 text-sm font-medium text-gray-900 text-right"
                    >
                      Subtotal:
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      ₹{totalAmount.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-2 text-sm font-medium text-gray-900 text-right"
                    >
                      GST:
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      ₹{totalGST.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-2 text-sm font-bold text-gray-900 text-right"
                    >
                      Grand Total:
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                      ₹{grandTotal.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!validateInvoiceDetails() || items.length === 0}
            className={`flex items-center space-x-3 px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
              validateInvoiceDetails() && items.length > 0
                ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Send className="h-5 w-5" />
            <span>Submit Invoice</span>
          </button>
        </div>
        {/* Your Item Entry + Table + Submit logic remains the same */}
        {/* Use your existing item UI and hook it with the above biller logic */}
      </main>

      {/* Delete Modal stays the same */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-medium">Delete Item</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this item?
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoiceComponent;

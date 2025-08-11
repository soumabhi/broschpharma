import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
  BadgePercent,
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
  gstAmt: "",
  discount: "",
  discountAmt: "",
  taxableAmt: "",
  amount: "",
};

const InvoiceCreatePage = () => {
  const navigate = useNavigate();
  const serialNoRef = useRef(null);
  const [billers, setBillers] = useState([]);
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoice: `INV-${Math.floor(Math.random() * 10000)}`,
    date: new Date().toISOString().split("T")[0],
    placeofsupply: "",
    bill_to: "",
    billedToShippingUnitId: "",
  });
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
  const [Discount, setDiscount] = useState(0);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchBillers = async () => {
      try {
        const res = await fetch(`${apiUrl}/billers`);
        const data = await res.json();
        setBillers(data);
      } catch (error) { }
    };
    fetchBillers();
  }, []);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        addButtonRef.current?.focus();
      }, 100);
    }
  }, [showModal]);

  useEffect(() => {
    const updatedItems = items.map((item) => {
      const quantity = parseFloat(item.quantity || 0);
      const price_per_unit = parseFloat(item.price_per_unit || 0);
      const gst = parseFloat(item.gst || 0);
      const baseAmount = price_per_unit * quantity;
      const discountAmount = (Discount / 100) * baseAmount;
      const taxableAmount = baseAmount - discountAmount;
      const gstAmount = (gst / 100) * taxableAmount;
      const amount = taxableAmount + gstAmount;

      return {
        ...item,
        Discount,
        discountAmount,
        taxableAmount,
        gstAmount,
        amount,
      };
    });

    setItems(updatedItems);
  }, [Discount]);

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSerialNoBlur = async () => {
    const serialNo = item.serialNo.trim();
    if (!serialNo) return;

    try {
      const res = await axios.post(`${apiUrl}/invoices/serialNo`, { serialNo });
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
            return `${y}-${m}`;
          }
        }
        if (typeof dateObj === "string") return dateObj;
        return "";
      };

      const newItem = {
        serialNo,
        item_name: data?.item_name || "",
        Hsn: data?.Hsn || "",
        power: data?.power || "",
        mfg_date: formatMonthYearForInput(data?.manufacturingDate),
        exp_date: formatMonthYearForInput(data?.exp_date),
        quantity: data?.quantity || 0,
        unit: data?.unit || "",
        price_per_unit: data?.selling_price || 0,
        gst: data?.gst || 0,
      };

      setItem(newItem);
      setShowModal(true);
    } catch (err) {
      setShowModal(false);
      toast.info(err?.response?.data?.message || "Something went wrong");
    }
  };

  const handleAddOrUpdateItem = () => {
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
      (it, index) => it.serialNo.trim() === serialNoTrimmed && index !== editIndex
    );

    if (isDuplicate) {
      toast.warning("This Item With the SERIALNO already exist.");
      serialNoRef.current?.focus();
      setShowModal(false);
      return;
    }

    const price_per_unit = parseFloat(item.price_per_unit || 0);
    const gst = parseFloat(item.gst || 0);
    const baseAmount = price_per_unit * quantity;
    const discountAmount = (Discount / 100) * baseAmount;
    const taxableAmount = baseAmount - discountAmount;
    const gstAmount = (gst / 100) * taxableAmount;
    const finalAmount = taxableAmount + gstAmount;

    const newItem = {
      ...item,
      exp_date: item.exp_date ?? "",
      quantity,
      price_per_unit,
      gst,
      Discount,
      discountAmount,
      taxableAmount,
      gstAmount,
      amount: finalAmount,
    };

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

  const safeDiscount = isNaN(Discount) ? 0 : Math.max(0, Discount);

  const totalDiscountAmount = items.reduce(
    (sum, item) => sum + (item.discountAmount || 0),
    0
  );

  const totalTaxableAmount = items.reduce(
    (sum, item) => sum + (item.taxableAmount || 0),
    0
  );

  const totalGstAmount = items.reduce(
    (sum, item) => sum + (item.gstAmount || 0),
    0
  );

  const grandTotalAmount = items.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );

  const handleSubmit = async () => {
    if (!validateInvoiceDetails()) {
      toast.warning("Please fill in all invoice details before submitting.");
      setIsDetailsCollapsed(false);
      return;
    }

    if (items.length === 0) {
      toast.warning("Please add at least one item to the invoice.");
      return;
    }

    if (items.some(it => !it.serialNo || !it.serialNo.trim() || !it.quantity || isNaN(it.quantity) || Number(it.quantity) <= 0)) {
      toast.warning("Each item must have a serial number and valid quantity.");
      return;
    }

    const selectedBiller = billers.find(b => b._id === invoiceDetails.bill_to);
    const hasShippingUnits = selectedBiller?.shippingUnit?.length > 0;

    let finalShipTo = "";
    if (hasShippingUnits && invoiceDetails.billedToShippingUnitId && invoiceDetails.billedToShippingUnitId !== "__USE_BILLER__") {
      finalShipTo = invoiceDetails.billedToShippingUnitId;
    }

    const payload = {
      invoice: invoiceDetails.invoice,
      date: invoiceDetails.date,
      placeofsupply: invoiceDetails.placeofsupply,
      bill_to: invoiceDetails.bill_to,
      ...(finalShipTo ? { billedToShippingUnitId: finalShipTo } : {}),
      items,
      discount: safeDiscount,
      totalDiscountAmount: parseFloat(totalDiscountAmount.toFixed(2)),
      totalTaxableAmount: parseFloat(totalTaxableAmount.toFixed(2)),
      totalGstAmount: parseFloat(totalGstAmount.toFixed(2)),
      grandTotalAmount: parseFloat(grandTotalAmount.toFixed(2)),
    };

    try {
      const result = await axios.post(`${apiUrl}/invoices`, payload);
      if (result.status === 200 || result.status === 201) {
        navigate("/invoicepage");
      }
    } catch (error) {
        if (error?.response?.status === 409) {
        toast.error("Serial numbers already used or invoice exists. Refresh to confirm.");
      } else {
        toast.error("Failed to submit invoice. Please try again.");
      }
    }
  };

  // Focus Serial Number input on mount
  useEffect(() => {
    serialNoRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Header */}
      <div className="w-full mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center uppercase">
          Create New Invoice
        </h1>
      </div>

      {/* Invoice Details Card */}
      <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-300 mb-6 overflow-hidden">
        <div
          className="flex items-start justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)}
        >
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-gray-800" />
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

        {!isDetailsCollapsed && (
          <div className="p-5 bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-600" />
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={invoiceDetails.date}
                  onChange={(e) => setInvoiceDetails(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center">
                  <Building className="h-3 w-3 mr-1 text-gray-600" />
                  Bill To
                </label>
                <select
                  name="bill_to"
                  value={invoiceDetails.bill_to}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedBiller = billers.find(b => b._id === selectedId);
                    setInvoiceDetails(prev => ({
                      ...prev,
                      bill_to: selectedId,
                      placeofsupply: selectedBiller?.billerAddress || "",
                      billedToShippingUnitId: "",
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="">Select Biller</option>
                  {billers.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.billerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-gray-600" />
                  Place of Supply
                </label>
                <input
                  type="text"
                  name="placeofsupply"
                  value={invoiceDetails.placeofsupply}
                  onChange={(e) => setInvoiceDetails(prev => ({ ...prev, placeofsupply: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
                  placeholder="City, State"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center">
                  <Package className="h-3 w-3 mr-1 text-gray-600" />
                  Ship To
                </label>
                <select
                  name="ship_to"
                  value={invoiceDetails.billedToShippingUnitId}
                  onChange={(e) => setInvoiceDetails(prev => ({ ...prev, billedToShippingUnitId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="">Select Shipping Unit</option>
                  {billers
                    .find(b => b._id === invoiceDetails.bill_to)
                    ?.shippingUnit.map((unit, i) => (
                      <option key={unit._id || i} value={unit._id}>
                        {unit.shippingUnitName}
                      </option>
                    ))}
                  <option value="__USE_BILLER__">Use Biller Address</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center">
                  <BadgePercent className="h-3 w-3 mr-1 text-gray-600" />
                  Discount %
                </label>
                <input
                  type="number"
                  name="discount"
                  value={Discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Item Entry Card */}
      <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-300 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md font-semibold text-gray-800 flex items-center">
            <div className="p-1.5 bg-gray-200 rounded-md mr-2">
              <Package className="h-4 w-4 text-gray-700" />
            </div>
            {editIndex !== null ? "Edit Item" : "Add New Item"}
          </h2>
          {items.length > 0 && (
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-gray-600">{items.length} items</span>
              <span className="font-bold text-gray-900">
                ₹{grandTotalAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">Serial Number</label>
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
                  setItem(initialItem);
                }
              }}
              placeholder="Scan or enter serial number"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm outline-none"
            />
          </div>

          {editIndex !== null && (
            <div className="flex items-end">
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel Edit</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 && (
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-300 mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-300">
            <h2 className="text-md font-semibold text-gray-800 flex items-center">
              <div className="p-1.5 bg-gray-200 rounded-md mr-2">
                <ShoppingCart className="h-4 w-4 text-gray-700" />
              </div>
              Invoice Items
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Item</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">HSN</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Serial</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Qty</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Disc (%)</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Disc Amt</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Taxable Amt</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">GST (%)</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">GST Amt</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-300">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">{item.item_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{item.Hsn}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">{item.serialNo}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">{item.quantity} {item.unit}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-right">₹{item.price_per_unit.toFixed(2)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">{Discount}%</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">₹{item.discountAmount?.toFixed(2)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">₹{item.taxableAmount?.toFixed(2)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">{item.gst}%</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">₹{item.gstAmount?.toFixed(2)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">₹{item.amount?.toFixed(2)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(index)}
                          className="text-gray-700 hover:text-gray-900 p-1"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(index)}
                          className="text-gray-700 hover:text-gray-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan="7" className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Subtotal:</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center">₹{totalDiscountAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center">₹{totalTaxableAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center"></td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center">₹{totalGstAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">₹{grandTotalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan="11" className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Grand Total:</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">₹{grandTotalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => navigate("/invoicepage")}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg font-medium shadow-md hover:from-gray-700 hover:to-gray-900 transition-all duration-200"
        >
          <Home className="h-4 w-4" />
          <span>Back to Invoices</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={!validateInvoiceDetails() || items.length === 0}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium shadow-md transition-all duration-200 ${validateInvoiceDetails() && items.length > 0
            ? "bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-900"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
          <Send className="h-4 w-4" />
          <span>Submit Invoice</span>
        </button>
      </div>

      {/* Item Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-2xl border border-gray-300">
            <div className="bg-gradient-to-r from-gray-800 to-black p-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Package className="h-5 w-5 text-white mr-2" />
                  Item Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">Serial Number</p>
                <p className="text-sm font-semibold text-gray-900">{item.serialNo || "N/A"}</p>
              </div>

              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">HSN Code</p>
                <p className="text-sm font-semibold text-gray-900">{item.Hsn || "N/A"}</p>
              </div>

              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">Item Name</p>
                <p className="text-sm font-semibold text-gray-900">{item.item_name || "N/A"}</p>
              </div>

              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">Power</p>
                <p className="text-sm font-semibold text-gray-900">{item.power || "N/A"}</p>
              </div>

              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">MFG Date</p>
                <p className="text-sm font-semibold text-gray-900">{item.mfg_date || "N/A"}</p>
              </div>

              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">EXP Date</p>
                <p className="text-sm font-semibold text-gray-900">{item.exp_date || "N/A"}</p>
              </div>

              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">Quantity</p>
                <p className="text-sm font-semibold text-gray-900">{item.quantity || "0"} {item.unit || "PCS"}</p>
              </div>

              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">Price/Unit</p>
                <p className="text-sm font-semibold text-gray-900">₹{item.price_per_unit || "0.00"}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-100 border-t border-gray-300 rounded-b-xl flex justify-end">
              <button
                ref={addButtonRef}
                onClick={handleAddOrUpdateItem}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-900 transition-all duration-200 shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>{editIndex !== null ? "Update Item" : "Add Item"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-2xl border border-gray-300 p-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this item? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-900 transition-colors"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceCreatePage;
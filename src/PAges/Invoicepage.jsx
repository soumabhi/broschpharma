import React, { useState, useEffect } from "react";
import {
  Eye,
  Calendar,
  ClipboardList,
  Plus,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import PDFGeneration from "../PAges/PDF/PDFGeneration";

const InvoicePage = () => {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [apiData, setApiData] = useState([]);
  const [billers, setBillers] = useState([]);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState("invoice");
  const [data, setData] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Fetch billers for shipping unit name lookup
  useEffect(() => {
    axios.get(`${apiUrl}/billers`).then((res) => setBillers(res?.data));
  }, []);

  useEffect(() => {
  const handler = setTimeout(() => setDebouncedSearch(search), 500);
  return () => clearTimeout(handler);
}, [search]);


  // Pagination state (now controlled by backend)
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSizeOptions = [10, 25, 50, 100, 200];
  const totalPages = data?.total ? Math.ceil(data.total / pageSize) : 1;


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${apiUrl}/invoices?page=${currentPage}&limit=${pageSize}&search=${debouncedSearch}&searchType=${searchType}`
        );
        const data = res?.data?.data || [];
        setData(res?.data);
        setApiData(
          data.map((item) => ({
            ...item,
            id: item._id?.$oid || item._id || "",
            date: item.date?.$date || item.date || "",
          }))
        );
      } catch (err) {
        console.log("Error fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [debouncedSearch, searchType, pageSize, currentPage]);


  // Reset to first page if filteredData or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const handlePaginationChange = (newPage, newPageSize) => {
    setCurrentPage(newPage);
    setPageSize(newPageSize);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Title */}
      <div className="w-full mx-auto mb-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center uppercase">
          Invoice Management
        </h1>
      </div>

      {/* Filters and Add Button */}
      <div className="w-full mx-auto mb-4">
        <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <ClipboardList className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm w-72 transition-all duration-200"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="relative w-48">
                <select
                  onChange={(e) => setSearchType(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1"
                >
                  <option value="invoice">Invoice No</option>
                  <option value="serialNo">Serial No</option>
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.585l3.71-4.355a.75.75 0 011.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* <div className="relative">
                <Calendar className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm w-40 transition-all duration-200"
                />
              </div> */}
            </div>
            <div className="flex items-center">
              <button
                className="bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                onClick={() => navigate("/invoice")}
              >
                <Plus className="w-4 h-4" />
                New Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="w-full mx-auto">
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{ maxHeight: "calc(100vh - 270px)", minHeight: "200px" }}
          >
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    #
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Invoice
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Date
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Quantity
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Price
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Discount(%)
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Discount Amt
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Taxable Amount
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Total GST Amt
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    SGST
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    CGST
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    IGST
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Total(with GST)
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Bill To/Ship To
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="15">
                      <div className="flex items-center justify-center min-h-[300px] w-full">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800"></div>
                          <p className="text-gray-600 font-medium">
                            Loading Inventory data...
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : apiData.length > 0 ? (
                  apiData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200"
                      style={{ height: "28px" }} // Decrease row height
                    >
                      {/* # */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-xs text-left">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      {/* Invoice */}
                      <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900 text-left">
                        {row?.invoice}
                      </td>
                      {/* Date */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-left">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      {/* quantity */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-left">
                        {row?.items?.length}
                      </td>
                      {/* price  */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-left">
                        ₹
                        {(
                          row?.totalTaxableAmount + row?.discountAmount
                        ).toFixed(2)}
                      </td>
                      {/* discount % */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-left">
                        {row?.discountPercentage}%
                      </td>
                      {/* discount amount% */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-left">
                        ₹{(row?.discountAmount).toFixed(2)}
                      </td>
                      {/* Taxable Amount */}
                      <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900 text-left">
                        ₹{(row?.totalTaxableAmount).toFixed(2)}
                      </td>
                      {/* Total GST (%) */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-left">
                        ₹{(row?.totalGstAmount).toFixed(2)}
                      </td>
                      {/* SGST (%) */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-left">
                        {`₹${(row?.SGST).toFixed(2) ?? 0.0}`}
                      </td>
                      {/* CGST (%) */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-left">
                        {`₹${(row?.CGST).toFixed(2) ?? 0.0}`}
                      </td>
                      {/* IGST (%) */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-left">
                        {`₹${(row?.IGST).toFixed(2) ?? 0.0}`}
                      </td>
                      {/* total with gst */}
                      <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900 text-left align-middle">
                        ₹{(row?.amountPayable).toFixed(2)}
                      </td>
                      {/* Bill To with hover modal */}
                      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-left align-middle relative group">
                        <div className="flex items-center gap-1 group relative">
                          <ClipboardList
                            size={14}
                            className="text-gray-700 hover:text-gray-900 cursor-pointer"
                          />
                          <div className="hidden group-hover:flex flex-col fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white border border-gray-300 rounded-xl shadow-2xl p-4 text-xs text-gray-700 whitespace-normal transition-all duration-300">
                            {/* Billed To Section */}
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center mr-2">
                                <ClipboardList className="w-3 h-3 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">
                                  Billed To
                                </h4>
                                <p className="text-gray-600 text-[10px]">
                                  Invoice Information
                                </p>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                              <table className="w-full text-xs">
                                <tbody>
                                  <tr>
                                    <td className="font-semibold text-gray-700 text-[10px] pr-2 align-top">
                                      Name:
                                    </td>
                                    <td className="text-gray-900 font-medium text-[10px] break-words">
                                      {row.bill_to?.billerName || "N/A"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="font-semibold text-gray-700 text-[10px] pr-2 align-top">
                                      Address:
                                    </td>
                                    <td className="text-gray-900 font-medium text-[10px] break-words">
                                      {row.bill_to?.billerAddress || "N/A"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="font-semibold text-gray-700 text-[10px] pr-2 align-top">
                                      GSTIN:
                                    </td>
                                    <td className="text-gray-900 font-mono text-[10px] break-words">
                                      {row.bill_to?.billerGst || "N/A"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="font-semibold text-gray-700 text-[10px] pr-2 align-top">
                                      Phone:
                                    </td>
                                    <td className="text-gray-900 font-medium text-[10px] break-words">
                                      {row.bill_to?.billerPhone || "N/A"}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            {/* Shipped To Section */}
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center mr-2">
                                <Package className="w-3 h-3 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">
                                  Shipped To
                                </h4>
                                <p className="text-gray-600 text-[10px]">
                                  Shipping Information
                                </p>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <table className="w-full text-xs">
                                <tbody>
                                  <tr>
                                    <td className="font-semibold text-gray-700 text-[10px] pr-2 align-top">
                                      Name:
                                    </td>
                                    <td className="text-gray-900 font-medium text-[10px] break-words">
                                      {(() => {
                                        const isUsingBiller =
                                          row?.billedToShippingUnitId ===
                                            "__USE_BILLER__" ||
                                          !row?.billedToShippingUnitId;
                                        if (isUsingBiller) {
                                          return (
                                            row.bill_to?.billerName || "N/A"
                                          );
                                        }
                                        const shippingUnit =
                                          row?.bill_to?.shippingUnit?.find(
                                            (u) =>
                                              u._id ===
                                              row.billedToShippingUnitId
                                          );
                                        return (
                                          shippingUnit?.shippingUnitName ||
                                          "N/A"
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="font-semibold text-gray-700 text-[10px] pr-2 align-top">
                                      Address:
                                    </td>
                                    <td className="text-gray-900 font-medium text-[10px] break-words">
                                      {(() => {
                                        const isUsingBiller =
                                          row?.billedToShippingUnitId ===
                                            "__USE_BILLER__" ||
                                          !row?.billedToShippingUnitId;
                                        if (isUsingBiller) {
                                          return (
                                            row.bill_to?.billerAddress || "N/A"
                                          );
                                        }
                                        const shippingUnit =
                                          row?.bill_to?.shippingUnit?.find(
                                            (u) =>
                                              u._id ===
                                              row.billedToShippingUnitId
                                          );
                                        return (
                                          shippingUnit?.shippingUnitAddress ||
                                          "N/A"
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="font-semibold text-gray-700 text-[10px] pr-2 align-top">
                                      Phone:
                                    </td>
                                    <td className="text-gray-900 font-medium text-[10px] break-words">
                                      {(() => {
                                        const isUsingBiller =
                                          row?.billedToShippingUnitId ===
                                            "__USE_BILLER__" ||
                                          !row?.billedToShippingUnitId;
                                        if (isUsingBiller) {
                                          return (
                                            row.bill_to?.billerPhone || "N/A"
                                          );
                                        }
                                        const shippingUnit =
                                          row?.bill_to?.shippingUnit?.find(
                                            (u) =>
                                              u._id ===
                                              row.billedToShippingUnitId
                                          );
                                        return (
                                          shippingUnit?.shippingPhone || "N/A"
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-left align-middle">
                        <div className="flex justify-start items-center">
                          <button
                            onClick={async () => {
                              // Generate PDF and open in new tab
                              const doc = (
                                <PDFGeneration
                                  invoice={{
                                    ...row,
                                    discount: row.discount ?? 0,
                                    bill_to_name: row.bill_to?.billerName || "",
                                    bill_to_address:
                                      row.bill_to?.billerAddress || "",
                                    bill_to_gst: row.bill_to?.billerGst || "",
                                    bill_to_phone:
                                      row.bill_to?.billerPhone || "",
                                    bill_to_state:
                                      row.bill_to?.billerState || "",
                                    ship_to_name: (() => {
                                      if (
                                        row.billedToShippingUnitId ===
                                          "__USE_BILLER__" ||
                                        !row.billedToShippingUnitId
                                      ) {
                                        return row.bill_to?.billerName || "";
                                      }
                                      const su =
                                        row.bill_to?.shippingUnit?.find(
                                          (u) =>
                                            u._id === row.billedToShippingUnitId
                                        );
                                      return su ? su.shippingUnitName : "";
                                    })(),
                                    ship_to_address: (() => {
                                      if (
                                        row.billedToShippingUnitId ===
                                          "__USE_BILLER__" ||
                                        !row.billedToShippingUnitId
                                      ) {
                                        return row.bill_to?.billerAddress || "";
                                      }
                                      const su =
                                        row.bill_to?.shippingUnit?.find(
                                          (u) =>
                                            u._id === row.billedToShippingUnitId
                                        );
                                      return su ? su.shippingUnitAddress : "";
                                    })(),
                                    ship_to_phone: (() => {
                                      if (
                                        row.billedToShippingUnitId ===
                                          "__USE_BILLER__" ||
                                        !row.billedToShippingUnitId
                                      ) {
                                        return row.bill_to?.billerPhone || "";
                                      }
                                      const su =
                                        row.bill_to?.shippingUnit?.find(
                                          (u) =>
                                            u._id === row.billedToShippingUnitId
                                        );
                                      return su ? su.shippingPhone : "";
                                    })(),
                                    ship_to_state: (() => {
                                      if (
                                        row.billedToShippingUnitId ===
                                          "__USE_BILLER__" ||
                                        !row.billedToShippingUnitId
                                      ) {
                                        return row.bill_to?.billerState || "";
                                      }
                                      const su =
                                        row.bill_to?.shippingUnit?.find(
                                          (u) =>
                                            u._id === row.billedToShippingUnitId
                                        );
                                      return su ? su.shippingState : "";
                                    })(),
                                    items: (row.items || []).map((itm) => ({
                                      ...itm,
                                      item_name: itm.item_name,
                                      hsn_sac: itm.hsn || itm.Hsn || "-",
                                      serial_no:
                                        itm.serial_no || itm.serialNo || "-",
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
                                              .padStart(2, "0")}/${
                                              itm.exp_date.year
                                            }`
                                          : itm.expDate || "",
                                      quantity: itm.quantity,
                                      unit: itm.unit,
                                      price_per_unit:
                                        itm.selling_price || itm.price_per_unit,
                                      gst_percent:
                                        itm.gst_percent ??
                                        itm.gstPercentage ??
                                        0,
                                      gst: itm.gst ?? itm.gstAmount ?? 0,
                                      amount: itm.amount,
                                    })),
                                  }}
                                />
                              );
                              const blob = await pdf(doc).toBlob();
                              const url = URL.createObjectURL(blob);
                              window.open(url, "_blank");
                            }}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="15" className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            No invoices found
                          </h3>
                          <p className="text-gray-600 text-xs">
                            No invoices match your current search criteria.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Pagination Controls (Footer Section) */}
      <div className="mt-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <span className="font-medium text-gray-700">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) =>
                  handlePaginationChange(1, parseInt(e.target.value))
                }
                className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
              Showing{" "}
              <span className="font-bold text-gray-900">
                {data?.total === 0 || !data?.total
                  ? "0"
                  : (currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * pageSize, data?.total || 0)}
              </span>{" "}
              of <span className="font-bold text-gray-900">{data?.total}</span>{" "}
              entries
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePaginationChange(currentPage - 1, pageSize)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                currentPage === 1
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
                      onClick={() => handlePaginationChange(pageNum, pageSize)}
                      aria-label={`Go to page ${pageNum}`}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                        currentPage === pageNum
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
              onClick={() => handlePaginationChange(currentPage + 1, pageSize)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                currentPage === totalPages
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
  );
};

export default InvoicePage;

import React, { useState, useEffect, act } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, Legend, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, RadarChart, PieChart, Pie, Cell
} from 'recharts';
import {
  Package, TrendingDown, TrendingUp, Download, Search, ArrowLeft,
  Contact2, ChevronRight, ChevronDown, AlertTriangle, CheckCircle, BarChart3, Calendar,
  Building2, Users, Eye, X, FileText, AlertCircle
} from 'lucide-react';
import MonthlyReportPDF from '../PDF/MonthlyReportPDF';
const baseURL = import.meta.env.VITE_API_URL;

const SimpleDashBoard = () => {
  /* ---------- State Hooks ---------- */
  const [timeFilter, setTimeFilter] = useState('monthly');
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [consumptionView, setConsumptionView] = useState('biller');
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stockInOutView, setStockInOutView] = useState('monthly');

  /* ---------- Patient Consumption State ---------- */
  const [patientConsumptionData, setPatientConsumptionData] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientConsumptionLoading, setPatientConsumptionLoading] = useState(false);
  const [selectedPatientShipper, setSelectedPatientShipper] = useState(null);
  const [allShippersForPatients, setAllShippersForPatients] = useState([]);

  /* ---------- RBAC State ---------- */
  const [userData, setUserData] = useState(null);

  /* ---------- Shipper Dashboard State ---------- */
  const [shipperDashboardData, setShipperDashboardData] = useState(null);
  const [selectedShipperId, setSelectedShipperId] = useState(null);
  const [shippersList, setShippersList] = useState([]);
  // SuperAdmin state
  const [selectedShipperForSuperAdmin, setSelectedShipperForSuperAdmin] = useState(null);
  const [superAdminShipperDashboard, setSuperAdminShipperDashboard] = useState(null);

  /* ---------- Accordion State ---------- */
  const [accordionState, setAccordionState] = useState({
    companyWise: false,
    productWise: false,
    powerWise: false
  });

  const toggleAccordion = (section) => {
    setAccordionState(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /* ---------- Pagination & Sorting ---------- */
  // Low Stock
  const [lowStockPage, setLowStockPage] = useState(1);
  const lowStockPerPage = 10;
  const filteredLowStock = dashboardData?.lowStock?.filter(item =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.power.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  const lowStockTotalPages = Math.ceil(filteredLowStock.length / lowStockPerPage);
  const paginatedLowStock = filteredLowStock.slice((lowStockPage - 1) * lowStockPerPage, lowStockPage * lowStockPerPage);

  // Non-Moving Stock
  const [nonMovingPage, setNonMovingPage] = useState(1);
  const [nonMovingSearch, setNonMovingSearch] = useState('');
  const [nonMovingSort, setNonMovingSort] = useState({ key: 'productName', direction: 'asc' });
  const nonMovingPerPage = 10;
  const filteredNonMoving = dashboardData?.nonMovingStock?.filter(item =>
    item.productName.toLowerCase().includes(nonMovingSearch.toLowerCase()) ||
    item.power.toLowerCase().includes(nonMovingSearch.toLowerCase()) ||
    item.companyName.toLowerCase().includes(nonMovingSearch.toLowerCase())
  ) || [];
  const sortedNonMoving = filteredNonMoving.slice().sort((a, b) => {
    const key = nonMovingSort.key;
    if (a[key] < b[key]) return nonMovingSort.direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return nonMovingSort.direction === 'asc' ? 1 : -1;
    return 0;
  });
  const nonMovingTotalPages = Math.ceil(sortedNonMoving.length / nonMovingPerPage);
  const paginatedNonMoving = sortedNonMoving.slice((nonMovingPage - 1) * nonMovingPerPage, nonMovingPage * nonMovingPerPage);

  // Expiring Soon
  const [expSoonPage, setExpSoonPage] = useState(1);
  const [expSoonSearch, setExpSoonSearch] = useState('');
  const [expSoonSort, setExpSoonSort] = useState({ key: 'expiryDate', direction: 'asc' });
  const expSoonPerPage = 10;
  const filteredExpSoon = dashboardData?.expiringSoon?.filter(item =>
    item.productName.toLowerCase().includes(expSoonSearch.toLowerCase()) ||
    item.power?.toLowerCase().includes(expSoonSearch.toLowerCase()) ||
    item.companyName?.toLowerCase().includes(expSoonSearch.toLowerCase())
  ) || [];
  const sortedExpSoon = filteredExpSoon.slice().sort((a, b) => {
    const key = expSoonSort.key;
    if (a[key] < b[key]) return expSoonSort.direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return expSoonSort.direction === 'asc' ? 1 : -1;
    return 0;
  });
  const expSoonTotalPages = Math.ceil(sortedExpSoon.length / expSoonPerPage);
  const paginatedExpSoon = sortedExpSoon.slice((expSoonPage - 1) * expSoonPerPage, expSoonPage * expSoonPerPage);

  // Consumers - Updated for new API structure
  const [consumerPage, setConsumerPage] = useState(1);
  const [consumerSort, setConsumerSort] = useState({ key: 'consumerName', direction: 'asc' });
  const consumersPerPage = 10;
  const filterConsumers = () => {
    if (!dashboardData?.dateRangeConsumption?.billerConsumption) return [];

    if (consumptionView === 'biller') {
      // Return billers
      return dashboardData.dateRangeConsumption.billerConsumption.filter(biller =>
        biller.billerName.toLowerCase().includes(searchTerm.toLowerCase())
      ).map(biller => ({
        consumerId: biller.billerName,
        consumerName: biller.billerName,
        totalConsumption: biller.totalConsumption,
        isShipper: false,
        shippers: biller.shipperUnderBillerConsumption || []
      }));
    } else {
      // Return all shippers from all billers
      const allShippers = [];
      dashboardData.dateRangeConsumption.billerConsumption.forEach(biller => {
        biller.shipperUnderBillerConsumption?.forEach(shipper => {
          if (shipper.consumerName.toLowerCase().includes(searchTerm.toLowerCase())) {
            allShippers.push({
              consumerId: shipper.consumerId,
              consumerName: shipper.consumerName,
              totalConsumption: shipper.totalConsumption,
              isShipper: true,
              products: shipper.productWiseConsumption || []
            });
          }
        });
      });
      return allShippers;
    }
  };
  const filteredConsumers = filterConsumers();
  const sortedConsumers = filteredConsumers.slice().sort((a, b) => {
    const key = consumerSort.key === 'consumerName' ? 'consumerName' :
      consumerSort.key === 'isShipper' ? 'isShipper' :
        consumerSort.key === 'productsCount' ? 'totalConsumption' :
          consumerSort.key === 'units' ? 'totalConsumption' : 'consumerName';

    if (consumerSort.key === 'isShipper') {
      // For boolean sorting
      if (a[key] === b[key]) return 0;
      return consumerSort.direction === 'asc' ? (a[key] ? 1 : -1) : (a[key] ? -1 : 1);
    }

    if (a[key] < b[key]) return consumerSort.direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return consumerSort.direction === 'asc' ? 1 : -1;
    return 0;
  });
  const consumerTotalPages = Math.ceil(sortedConsumers.length / consumersPerPage);
  const paginatedConsumers = sortedConsumers.slice((consumerPage - 1) * consumersPerPage, consumerPage * consumersPerPage);

  // Products - Updated for new API structure
  const [productPage, setProductPage] = useState(1);
  const [productSort, setProductSort] = useState({ key: 'productName', direction: 'desc' });
  const productsPerPage = 10;
  const getAvailableProducts = () => {
    if (!selectedConsumer) return [];

    const selectedConsumerData = filteredConsumers.find(c => c.consumerId === selectedConsumer);
    if (!selectedConsumerData) return [];

    let products = [];
    if (consumptionView === 'biller' && selectedConsumerData.shippers) {
      // For billers, aggregate products from all shippers
      const productMap = {};
      selectedConsumerData.shippers.forEach(shipper => {
        shipper.productWiseConsumption?.forEach(product => {
          const key = `${product.productName}_${product.companyName}`;
          if (productMap[key]) {
            productMap[key].totalConsumption += product.totalConsumption;
            // Merge power data
            product.powerWiseConsumption?.forEach(powerData => {
              const existingPower = productMap[key].powerWiseConsumption.find(p => p.power === powerData.power);
              if (existingPower) {
                existingPower.count += powerData.count;
              } else {
                productMap[key].powerWiseConsumption.push({ ...powerData });
              }
            });
          } else {
            productMap[key] = {
              productName: product.productName,
              companyName: product.companyName,
              totalConsumption: product.totalConsumption,
              powerWiseConsumption: [...(product.powerWiseConsumption || [])]
            };
          }
        });
      });
      products = Object.values(productMap);
    } else if (selectedConsumerData.products) {
      // For shippers, use direct products
      products = selectedConsumerData.products;
    }

    // Calculate percentages
    const totalConsumption = products.reduce((sum, product) => sum + product.totalConsumption, 0);
    return products.map(product => ({
      ...product,
      percentage: totalConsumption > 0 ? Math.round((product.totalConsumption / totalConsumption) * 100 * 100) / 100 : 0,
      power: product.powerWiseConsumption?.[0]?.power || 'N/A'
    }));
  };
  const availableProducts = getAvailableProducts();
  const sortedProducts = availableProducts.slice().sort((a, b) => {
    const key = productSort.key === 'productName' ? 'productName' :
      productSort.key === 'companyName' ? 'companyName' :
        productSort.key === 'count' ? 'totalConsumption' :
          productSort.key === 'percentage' ? 'percentage' :
            productSort.key === 'rank' ? 'totalConsumption' : 'productName';  // 'rank' maps to 'totalConsumption'

    if (a[key] < b[key]) return productSort.direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return productSort.direction === 'asc' ? 1 : -1;
    return 0;
  });
  const productTotalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const paginatedProducts = sortedProducts.slice((productPage - 1) * productsPerPage, productPage * productsPerPage);

  /* ---------- Column Visibility & CSV Export ---------- */
  const [lowStockCols, setLowStockCols] = useState({ product: true, power: true, company: true, quantity: true, status: true });
  const [nonMovingCols, setNonMovingCols] = useState({ product: true, power: true, company: true });
  const [expSoonCols, setExpSoonCols] = useState({ product: true, expiry: true, company: true });
  const [consumerCols, setConsumerCols] = useState({ name: true, type: true, products: true, units: true });
  const [productCols, setProductCols] = useState({ product: true, company: true, count: true, percent: true, rank: true });

  const [showLowStockCols, setShowLowStockCols] = useState(false);
  const [showNonMovingCols, setShowNonMovingCols] = useState(false);
  const [showExpSoonCols, setShowExpSoonCols] = useState(false);
  const [showConsumerCols, setShowConsumerCols] = useState(false);
  const [showProductCols, setShowProductCols] = useState(false);

  /* ---------- Report Generation State ---------- */
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [selectedBillerForReport, setSelectedBillerForReport] = useState('');
  const [selectedShipperForReport, setSelectedShipperForReport] = useState('');
  const [availableBillers, setAvailableBillers] = useState([]);
  const [availableShippersForBiller, setAvailableShippersForBiller] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  /* ---------- Custom Date Range State ---------- */
  const [reportDateFilter, setReportDateFilter] = useState('monthly'); // 'monthly' or 'custom'
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');

  /* ---------- Report Modal State ---------- */
  const [showSaleReportModal, setShowSaleReportModal] = useState(false);
  const [showConsumptionReportModal, setShowConsumptionReportModal] = useState(false);

  /* ---------- Snackbar State ---------- */
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: '',
    type: 'error' // 'error', 'success', 'warning', 'info'
  });

  /* ---------- Set Default Year/Month for Reports ---------- */
  useEffect(() => {
    if (showSaleReportModal || showConsumptionReportModal) {
      const { years } = getAvailableMonthsYears();
      if (years.length > 0) {
        const latestYear = years[0]; // years are sorted in descending order
        setReportYear(latestYear);

        // Set the latest available month for the selected year
        const availableMonths = getAvailableMonthsForYear(latestYear);
        if (availableMonths.length > 0) {
          setReportMonth(availableMonths[availableMonths.length - 1]); // Get the latest month
        }
      }
    }
  }, [showSaleReportModal, showConsumptionReportModal, dashboardData, shipperDashboardData, superAdminShipperDashboard]);

  function exportToCSV(data, columns, filename) {
    const visibleCols = Object.keys(columns).filter(col => columns[col]);
    const header = visibleCols.join(',');
    const rows = data.map(row => visibleCols.map(col => row[col] ?? '').join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------- Helper Functions for Available Months/Years ---------- */
  const getAvailableMonthsYears = () => {
    let dataSource = null;

    if (userData?.role === 'shipper' && shipperDashboardData) {
      dataSource = shipperDashboardData;
    } else if (userData?.role === 'superAdmin' && selectedShipperForSuperAdmin && superAdminShipperDashboard) {
      dataSource = superAdminShipperDashboard;
    } else if (dashboardData) {
      dataSource = dashboardData;
    }

    if (!dataSource?.monthlyTrend?.monthly) return { months: [], years: [] };

    const monthlyData = dataSource.monthlyTrend.monthly;
    const availableYears = [...new Set(monthlyData.map(item => item.year))].sort((a, b) => b - a);

    return {
      months: monthlyData,
      years: availableYears
    };
  };

  const getAvailableMonthsForYear = (year) => {
    const { months } = getAvailableMonthsYears();
    return months.filter(item => item.year === year).map(item => item.month).sort((a, b) => a - b);
  };

  const getMonthName = (monthNum) => {
    return new Date(0, monthNum - 1).toLocaleDateString('en-US', { month: 'long' });
  };

  /* ---------- Snackbar Helper Function ---------- */
  const showSnackbar = (message, type = 'error') => {
    setSnackbar({
      show: true,
      message,
      type
    });

    // Auto-hide after 4 seconds
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  /* ---------- Helper Functions for Reports ---------- */
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      // Split at 'T' to remove time part if it's an ISO string
      const dateString = typeof date === 'string' && date.includes('T') ? date.split('T')[0] : date;
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  const formatExpiryDate = (expiryObj) => {
    if (!expiryObj) return 'N/A';

    // Handle string format (if it comes as ISO string)
    if (typeof expiryObj === 'string') {
      return formatDate(expiryObj);
    }

    // Handle object format {month, year} or {month, year, day}
    if (typeof expiryObj === 'object') {
      const { month, year } = expiryObj;

      if (!year || !month) return 'N/A';

      // Validate month range
      if (month < 1 || month > 12) return 'N/A';

      // Get month name and format as "Month, Year"
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const monthName = monthNames[month - 1]; // month is 1-indexed
      return `${monthName}, ${year}`;
    }

    return 'N/A';
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
    return Number(amount).toFixed(2);
  };

  /* ---------- Report CSV Export Functions ---------- */
  const generateSaleReportCSV = async () => {
    if (!selectedBillerForReport) {
      showSnackbar('Please select a biller first');
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Get biller info
      const selectedBiller = availableBillers.find(biller => biller.id === selectedBillerForReport);
      if (!selectedBiller) {
        showSnackbar('Selected biller not found');
        return;
      }

      // Build query parameters for filtering
      const params = new URLSearchParams();

      if (reportDateFilter === 'custom') {
        // Use custom date range
        if (reportFromDate) params.append('fromDate', reportFromDate);
        if (reportToDate) params.append('toDate', reportToDate);
      } else {
        // Use month/year filter
        if (reportMonth) params.append('month', reportMonth);
        if (reportYear) params.append('year', reportYear);
      }

      if (selectedShipperForReport) params.append('shipperId', selectedShipperForReport);

      // Use the new Sale Report API
      const response = await fetch(`${baseURL}/dashboard/billerSales/${selectedBiller.id}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch sale data');
      }

      const saleReportData = await response.json();

      if (!saleReportData.salesData || saleReportData.salesData.length === 0) {
        showSnackbar('No sale data found for the selected criteria');
        return;
      }

      // Map to your exact column structure with optimized data handling
      const saleData = saleReportData.salesData.map((item, index) => ({
        '#': index + 1,
        'Product Name': item.productName || 'N/A',
        'Serial No': item.serialNo || 'N/A',
        'Power': item.power || 'N/A',
        'BROSCH Serial No': item.broschSerialNo || 'N/A',
        'Expiry Date': formatExpiryDate(item.expiryDate),
        'Taxable Amt': formatCurrency(item.taxableAmount),
        'Discount': formatCurrency(item.discount),
        'GST %': item.gstPercentage ? `${item.gstPercentage}%` : 'N/A',
        'Total Amt': formatCurrency(item.totalAmount),
        'Invoice No': item.invoiceNo || 'N/A',
        'Billing date': formatDate(item.billingDate),
        'Biller Name': item.billerName || selectedBiller.name || 'N/A',
        'Shipper Name': item.shipperName || 'N/A',
        'Requisition No': item.requisitionNo || 'N/A'
      }));

      if (saleData.length === 0) {
        showSnackbar('No sale data found for the selected criteria');
        return;
      }

      // Create CSV with proper escaping for special characters
      const headers = Object.keys(saleData[0]);
      const csvContent = [
        headers.join(','),
        ...saleData.map(row => headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if value contains special characters
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return `"${value}"`;
        }).join(','))
      ].join('\n');

      // Download CSV with better filename
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const downloadUrl = URL.createObjectURL(blob);
      link.setAttribute('href', downloadUrl);

      // Enhanced filename with total records and date range
      let dateRangeSuffix;
      if (reportDateFilter === 'custom') {
        const fromDateStr = reportFromDate ? new Date(reportFromDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '';
        const toDateStr = reportToDate ? new Date(reportToDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '';
        dateRangeSuffix = `${fromDateStr}_to_${toDateStr}`;
      } else {
        const monthName = new Date(0, reportMonth - 1).toLocaleDateString('en-US', { month: 'short' });
        dateRangeSuffix = `${monthName}${reportYear}`;
      }

      const shipperSuffix = selectedShipperForReport ?
        `_${(availableShippersForBiller.find(s => s.id === selectedShipperForReport)?.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_')}` :
        '_AllShippers';

      link.setAttribute('download',
        `Sale_Report_${selectedBiller.name.replace(/[^a-zA-Z0-9]/g, '_')}_${dateRangeSuffix}${shipperSuffix}_${saleData.length}records.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      // Close modal and reset form
      setShowSaleReportModal(false);
      setSelectedBillerForReport('');
      setSelectedShipperForReport('');
      setReportDateFilter('monthly');
      setReportFromDate('');
      setReportToDate('');

      const dateRangeText = reportDateFilter === 'custom'
        ? `${reportFromDate || 'N/A'} to ${reportToDate || 'N/A'}`
        : `${new Date(0, reportMonth - 1).toLocaleDateString('en-US', { month: 'long' })} ${reportYear}`;

      showSnackbar(`Sale report generated successfully! ${saleData.length} records exported for ${dateRangeText}.`, 'success');

    } catch (error) {
      console.error('Error generating sale report:', error);
      showSnackbar(`Error generating sale report: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generateConsumptionReportCSV = async () => {
    if (!selectedBillerForReport) {
      showSnackbar('Please select a biller first');
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Get biller info
      const selectedBiller = availableBillers.find(biller => biller.id === selectedBillerForReport);
      if (!selectedBiller) {
        showSnackbar('Selected biller not found');
        return;
      }

      let consumptionData = [];

      // Build query parameters for filtering
      const params = new URLSearchParams();

      if (reportDateFilter === 'custom') {
        // Use custom date range
        if (reportFromDate) params.append('fromDate', reportFromDate);
        if (reportToDate) params.append('toDate', reportToDate);
      } else {
        // Use month/year filter
        if (reportMonth) params.append('month', reportMonth);
        if (reportYear) params.append('year', reportYear);
      }

      if (selectedShipperForReport) {
        // Use shipper-specific CSV API for individual shipper
        const response = await fetch(`${baseURL}/dashboard/shipperConsumptionCSV/${selectedShipperForReport}?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch shipper consumption data');
        }

        const data = await response.json();

        // Use the pre-formatted CSV data with all 19 columns
        consumptionData = data.csvData || [];
      } else {
        // Use biller-wide CSV API for all shippers under biller
        const response = await fetch(`${baseURL}/dashboard/billerConsumptionCSV/${selectedBiller.id}?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch biller consumption data');
        }

        const data = await response.json();

        // Use the pre-formatted CSV data with all 19 columns
        consumptionData = data.csvData || [];
      }

      if (consumptionData.length === 0) {
        showSnackbar('No consumption data found for the selected criteria');
        return;
      }

      // Create CSV with proper escaping for special characters
      const headers = Object.keys(consumptionData[0]);
      const csvContent = [
        headers.join(','),
        ...consumptionData.map(row => headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if value contains special characters
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return `"${value}"`;
        }).join(','))
      ].join('\n');

      // Download CSV with better filename
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const downloadUrl = URL.createObjectURL(blob);
      link.setAttribute('href', downloadUrl);

      // Enhanced filename with total records and date range
      let dateRangeSuffix;
      if (reportDateFilter === 'custom') {
        const fromDateStr = reportFromDate ? new Date(reportFromDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '';
        const toDateStr = reportToDate ? new Date(reportToDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '';
        dateRangeSuffix = `${fromDateStr}_to_${toDateStr}`;
      } else {
        const monthName = new Date(0, reportMonth - 1).toLocaleDateString('en-US', { month: 'short' });
        dateRangeSuffix = `${monthName}${reportYear}`;
      }

      const shipperSuffix = selectedShipperForReport ?
        `_${(availableShippersForBiller.find(s => s.id === selectedShipperForReport)?.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_')}` :
        '_AllShippers';

      link.setAttribute('download',
        `Consumption_Report_${selectedBiller.name.replace(/[^a-zA-Z0-9]/g, '_')}_${dateRangeSuffix}${shipperSuffix}_${consumptionData.length}records.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      // Close modal and reset form
      setShowConsumptionReportModal(false);
      setSelectedBillerForReport('');
      setSelectedShipperForReport('');
      setReportDateFilter('monthly');
      setReportFromDate('');
      setReportToDate('');

      const dateRangeText = reportDateFilter === 'custom'
        ? `${reportFromDate || 'N/A'} to ${reportToDate || 'N/A'}`
        : `${new Date(0, reportMonth - 1).toLocaleDateString('en-US', { month: 'long' })} ${reportYear}`;

      showSnackbar(`Consumption report generated successfully! ${consumptionData.length} records exported for ${dateRangeText}.`, 'success');

    } catch (error) {
      console.error('Error generating consumption report:', error);
      showSnackbar(`Error generating consumption report: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  /* ---------- RBAC - Load User Data ---------- */
  useEffect(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        setUserData(user);

        // Set default active tab based on user role
        if (user.role === 'shipper') {
          setActiveTab('shipper');
        } else if (user.role === 'superAdmin') {
          setActiveTab('overview');
        } else {
          setActiveTab('overview');
        }
      } else {
        setActiveTab('overview');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setActiveTab('overview');
    }
  }, []);

  /* ---------- Auto-select Shipper for Shipper Role ---------- */
  useEffect(() => {
    if (userData?.role === 'shipper' && userData?.shippingUnitId) {
      setSelectedShipperId(userData.shippingUnitId);
    }
  }, [userData]);

  /* ---------- Fetch Data Based on User Role ---------- */
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.role) return;

      try {
        // For users and superAdmins
        if (userData.role === 'user' || userData.role === 'superAdmin') {
          const response = await fetch(`${baseURL}/dashboard/get`);
          const data = await response.json();

          // Fetch shippers list from billers API
          try {
            const billersResponse = await fetch(`${baseURL}/billers`);
            const billersData = await billersResponse.json();

            // Extract all shipping units from all billers
            const shippers = [];
            const allShippersForPatients = [];
            if (Array.isArray(billersData)) {
              billersData.forEach(biller => {
                if (biller.shippingUnit && Array.isArray(biller.shippingUnit)) {
                  biller.shippingUnit.forEach(shippingUnit => {
                    shippers.push({
                      shipperId: shippingUnit._id,
                      shipperName: shippingUnit.shippingUnitName,
                      billerName: biller.billerName,
                      billerGst: biller.billerGst,
                      shippingUnitAddress: shippingUnit.shippingUnitAddress,
                      shippingEmail: shippingUnit.shippingEmail,
                      shippingPhone: shippingUnit.shippingPhone
                    });

                    // Also add to patient consumption shippers list
                    allShippersForPatients.push({
                      shipperId: shippingUnit._id,
                      shipperName: shippingUnit.shippingUnitName,
                      billerName: biller.billerName,
                      displayName: `${shippingUnit.shippingUnitName} (${biller.billerName})`
                    });
                  });
                }
              });
            }
            setShippersList(shippers);
            setAllShippersForPatients(allShippersForPatients);
          } catch (billersError) {
            console.error('Error fetching billers data:', billersError);
            setShippersList([]);
            setAllShippersForPatients([]);
          }

          // Fetch additional data
          const [availableStockRes, nearExpireRes, monthlyTrendRes] = await Promise.all([
            fetch(`${baseURL}/dashboard/availableStock`),
            fetch(`${baseURL}/dashboard/nearExpire`),
            fetch(`${baseURL}/dashboard/monthlyconsumptiontrend`)
          ]);

          const availableStockData = await availableStockRes.json();
          const nearExpireData = await nearExpireRes.json();
          const monthlyTrendData = await monthlyTrendRes.json();

          // Merge data
          const mergedData = {
            ...data,
            availableStock: availableStockData,
            nearExpire: nearExpireData,
            monthlyTrend: monthlyTrendData
          };

          setDashboardData(mergedData);
        } else if (userData.role === 'shipper') {
          setDashboardData(null);
          setShippersList([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, [userData?.role]);

  useEffect(() => {
    setSelectedProduct(null);
  }, [consumptionView, selectedConsumer]);
  /* ---------- Fetch Shipper Data for SuperAdmin ---------- */
  useEffect(() => {
    const fetchSuperAdminShipperData = async () => {
      if (userData?.role !== 'superAdmin' || !selectedShipperForSuperAdmin) {
        setSuperAdminShipperDashboard(null);
        return;
      }

      // Reset dashboard before fetching new data
      setSuperAdminShipperDashboard(null);

      try {
        const [availableStockRes, monthlyTrendRes, consumptionRes] = await Promise.all([
          fetch(`${baseURL}/dashboard/availableStockshipper/${selectedShipperForSuperAdmin}`),
          fetch(`${baseURL}/dashboard/monthlyConsumptionTrendshipper/${selectedShipperForSuperAdmin}`),
          fetch(`${baseURL}/dashboard/shipperConsumption/${selectedShipperForSuperAdmin}`)
        ]);

        const availableStockData = await availableStockRes.json();
        const monthlyTrendData = await monthlyTrendRes.json();
        const consumptionData = await consumptionRes.json();

        const mergedShipperData = {
          availableStock: availableStockData,
          monthlyTrend: monthlyTrendData,
          consumption: consumptionData
        };

        setSuperAdminShipperDashboard(mergedShipperData);
      } catch (error) {
        console.error('Error fetching superAdmin shipper data:', error);
      }
    };

    fetchSuperAdminShipperData();
  }, [selectedShipperForSuperAdmin, userData?.role]);

  /* ---------- Fetch Shipper Data Based on Role ---------- */
  useEffect(() => {
    const fetchShipperData = async () => {
      // Only fetch shipper data if user is shipper role and has shippingUnitId
      if (userData?.role !== 'shipper' || !selectedShipperId) {
        setShipperDashboardData(null);
        return;
      }

      try {
        // Only call shipper-specific APIs for shipper role users
        const [availableStockRes, monthlyTrendRes, consumptionRes] = await Promise.all([
          fetch(`${baseURL}/dashboard/availableStockshipper/${selectedShipperId}`),
          fetch(`${baseURL}/dashboard/monthlyConsumptionTrendshipper/${selectedShipperId}`),
          fetch(`${baseURL}/dashboard/shipperConsumption/${selectedShipperId}`)
        ]);

        const availableStockData = await availableStockRes.json();
        const monthlyTrendData = await monthlyTrendRes.json();
        const consumptionData = await consumptionRes.json();

        const mergedShipperData = {
          availableStock: availableStockData,
          monthlyTrend: monthlyTrendData,
          consumption: consumptionData
        };

        setShipperDashboardData(mergedShipperData);
      } catch (error) {
        console.error('Error fetching shipper dashboard data:', error);
      }
    };

    fetchShipperData();
  }, [selectedShipperId, userData?.role]); // Depend on both shipperId and user role

  /* ---------- Patient Consumption Data Fetch ---------- */
  const fetchPatientConsumptionData = async (shipperId) => {
    if (!shipperId) return;

    setPatientConsumptionLoading(true);
    try {
      const response = await fetch(`${baseURL}/dashboard/shipperConsumption/${shipperId}`);
      if (response.ok) {
        const data = await response.json();
        setPatientConsumptionData(data);
      } else {
        console.error('Failed to fetch patient consumption data');
        setPatientConsumptionData(null);
      }
    } catch (error) {
      console.error('Error fetching patient consumption data:', error);
      setPatientConsumptionData(null);
    } finally {
      setPatientConsumptionLoading(false);
    }
  };

  // Fetch patient data when shipper is selected
  useEffect(() => {
    if (selectedPatientShipper) {
      fetchPatientConsumptionData(selectedPatientShipper);
    } else {
      setPatientConsumptionData(null);
    }
  }, [selectedPatientShipper]);

  /* ---------- Populate Report Billers and Shippers ---------- */
  useEffect(() => {
    const fetchBillersForReports = async () => {
      try {
        const response = await fetch(`${baseURL}/billers`);
        const data = await response.json();

        if (Array.isArray(data)) {
          setAvailableBillers(data.map(biller => ({
            id: biller._id,
            name: biller.billerName,
            shippingUnits: biller.shippingUnit || []
          })));
        }
      } catch (error) {
        console.error('Error fetching billers for reports:', error);
        setAvailableBillers([]);
      }
    };

    fetchBillersForReports();
  }, []);

  // Update available shippers when biller is selected
  useEffect(() => {
    if (selectedBillerForReport) {
      const selectedBiller = availableBillers.find(biller => biller.id === selectedBillerForReport);
      if (selectedBiller && selectedBiller.shippingUnits) {
        setAvailableShippersForBiller(selectedBiller.shippingUnits.map(shipper => ({
          id: shipper._id,
          name: shipper.shippingUnitName
        })));
      } else {
        setAvailableShippersForBiller([]);
      }
      setSelectedShipperForReport(''); // Reset shipper selection when biller changes
    } else {
      setAvailableShippersForBiller([]);
      setSelectedShipperForReport('');
    }
  }, [selectedBillerForReport, availableBillers]);

  /* ---------- Data Formatters ---------- */
  const formatMonthlyData = () => {
    if (!dashboardData?.monthlyTrend) return [];

    // Handle new API structure with daily, weekly, monthly data
    let dataToFormat = [];

    switch (timeFilter) {
      case 'daily':
        if (dashboardData.monthlyTrend.daily) {
          dataToFormat = dashboardData.monthlyTrend.daily.map(item => ({
            month: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            consumption: item.totalConsumption,
            fullDate: item.date,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
      case 'weekly':
        if (dashboardData.monthlyTrend.weekly) {
          dataToFormat = dashboardData.monthlyTrend.weekly.map(item => ({
            month: item.week,
            consumption: item.totalConsumption,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
      case 'monthly':
        if (dashboardData.monthlyTrend.monthly) {
          dataToFormat = dashboardData.monthlyTrend.monthly.map(item => ({
            month: `${item.month}/${item.year}`,
            consumption: item.totalConsumption,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
      case 'all-time':
        // Use the new allTimeConsumptionChart data from backend
        if (dashboardData.monthlyTrend.allTimeConsumptionChart) {
          dataToFormat = dashboardData.monthlyTrend.allTimeConsumptionChart.map(item => ({
            month: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            consumption: item.totalConsumption,
            fullDate: item.date,
            mostUsedPowers: item.mostUsedPowerTop10,
            type: 'allTime'
          }));
        } else if (dashboardData.monthlyTrend.monthly) {
          // Fallback: Create cumulative consumption data from monthly
          let cumulativeTotal = 0;
          dataToFormat = dashboardData.monthlyTrend.monthly.map(item => {
            cumulativeTotal += item.totalConsumption;
            return {
              month: `${item.month}/${item.year}`,
              consumption: cumulativeTotal, // Show cumulative total
              originalConsumption: item.totalConsumption, // Keep original for reference
              mostUsedPowers: item.mostUsedPowerTop10,
              type: 'cumulative'
            };
          });
        } else {
          // Fallback: if no monthly data, use daily data but group by month
          const monthlyAggregated = {};

          if (dashboardData.monthlyTrend.daily) {
            dashboardData.monthlyTrend.daily.forEach(item => {
              const date = new Date(item.date);
              const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

              if (!monthlyAggregated[monthYear]) {
                monthlyAggregated[monthYear] = {
                  month: monthYear,
                  consumption: 0,
                  mostUsedPowers: item.mostUsedPowerTop10 || []
                };
              }
              monthlyAggregated[monthYear].consumption += item.totalConsumption;
            });
          }

          // Convert to cumulative array
          let cumulativeTotal = 0;
          dataToFormat = Object.values(monthlyAggregated).map(item => {
            cumulativeTotal += item.consumption;
            return {
              ...item,
              consumption: cumulativeTotal,
              originalConsumption: item.consumption,
              type: 'cumulative'
            };
          });
        }
        break;
      default:
        // Default to monthly view
        if (dashboardData.monthlyTrend.monthly) {
          dataToFormat = dashboardData.monthlyTrend.monthly.map(item => ({
            month: `${item.month}/${item.year}`,
            consumption: item.totalConsumption,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
    }

    // Sort by date/period for proper display
    return dataToFormat.reverse();
  };

  const getTotalSold = () => {
    // For specific time filters, try to get data from the time-based API first
    if (timeFilter === 'daily') {
      if (dashboardData?.monthlyTrend?.daily && dashboardData.monthlyTrend.daily.length > 0) {
        // Show only the latest day's consumption (most recent entry)
        const latestDay = dashboardData.monthlyTrend.daily[0]; // Assuming newest is first
        return latestDay.totalConsumption || 0;
      }
    } else if (timeFilter === 'weekly') {
      if (dashboardData?.monthlyTrend?.weekly && dashboardData.monthlyTrend.weekly.length > 0) {
        // Show only the latest week's consumption (most recent entry)
        const latestWeek = dashboardData.monthlyTrend.weekly[0]; // Assuming newest is first
        return latestWeek.totalConsumption || 0;
      }
    } else if (timeFilter === 'monthly') {
      if (dashboardData?.monthlyTrend?.monthly && dashboardData.monthlyTrend.monthly.length > 0) {
        // Show only the latest month's consumption (most recent entry)
        const latestMonth = dashboardData.monthlyTrend.monthly[0]; // Assuming newest is first
        return latestMonth.totalConsumption || 0;
      }
    } else if (timeFilter === 'all-time') {
      if (dashboardData?.monthlyTrend?.allTimeConsumption) {
        return dashboardData.monthlyTrend.allTimeConsumption || 0;
      }
    }

    // Fallback when no time filter data available
    if (!dashboardData?.dateRangeConsumption?.billerConsumption) return 0;
    return dashboardData.dateRangeConsumption.billerConsumption.reduce((total, biller) => total + biller.totalConsumption, 0);
  };

  const getMostUsedPowers = () => {
    const formattedData = formatMonthlyData();
    if (!formattedData || formattedData.length === 0) return [];

    if (timeFilter === 'all-time') {
      // Use the new allTimeConsumptionChart data for aggregating powers
      const powerMap = {};

      if (dashboardData?.monthlyTrend?.allTimeConsumptionChart) {
        dashboardData.monthlyTrend.allTimeConsumptionChart.forEach(item => {
          if (item.mostUsedPowerTop10) {
            item.mostUsedPowerTop10.forEach(power => {
              if (powerMap[power.power]) {
                powerMap[power.power] += power.count || 0;
              } else {
                powerMap[power.power] = power.count || 0;
              }
            });
          }
        });
      } else {
        // Fallback: Aggregate from daily, weekly, monthly data
        if (dashboardData?.monthlyTrend?.daily) {
          dashboardData.monthlyTrend.daily.forEach(item => {
            if (item.mostUsedPowerTop10) {
              item.mostUsedPowerTop10.forEach(power => {
                if (powerMap[power.power]) {
                  powerMap[power.power] += power.count || 0;
                } else {
                  powerMap[power.power] = power.count || 0;
                }
              });
            }
          });
        }

        // Aggregate from weekly data
        if (dashboardData?.monthlyTrend?.weekly) {
          dashboardData.monthlyTrend.weekly.forEach(item => {
            if (item.mostUsedPowerTop10) {
              item.mostUsedPowerTop10.forEach(power => {
                if (powerMap[power.power]) {
                  powerMap[power.power] += power.count || 0;
                } else {
                  powerMap[power.power] = power.count || 0;
                }
              });
            }
          });
        }

        // Aggregate from monthly data
        if (dashboardData?.monthlyTrend?.monthly) {
          dashboardData.monthlyTrend.monthly.forEach(item => {
            if (item.mostUsedPowerTop10) {
              item.mostUsedPowerTop10.forEach(power => {
                if (powerMap[power.power]) {
                  powerMap[power.power] += power.count || 0;
                } else {
                  powerMap[power.power] = power.count || 0;
                }
              });
            }
          });
        }
      }

      // Convert to array and sort by count
      return Object.entries(powerMap)
        .map(([power, count]) => ({ power, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // For specific time filters, get most used powers from the most recent period
    const latestData = formattedData[formattedData.length - 1];
    if (!latestData?.mostUsedPowers) return [];

    return latestData.mostUsedPowers.slice(0, 10).map(power => ({
      power: power.power,
      count: power.count
    }));
  };

  const getCompanyWiseData = () => {
    if (!dashboardData?.availableStock?.companyWise) return [];
    return dashboardData.availableStock.companyWise.map(company => {
      // Calculate total stock by summing all counts from powerWise arrays across all products
      const totalStock = company.productWise?.reduce((companyTotal, product) => {
        const productTotal = product.powerWise?.reduce((powerTotal, power) => {
          return powerTotal + (power.count || 0);
        }, 0) || 0;
        return companyTotal + productTotal;
      }, 0) || 0;

      return {
        company: company.companyName,
        count: totalStock
      };
    });
  };

  const getProductWiseData = () => {
    if (!dashboardData?.availableStock?.companyWise) return [];
    const productMap = {};

    dashboardData.availableStock.companyWise.forEach(company => {
      company.productWise?.forEach(product => {
        const productTotal = product.powerWise?.reduce((total, power) => {
          return total + (power.count || 0);
        }, 0) || 0;

        if (productMap[product.productName]) {
          productMap[product.productName] += productTotal;
        } else {
          productMap[product.productName] = productTotal;
        }
      });
    });

    return Object.entries(productMap)
      .map(([productName, count]) => ({
        product: productName,
        count: count
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  };

  const getPowerWiseData = () => {
    if (!dashboardData?.availableStock?.companyWise) return [];
    const powerMap = {};

    dashboardData.availableStock.companyWise.forEach(company => {
      company.productWise?.forEach(product => {
        product.powerWise?.forEach(power => {
          if (powerMap[power.power]) {
            powerMap[power.power] += power.count || 0;
          } else {
            powerMap[power.power] = power.count || 0;
          }
        });
      });
    });

    return Object.entries(powerMap)
      .map(([power, count]) => ({
        power: power,
        count: count
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  };

  const getSelectedProductData = () => {
    if (!selectedConsumer || !selectedProduct) return null;
    return availableProducts.find(p => p.power === selectedProduct);
  };

  const getProductPowerDistribution = () => {
    if (!selectedConsumer || !selectedProduct) return [];

    const selectedProductData = getSelectedProductData();
    if (!selectedProductData?.powerWiseConsumption) return [];

    const totalCount = selectedProductData.powerWiseConsumption.reduce((sum, power) => sum + power.count, 0);
    const colors = ['#222', '#444', '#666', '#888', '#aaa', '#ccc', '#ddd'];

    return selectedProductData.powerWiseConsumption.map((powerData, index) => ({
      power: powerData.power,
      consumption: totalCount > 0 ? Math.round((powerData.count / totalCount) * 100 * 100) / 100 : 0,
      color: colors[index % colors.length],
      count: powerData.count
    }));
  };

  const radarData = () => [
    { status: 'Available', value: dashboardData?.availableStock?.totalAvailableStock || 0 },
    { status: 'Sold', value: getTotalSold() },
    { status: 'Low Stock', value: dashboardData?.lowStock?.length || 0 },
    { status: 'Expiring', value: dashboardData?.nearExpire?.count || 0 },
    { status: 'Non-Moving', value: dashboardData?.nonMovingStock?.length || 0 },
  ];

  /* ---------- Shipper Data Formatters ---------- */
  const formatShipperMonthlyData = () => {
    if (!shipperDashboardData?.monthlyTrend) return [];

    // Handle new API structure for shipper dashboard
    let dataToFormat = [];

    switch (timeFilter) {
      case 'daily':
        if (shipperDashboardData.monthlyTrend.daily) {
          dataToFormat = shipperDashboardData.monthlyTrend.daily.map(item => ({
            month: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            consumption: item.totalConsumption,
            fullDate: item.date,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
      case 'weekly':
        if (shipperDashboardData.monthlyTrend.weekly) {
          dataToFormat = shipperDashboardData.monthlyTrend.weekly.map(item => ({
            month: item.week,
            consumption: item.totalConsumption,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
      case 'monthly':
        if (shipperDashboardData.monthlyTrend.monthly) {
          dataToFormat = shipperDashboardData.monthlyTrend.monthly.map(item => ({
            month: `${item.month}/${item.year}`,
            consumption: item.totalConsumption,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
      case 'all-time':
        // For all-time, show monthly aggregated data for better readability
        if (shipperDashboardData.monthlyTrend.monthly) {
          // Create cumulative consumption data
          let cumulativeTotal = 0;
          dataToFormat = shipperDashboardData.monthlyTrend.monthly.map(item => {
            cumulativeTotal += item.totalConsumption;
            return {
              month: `${item.month}/${item.year}`,
              consumption: cumulativeTotal, // Show cumulative total
              originalConsumption: item.totalConsumption, // Keep original for reference
              mostUsedPowers: item.mostUsedPowerTop10,
              type: 'cumulative'
            };
          });
        } else {
          // Fallback: if no monthly data, use daily data but group by month
          const monthlyAggregated = {};

          if (shipperDashboardData.monthlyTrend.daily) {
            shipperDashboardData.monthlyTrend.daily.forEach(item => {
              const date = new Date(item.date);
              const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

              if (!monthlyAggregated[monthYear]) {
                monthlyAggregated[monthYear] = {
                  month: monthYear,
                  consumption: 0,
                  mostUsedPowers: item.mostUsedPowerTop10 || []
                };
              }
              monthlyAggregated[monthYear].consumption += item.totalConsumption;
            });
          }

          // Convert to cumulative array
          let cumulativeTotal = 0;
          dataToFormat = Object.values(monthlyAggregated).map(item => {
            cumulativeTotal += item.consumption;
            return {
              ...item,
              consumption: cumulativeTotal,
              originalConsumption: item.consumption,
              type: 'cumulative'
            };
          });
        }
        break;
      default:
        // Default to monthly view
        if (shipperDashboardData.monthlyTrend.monthly) {
          dataToFormat = shipperDashboardData.monthlyTrend.monthly.map(item => ({
            month: `${item.month}/${item.year}`,
            consumption: item.totalConsumption,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
    }

    return dataToFormat.reverse();
  };

  const formatAdminShipperMonthlyData = () => {
    if (!superAdminShipperDashboard?.monthlyTrend) return [];

    // Handle new API structure for super admin shipper dashboard
    let dataToFormat = [];

    switch (timeFilter) {
      case 'daily':
        if (superAdminShipperDashboard.monthlyTrend.daily) {
          dataToFormat = superAdminShipperDashboard.monthlyTrend.daily.map(item => ({
            month: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            consumption: item.totalConsumption,
            fullDate: item.date,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
      case 'weekly':
        if (superAdminShipperDashboard.monthlyTrend.weekly) {
          dataToFormat = superAdminShipperDashboard.monthlyTrend.weekly.map(item => ({
            month: item.week,
            consumption: item.totalConsumption,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
      case 'monthly':
        if (superAdminShipperDashboard.monthlyTrend.monthly) {
          dataToFormat = superAdminShipperDashboard.monthlyTrend.monthly.map(item => ({
            month: `${item.month}/${item.year}`,
            consumption: item.totalConsumption,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
      case 'all-time':
        // For all-time, show monthly aggregated data for better readability
        if (superAdminShipperDashboard.monthlyTrend.monthly) {
          // Create cumulative consumption data
          let cumulativeTotal = 0;
          dataToFormat = superAdminShipperDashboard.monthlyTrend.monthly.map(item => {
            cumulativeTotal += item.totalConsumption;
            return {
              month: `${item.month}/${item.year}`,
              consumption: cumulativeTotal, // Show cumulative total
              originalConsumption: item.totalConsumption, // Keep original for reference
              mostUsedPowers: item.mostUsedPowerTop10,
              type: 'cumulative'
            };
          });
        } else {
          // Fallback: if no monthly data, use daily data but group by month
          const monthlyAggregated = {};

          if (superAdminShipperDashboard.monthlyTrend.daily) {
            superAdminShipperDashboard.monthlyTrend.daily.forEach(item => {
              const date = new Date(item.date);
              const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

              if (!monthlyAggregated[monthYear]) {
                monthlyAggregated[monthYear] = {
                  month: monthYear,
                  consumption: 0,
                  mostUsedPowers: item.mostUsedPowerTop10 || []
                };
              }
              monthlyAggregated[monthYear].consumption += item.totalConsumption;
            });
          }

          // Convert to cumulative array
          let cumulativeTotal = 0;
          dataToFormat = Object.values(monthlyAggregated).map(item => {
            cumulativeTotal += item.consumption;
            return {
              ...item,
              consumption: cumulativeTotal,
              originalConsumption: item.consumption,
              type: 'cumulative'
            };
          });
        }
        break;
      default:
        // Default to monthly view
        if (superAdminShipperDashboard.monthlyTrend.monthly) {
          dataToFormat = superAdminShipperDashboard.monthlyTrend.monthly.map(item => ({
            month: `${item.month}/${item.year}`,
            consumption: item.totalConsumption,
            mostUsedPowers: item.mostUsedPowerTop10
          }));
        }
        break;
    }

    return dataToFormat.reverse();
  };

  const getShipperTotalSold = () => {
    // For specific time filters, try to get data from the time-based API first
    if (timeFilter === 'daily') {
      if (shipperDashboardData?.monthlyTrend?.daily && shipperDashboardData.monthlyTrend.daily.length > 0) {
        // Show only the latest day's consumption (most recent entry)
        const latestDay = shipperDashboardData.monthlyTrend.daily[0]; // Assuming newest is first
        return latestDay.totalConsumption || 0;
      }
    } else if (timeFilter === 'weekly') {
      if (shipperDashboardData?.monthlyTrend?.weekly && shipperDashboardData.monthlyTrend.weekly.length > 0) {
        // Show only the latest week's consumption (most recent entry)
        const latestWeek = shipperDashboardData.monthlyTrend.weekly[0]; // Assuming newest is first
        return latestWeek.totalConsumption || 0;
      }
    } else if (timeFilter === 'monthly') {
      if (shipperDashboardData?.monthlyTrend?.monthly && shipperDashboardData.monthlyTrend.monthly.length > 0) {
        // Show only the latest month's consumption (most recent entry)
        const latestMonth = shipperDashboardData.monthlyTrend.monthly[0]; // Assuming newest is first
        return latestMonth.totalConsumption || 0;
      }
    } else if (timeFilter === 'all-time') {
      // For "all-time", sum up all consumption from all time periods
      let total = 0;

      // Add all daily consumption
      if (shipperDashboardData?.monthlyTrend?.daily) {
        total += shipperDashboardData.monthlyTrend.daily.reduce((sum, item) => sum + (item.totalConsumption || 0), 0);
      }

      // Add all weekly consumption
      if (shipperDashboardData?.monthlyTrend?.weekly) {
        total += shipperDashboardData.monthlyTrend.weekly.reduce((sum, item) => sum + (item.totalConsumption || 0), 0);
      }

      // Add all monthly consumption
      if (shipperDashboardData?.monthlyTrend?.monthly) {
        total += shipperDashboardData.monthlyTrend.monthly.reduce((sum, item) => sum + (item.totalConsumption || 0), 0);
      }

      // Fallback to original data source if monthlyTrend is not available
      if (total === 0) {
        total = shipperDashboardData?.consumption?.totalConsumption || 0;
      }

      return total;
    }

    // For "all-time" or when no time filter data available, use original data source
    return shipperDashboardData?.consumption?.totalConsumption || 0;
  };

  const getShipperCompanyWiseData = () => {
    if (!shipperDashboardData?.availableStock?.companyWise) return [];
    return shipperDashboardData.availableStock.companyWise.map(company => {
      const totalStock = company.productWise?.reduce((companyTotal, product) => {
        const productTotal = product.powerWise?.reduce((powerTotal, power) => {
          return powerTotal + (power.count || 0);
        }, 0) || 0;
        return companyTotal + productTotal;
      }, 0) || 0;

      return {
        company: company.companyName,
        count: totalStock
      };
    });
  };

  const getAdminShipperProductWiseData = () => {
    if (!superAdminShipperDashboard?.availableStock?.companyWise) return [];
    const productMap = {};

    superAdminShipperDashboard.availableStock.companyWise.forEach(company => {
      company.productWise?.forEach(product => {
        const productTotal = product.powerWise?.reduce((total, power) => {
          return total + (power.count || 0);
        }, 0) || 0;

        if (productMap[product.productName]) {
          productMap[product.productName] += productTotal;
        } else {
          productMap[product.productName] = productTotal;
        }
      });
    });

    return Object.entries(productMap)
      .map(([productName, count]) => ({
        product: productName,
        count: count
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getShipperProductWiseData = () => {
    if (!shipperDashboardData?.availableStock?.companyWise) return [];
    const productMap = {};

    shipperDashboardData.availableStock.companyWise.forEach(company => {
      company.productWise?.forEach(product => {
        const productTotal = product.powerWise?.reduce((total, power) => {
          return total + (power.count || 0);
        }, 0) || 0;

        if (productMap[product.productName]) {
          productMap[product.productName] += productTotal;
        } else {
          productMap[product.productName] = productTotal;
        }
      });
    });

    return Object.entries(productMap)
      .map(([productName, count]) => ({
        product: productName,
        count: count
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getAdminShipperPowerWiseData = () => {
    if (!superAdminShipperDashboard?.availableStock?.companyWise) return [];
    const powerMap = {};

    superAdminShipperDashboard.availableStock.companyWise.forEach(company => {
      company.productWise?.forEach(product => {
        product.powerWise?.forEach(power => {
          if (powerMap[power.power]) {
            powerMap[power.power] += power.count || 0;
          } else {
            powerMap[power.power] = power.count || 0;
          }
        });
      });
    });

    return Object.entries(powerMap)
      .map(([power, count]) => ({
        power: power,
        count: count
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getShipperPowerWiseData = () => {
    if (!shipperDashboardData?.availableStock?.companyWise) return [];
    const powerMap = {};

    shipperDashboardData.availableStock.companyWise.forEach(company => {
      company.productWise?.forEach(product => {
        product.powerWise?.forEach(power => {
          if (powerMap[power.power]) {
            powerMap[power.power] += power.count || 0;
          } else {
            powerMap[power.power] = power.count || 0;
          }
        });
      });
    });

    return Object.entries(powerMap)
      .map(([power, count]) => ({
        power: power,
        count: count
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getShipperMostUsedPowers = () => {
    // Use data from the time-based trend data for most used powers
    const formattedData = formatShipperMonthlyData();
    if (!formattedData || formattedData.length === 0) return [];

    if (timeFilter === 'all-time') {
      // For all-time, aggregate powers from all periods
      const powerMap = {};

      // Aggregate from daily data
      if (shipperDashboardData?.monthlyTrend?.daily) {
        shipperDashboardData.monthlyTrend.daily.forEach(item => {
          if (item.mostUsedPowerTop10) {
            item.mostUsedPowerTop10.forEach(power => {
              if (powerMap[power.power]) {
                powerMap[power.power] += power.count || 0;
              } else {
                powerMap[power.power] = power.count || 0;
              }
            });
          }
        });
      }

      // Aggregate from weekly data
      if (shipperDashboardData?.monthlyTrend?.weekly) {
        shipperDashboardData.monthlyTrend.weekly.forEach(item => {
          if (item.mostUsedPowerTop10) {
            item.mostUsedPowerTop10.forEach(power => {
              if (powerMap[power.power]) {
                powerMap[power.power] += power.count || 0;
              } else {
                powerMap[power.power] = power.count || 0;
              }
            });
          }
        });
      }

      // Aggregate from monthly data
      if (shipperDashboardData?.monthlyTrend?.monthly) {
        shipperDashboardData.monthlyTrend.monthly.forEach(item => {
          if (item.mostUsedPowerTop10) {
            item.mostUsedPowerTop10.forEach(power => {
              if (powerMap[power.power]) {
                powerMap[power.power] += power.count || 0;
              } else {
                powerMap[power.power] = power.count || 0;
              }
            });
          }
        });
      }

      // Convert to array and sort by count
      return Object.entries(powerMap)
        .map(([power, count]) => ({ power, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // Get most used powers from the most recent period
    const latestData = formattedData[formattedData.length - 1];
    if (!latestData?.mostUsedPowers) return [];

    return latestData.mostUsedPowers.slice(0, 10).map(power => ({
      power: power.power,
      count: power.count
    }));
  };

  const getAdminShipperMostUsedPowers = () => {
    // Use data from the time-based trend data for most used powers
    const formattedData = formatAdminShipperMonthlyData();
    if (!formattedData || formattedData.length === 0) return [];

    if (timeFilter === 'all-time') {
      // For all-time, aggregate powers from all periods
      const powerMap = {};

      // Aggregate from daily data
      if (superAdminShipperDashboard?.monthlyTrend?.daily) {
        superAdminShipperDashboard.monthlyTrend.daily.forEach(item => {
          if (item.mostUsedPowerTop10) {
            item.mostUsedPowerTop10.forEach(power => {
              if (powerMap[power.power]) {
                powerMap[power.power] += power.count || 0;
              } else {
                powerMap[power.power] = power.count || 0;
              }
            });
          }
        });
      }

      // Aggregate from weekly data
      if (superAdminShipperDashboard?.monthlyTrend?.weekly) {
        superAdminShipperDashboard.monthlyTrend.weekly.forEach(item => {
          if (item.mostUsedPowerTop10) {
            item.mostUsedPowerTop10.forEach(power => {
              if (powerMap[power.power]) {
                powerMap[power.power] += power.count || 0;
              } else {
                powerMap[power.power] = power.count || 0;
              }
            });
          }
        });
      }

      // Aggregate from monthly data
      if (superAdminShipperDashboard?.monthlyTrend?.monthly) {
        superAdminShipperDashboard.monthlyTrend.monthly.forEach(item => {
          if (item.mostUsedPowerTop10) {
            item.mostUsedPowerTop10.forEach(power => {
              if (powerMap[power.power]) {
                powerMap[power.power] += power.count || 0;
              } else {
                powerMap[power.power] = power.count || 0;
              }
            });
          }
        });
      }

      // Convert to array and sort by count
      return Object.entries(powerMap)
        .map(([power, count]) => ({ power, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // Get most used powers from the most recent period
    const latestData = formattedData[formattedData.length - 1];
    if (!latestData?.mostUsedPowers) return [];

    return latestData.mostUsedPowers.slice(0, 10).map(power => ({
      power: power.power,
      count: power.count
    }));
  };

  const getAdminShipperTotalSold = () => {
    // For specific time filters, try to get data from the time-based API first
    if (timeFilter === 'daily') {
      if (superAdminShipperDashboard?.monthlyTrend?.daily && superAdminShipperDashboard.monthlyTrend.daily.length > 0) {
        // Show only the latest day's consumption (most recent entry)
        const latestDay = superAdminShipperDashboard.monthlyTrend.daily[0]; // Assuming newest is first
        return latestDay.totalConsumption || 0;
      }
    } else if (timeFilter === 'weekly') {
      if (superAdminShipperDashboard?.monthlyTrend?.weekly && superAdminShipperDashboard.monthlyTrend.weekly.length > 0) {
        // Show only the latest week's consumption (most recent entry)
        const latestWeek = superAdminShipperDashboard.monthlyTrend.weekly[0]; // Assuming newest is first
        return latestWeek.totalConsumption || 0;
      }
    } else if (timeFilter === 'monthly') {
      if (superAdminShipperDashboard?.monthlyTrend?.monthly && superAdminShipperDashboard.monthlyTrend.monthly.length > 0) {
        // Show only the latest month's consumption (most recent entry)
        const latestMonth = superAdminShipperDashboard.monthlyTrend.monthly[0]; // Assuming newest is first
        return latestMonth.totalConsumption || 0;
      }
    } else if (timeFilter === 'all-time') {
      // For "all-time", sum up all consumption from all time periods
      let total = 0;

      // Add all daily consumption
      if (superAdminShipperDashboard?.monthlyTrend?.daily) {
        total += superAdminShipperDashboard.monthlyTrend.daily.reduce((sum, item) => sum + (item.totalConsumption || 0), 0);
      }

      // Add all weekly consumption
      if (superAdminShipperDashboard?.monthlyTrend?.weekly) {
        total += superAdminShipperDashboard.monthlyTrend.weekly.reduce((sum, item) => sum + (item.totalConsumption || 0), 0);
      }

      // Add all monthly consumption
      if (superAdminShipperDashboard?.monthlyTrend?.monthly) {
        total += superAdminShipperDashboard.monthlyTrend.monthly.reduce((sum, item) => sum + (item.totalConsumption || 0), 0);
      }

      // Fallback to original data source if monthlyTrend is not available
      if (total === 0) {
        total = superAdminShipperDashboard?.consumption?.totalConsumption || 0;
      }

      return total;
    }

    // For "all-time" or when no time filter data available, use original data source
    return superAdminShipperDashboard?.consumption?.totalConsumption || 0;
  };

  const shipperRadarData = () => [
    { status: 'Available', value: shipperDashboardData?.availableStock?.totalAvailableStock || 0 },
    { status: 'Consumed', value: getShipperTotalSold() },
    { status: 'Products', value: getShipperProductWiseData().length || 0 },
    { status: 'Powers', value: getShipperPowerWiseData().length || 0 },
  ];

  /* ---------- Loading Skeletons ---------- */
  const SkeletonCard = () => (
    <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-8 py-3 min-w-[220px] animate-pulse">
      <div className="h-4 bg-gray-300 rounded mb-2"></div>
      <div className="h-10 bg-gray-300 rounded mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
    </div>
  );

  const SkeletonChart = ({ height = 270 }) => (
    <div className="bg-white rounded-2xl shadow p-6 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="h-5 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-300 rounded w-20"></div>
          <div className="h-8 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
      <div className={`bg-gray-200 rounded-lg`} style={{ height: `${height}px` }}></div>
    </div>
  );

  const SkeletonTable = () => (
    <div className="bg-white rounded-2xl shadow p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
          <div className="h-6 bg-gray-300 rounded w-40"></div>
          <div className="h-6 bg-gray-300 rounded w-16"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-8 bg-gray-300 rounded w-48"></div>
          <div className="h-8 bg-gray-300 rounded w-20"></div>
          <div className="h-8 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-5 h-5 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
              <div className="h-4 bg-gray-300 rounded w-20"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-6 bg-gray-300 rounded w-12"></div>
              <div className="h-6 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SkeletonInventoryCard = () => (
    <div className="bg-white rounded-2xl shadow p-6 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 bg-gray-300 rounded w-32"></div>
        <div className="h-4 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SkeletonConsumptionCard = () => (
    <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 bg-gray-300 rounded w-40"></div>
        <div className="h-8 bg-gray-300 rounded w-48"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="h-4 bg-gray-300 rounded w-32 mb-3"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-300 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="h-4 bg-gray-300 rounded w-32 mb-3"></div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="w-full h-80 bg-gray-200 rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Role-based loading condition
  const isLoading = () => {
    if (!userData?.role) return true; // Still determining user role

    if (userData.role === 'user' || userData.role === 'superAdmin') {
      return !dashboardData; // User role needs dashboardData
    } else if (userData.role === 'shipper') {
      return !shipperDashboardData; // Shipper role needs shipperDashboardData
    }

    return true; // Default to loading for unknown roles
  };

  if (isLoading()) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-5">
        <div className="max-w-7xl mx-auto mt-4 mb-8">
          <nav className="flex items-center gap-2 text-sm animate-pulse">
            <div className="h-8 bg-gray-300 rounded-full w-32"></div>
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <div className="h-8 bg-gray-300 rounded-full w-32"></div>
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <div className="h-8 bg-gray-300 rounded-full w-36"></div>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>

          {/* Main Chart Skeleton */}
          <SkeletonChart />

          {/* Secondary Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl shadow-lg p-8 animate-pulse">
              <div className="text-center mb-4">
                <div className="h-6 bg-gray-300 rounded w-48 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
              </div>
              <div className="w-full h-64 bg-gray-200 rounded-full mx-auto"></div>
            </div>
            <SkeletonChart height={260} />
          </div>

          {/* Company-wise Chart Skeleton */}
          <SkeletonChart height={300} />

          {/* Tables Skeleton */}
          <SkeletonTable />

          {/* Inventory Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonInventoryCard />
            <SkeletonInventoryCard />
          </div>

          {/* Consumption Skeleton */}
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-md px-6 pb-6 animate-pulse">
            <div className="flex items-center justify-between my-5">
              <div className="flex items-center space-x-4">
                <div className="h-8 bg-gray-300 rounded-full w-32"></div>
                <div className="h-8 bg-gray-300 rounded-full w-36"></div>
              </div>
              <div className="h-10 bg-gray-300 rounded w-48"></div>
            </div>
            <SkeletonConsumptionCard />
          </div>
        </div>
      </div>
    );
  }

  const selectedProductData = getSelectedProductData();
  const pieData = getProductPowerDistribution();

  /* ---------- Render Functions ---------- */
  const renderSuperAdminShipperDashboard = () => {
    if (!selectedShipperForSuperAdmin) {
      return (
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
          <Package className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Shipper</h3>
          <p className="text-gray-500 text-center">Choose a shipper from the dropdown to view their dashboard.</p>
        </div>
      );
    }

    if (!superAdminShipperDashboard) {
      return <div className="text-center py-8">Loading shipper dashboard...</div>;
    }

    const selectedShipper = shippersList.find(s => s.shipperId === selectedShipperForSuperAdmin);
    const shipperDisplayName = selectedShipper
      ? `${selectedShipper.shipperName} (${selectedShipper.billerName})`
      : "Selected Shipper";

    return (
      <div className="pt-1">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">Shipper Dashboard: {shipperDisplayName}</h2>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
            <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Available Stock</div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{superAdminShipperDashboard?.availableStock?.totalAvailableStock || 0}</div>
            <div className="text-xs sm:text-sm text-gray-500 mb-1">Current inventory</div>
          </div>

          <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
            <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Total Consumed</div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{getAdminShipperTotalSold()}</div>
            <div className="text-xs sm:text-sm text-gray-500 mb-1">
              {timeFilter === 'daily' ? 'Latest day consumed' :
                timeFilter === 'weekly' ? 'Latest week consumed' :
                  timeFilter === 'monthly' ? 'Latest month consumed' :
                    'All-time consumption'}
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
            <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Products</div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">
              {superAdminShipperDashboard?.availableStock?.companyWise?.reduce((total, company) =>
                total + (company.productWise?.length || 0), 0) || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mb-1">Unique products</div>
          </div>

          <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
            <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Power Variants</div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">
              {superAdminShipperDashboard?.availableStock?.companyWise?.reduce((total, company) =>
                total + (company.productWise?.reduce((sum, product) => sum + (product.powerWise?.length || 0), 0) || 0), 0) || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mb-1">Unique powers</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-1">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <div>
                <h3 className="text-lg text-left font-bold text-gray-900">Consumption Trend</h3>
                <p className="text-sm text-gray-500">
                  {timeFilter === 'daily' ? 'Daily consumption overview' :
                    timeFilter === 'weekly' ? 'Weekly consumption overview' :
                      timeFilter === 'monthly' ? 'Monthly consumption overview' :
                        'All-time consumption overview'}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTimeFilter('daily')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'daily'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeFilter('weekly')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'weekly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeFilter('monthly')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTimeFilter('all-time')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'all-time'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  All Time
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <AreaChart
                data={formatAdminShipperMonthlyData()}
                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="monochromeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#222" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#fff" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                <XAxis
                  dataKey="month"
                  stroke="#bdbdbd"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  angle={timeFilter === 'daily' ? -45 : 0}
                  textAnchor={timeFilter === 'daily' ? 'end' : 'middle'}
                  height={timeFilter === 'daily' ? 60 : 30}
                />
                <YAxis stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 13 }}
                  labelFormatter={(label) => {
                    if (timeFilter === 'daily') return `Date: ${label}`;
                    if (timeFilter === 'weekly') return `Week: ${label}`;
                    if (timeFilter === 'all-time') return `Month: ${label}`;
                    return `Month: ${label}`;
                  }}
                  formatter={(value, name, props) => {
                    if (timeFilter === 'all-time') {
                      return [
                        [`${value} (Cumulative)`, 'Total Consumption'],
                        props.payload?.originalConsumption ? [`${props.payload.originalConsumption} (This Month)`, 'Monthly Consumption'] : null
                      ].filter(Boolean);
                    }
                    return [value, 'Consumption'];
                  }}
                />
                <Area type="monotone" dataKey="consumption" stroke="#222" fill="url(#monochromeGradient)" fillOpacity={1} dot={false} activeDot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Shipper Health Radar</h3>
            <p className="text-sm text-gray-500 mb-4">Current shipper metrics</p>
            <RadarChart cx="50%" cy="50%" outerRadius={110} width={460} height={260} data={[
              { status: 'Available', value: superAdminShipperDashboard?.availableStock?.totalAvailableStock || 0 },
              { status: 'Consumed', value: getAdminShipperTotalSold() },
              { status: 'Products', value: superAdminShipperDashboard?.availableStock?.companyWise?.reduce((total, company) => total + (company.productWise?.length || 0), 0) || 0 },
              {
                status: 'Powers', value: superAdminShipperDashboard?.availableStock?.companyWise?.reduce((total, company) =>
                  total + (company.productWise?.reduce((sum, product) => sum + (product.powerWise?.length || 0), 0) || 0), 0) || 0
              },
            ]}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="status" tick={{ fill: '#222', fontWeight: 700, fontSize: 15 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
              <Radar name="Metrics" dataKey="value" stroke="#222" strokeWidth={2} fill="#222" fillOpacity={0.15} />
              <Tooltip />
            </RadarChart>
          </div>

          <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl shadow-lg p-8 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Most Used Powers</h3>
            <p className="text-sm text-gray-500 mb-4">Top power specifications consumed</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={getAdminShipperMostUsedPowers()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                <XAxis dataKey="power" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 13 }} />
                <Bar dataKey="count" fill="#222" name="Usage Count" radius={[6, 6, 0, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Analysis Accordion */}
        <div className="bg-white rounded-2xl shadow mt-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Available Stock Analysis</h2>
            <p className="text-sm text-gray-500 mt-1">Detailed breakdown by company, product, and power specifications</p>
          </div>

          {/* Product-wise Accordion Item */}
          <div className="border-b border-gray-100 last:border-b-0">
            <button
              onClick={() => toggleAccordion('productWise')}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Product-wise Available Stock</h3>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${accordionState.productWise ? 'rotate-180' : ''}`}
              />
            </button>
            {accordionState.productWise && (
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={Math.max(25 * (getAdminShipperProductWiseData().length || 0), 300)}>
                  <BarChart
                    layout="vertical"
                    data={getAdminShipperProductWiseData()}
                    margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                    barCategoryGap={0}
                    barGap={0}
                  >
                    <defs>
                      <linearGradient id="shipperProductBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#444" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#aaa" stopOpacity={0.25} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ececec" horizontal={false} />
                    <XAxis type="number" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="product" stroke="#222" tick={{ fontSize: 10, fontWeight: 700 }} width={180} axisLine={false} tickLine={false} />
                    <Bar
                      dataKey="count"
                      fill="url(#shipperProductBar)"
                      radius={[0, 12, 12, 0]}
                      barSize={15}
                      name="Available Stock"
                      label={{
                        position: 'right',
                        fill: '#222',
                        fontWeight: 700,
                        fontSize: 12,
                        formatter: (value) => `${value}`,
                        offset: 18,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Power-wise Accordion Item */}
          <div className="border-b border-gray-100 last:border-b-0">
            <button
              onClick={() => toggleAccordion('powerWise')}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Power-wise Available Stock</h3>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${accordionState.powerWise ? 'rotate-180' : ''}`}
              />
            </button>
            {accordionState.powerWise && (
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={Math.max(25 * (getAdminShipperPowerWiseData().length || 0), 300)}>
                  <BarChart
                    layout="vertical"
                    data={getAdminShipperPowerWiseData()}
                    margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                    barCategoryGap={0}
                    barGap={0}
                  >
                    <defs>
                      <linearGradient id="shipperPowerBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#666" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#ccc" stopOpacity={0.25} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ececec" horizontal={false} />
                    <XAxis type="number" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="power" stroke="#222" tick={{ fontSize: 10, fontWeight: 700 }} width={180} axisLine={false} tickLine={false} />
                    <Bar
                      dataKey="count"
                      fill="url(#shipperPowerBar)"
                      radius={[0, 12, 12, 0]}
                      barSize={15}
                      name="Available Stock"
                      label={{
                        position: 'right',
                        fill: '#222',
                        fontWeight: 700,
                        fontSize: 12,
                        formatter: (value) => `${value}`,
                        offset: 18,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Main Render ---------- */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-5 scrollbar-hide">
      <div className="max-w-7xl mx-auto mt-4 mb-8">
        <nav className="flex items-center justify-between text-sm" aria-label="Breadcrumb">
          <div className="flex items-center gap-2">
            {userData?.role === 'shipper' ? (
              <button onClick={() => setActiveTab('shipper')} className={`bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-full px-4 py-1 font-medium hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${activeTab === 'shipper' ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>Shipper Dashboard</button>
            ) : (
              <>
                <button onClick={() => { setActiveTab('overview'); setSelectedShipperForSuperAdmin(null) }} className={`bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-full px-4 py-1 font-medium hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${activeTab === 'overview' ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>Dashboard Overview</button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button onClick={() => { setActiveTab('inventory'); setSelectedShipperForSuperAdmin(null) }} className={`bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-full px-4 py-1 font-medium hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${activeTab === 'inventory' ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>Inventory Status</button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button onClick={() => { setActiveTab('consumption'); setSelectedShipperForSuperAdmin(null) }} className={`bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-full px-4 py-1 font-medium hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${activeTab === 'consumption' ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>Consumption Reports</button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button onClick={() => { setActiveTab('patientConsumption'); setSelectedShipperForSuperAdmin(null) }} className={`bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-full px-4 py-1 font-medium hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${activeTab === 'patientConsumption' ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>Patient Consumption</button>
              </>
            )}
          </div>

          {/* Right side - PDF Download and Role-based items */}
          <div className="flex items-center gap-3">
            {/* PDF Download Button */}
            <MonthlyReportPDF
              dashboardData={dashboardData}
              shipperDashboardData={shipperDashboardData}
              superAdminShipperDashboard={superAdminShipperDashboard}
              userData={userData}
              selectedShipperForSuperAdmin={selectedShipperForSuperAdmin}
              shippersList={shippersList}
              timeFilter={timeFilter}
            />

            {/* CSV Reports Section */}
            {(userData?.role === 'user' || userData?.role === 'superAdmin') && (
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    onClick={() => setShowSaleReportModal(true)}
                    className="bg-black hover:bg-gray-800 text-white p-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    title="Download Sale CSV"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Download Sale CSV
                  </div>
                </div>

                <div className="relative group">
                  <button
                    onClick={() => setShowConsumptionReportModal(true)}
                    className="bg-black hover:bg-gray-800 text-white p-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    title="Download Consumption CSV"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Download Consumption CSV
                  </div>
                </div>
              </div>
            )}            {/* Role-based elements */}
            {userData?.role === 'shipper' && userData?.shippingUnitName && (
              <div className="bg-gray-900 text-white px-4 py-1 rounded-md font-medium text-sm">
                {userData.shippingUnitName}
              </div>
            )}

            {userData?.role === 'superAdmin' && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Select Shipper:</label>
                <select
                  value={selectedShipperForSuperAdmin || ''}
                  onChange={(e => {
                    setSelectedShipperForSuperAdmin(e.target.value || null);
                    setActiveTab('shipadmin');
                  })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gray-500 focus:border-transparent max-w-[180px] "
                >
                  <option value="">-- Select Shipper --</option>
                  {shippersList.map(shipper => (
                    <option key={shipper.shipperId} value={shipper.shipperId}>
                      {shipper.shipperName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Dashboard Overview */}
        {activeTab === 'overview' && userData?.role !== 'shipper' && dashboardData && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-8">
              <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
                <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Total Available Stock</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{dashboardData?.availableStock?.totalAvailableStock || 0}</div>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Current inventory</div>
              </div>

              <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
                <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Total Sold Products</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{getTotalSold()}</div>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">
                  {timeFilter === 'daily' ? 'Latest day sales' :
                    timeFilter === 'weekly' ? 'Latest week sales' :
                      timeFilter === 'monthly' ? 'Latest month sales' :
                        'All-time sales'}
                </div>
              </div>

              {/* NEW: Expiring Soon Card */}
              <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
                <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Expiring Soon</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{dashboardData?.nearExpire?.count || 0}</div>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Items near expiry</div>
              </div>

              <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
                <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Low Stock Alerts</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{dashboardData?.lowStock?.length || 0}</div>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Needs attention</div>
              </div>

              <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
                <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Non-Moving Stock</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{dashboardData?.nonMovingStock?.length || 0}</div>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Requires review</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-1">
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <div>
                    <h3 className="text-lg text-left font-bold text-gray-900">Consumption Trend</h3>
                    <p className="text-sm text-left text-gray-500">
                      {timeFilter === 'daily' ? 'Daily consumption overview' :
                        timeFilter === 'weekly' ? 'Weekly consumption overview' :
                          timeFilter === 'monthly' ? 'Monthly consumption overview' :
                            'All-time consumption overview'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setTimeFilter('daily')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'daily'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setTimeFilter('weekly')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'weekly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setTimeFilter('monthly')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'monthly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setTimeFilter('all-time')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'all-time'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      All Time
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={270}>
                  <AreaChart data={formatMonthlyData()} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monochromeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#222" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#fff" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                    <XAxis
                      dataKey="month"
                      stroke="#bdbdbd"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      angle={timeFilter === 'daily' ? -45 : 0}
                      textAnchor={timeFilter === 'daily' ? 'end' : 'middle'}
                      height={timeFilter === 'daily' ? 60 : 30}
                    />
                    <YAxis stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 13 }}
                      labelFormatter={(label) => {
                        if (timeFilter === 'daily') return `Date: ${label}`;
                        if (timeFilter === 'weekly') return `Week: ${label}`;
                        if (timeFilter === 'all-time') return `Month: ${label}`;
                        return `Month: ${label}`;
                      }}
                      formatter={(value, name, props) => {
                        if (timeFilter === 'all-time') {
                          return [
                            [`${value} (Cumulative)`, 'Total Consumption'],
                            props.payload?.originalConsumption ? [`${props.payload.originalConsumption} (This Month)`, 'Monthly Consumption'] : null
                          ].filter(Boolean);
                        }
                        return [value, 'Consumption'];
                      }}
                    />
                    <Area type="monotone" dataKey="consumption" stroke="#222" fill="url(#monochromeGradient)" fillOpacity={1} dot={false} activeDot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Inventory Health Radar</h3>
                <p className="text-sm text-gray-500 mb-4">Current inventory status metrics</p>
                <RadarChart cx="50%" cy="50%" outerRadius={110} width={460} height={260} data={radarData()}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="status" tick={{ fill: '#222', fontWeight: 700, fontSize: 15 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                  <Radar name="Inventory" dataKey="value" stroke="#222" strokeWidth={2} fill="#222" fillOpacity={0.15} />
                  <Tooltip />
                </RadarChart>
              </div>

              <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl shadow-lg p-8 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Most Used Powers</h3>
                <p className="text-sm text-gray-500 mb-4">Top power specifications consumed</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={getMostUsedPowers()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                    <XAxis dataKey="power" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 13 }} />
                    <Bar dataKey="count" fill="#222" name="Usage Count" radius={[6, 6, 0, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stock Analysis Accordion */}
            <div className="bg-white rounded-2xl shadow mt-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Available Stock Analysis</h2>
                <p className="text-sm text-gray-500 mt-1">Detailed breakdown by company, product, and power specifications</p>
              </div>

              {/* Company-wise Accordion Item */}
              <div className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => toggleAccordion('companyWise')}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Company-wise Available Stock</h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${accordionState.companyWise ? 'rotate-180' : ''}`}
                  />
                </button>
                {accordionState.companyWise && (
                  <div className="px-6 pb-6">
                    <ResponsiveContainer width="100%" height={Math.max(25 * (getCompanyWiseData().length || 0), 300)}>
                      <BarChart
                        layout="vertical"
                        data={getCompanyWiseData()}
                        margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                        barCategoryGap={0}
                        barGap={0}
                      >
                        <defs>
                          <linearGradient id="companyBar" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#333" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#999" stopOpacity={0.25} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ececec" horizontal={false} />
                        <XAxis type="number" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="company" stroke="#222" tick={{ fontSize: 10, fontWeight: 700 }} width={180} axisLine={false} tickLine={false} />
                        <Bar
                          dataKey="count"
                          fill="url(#companyBar)"
                          radius={[0, 12, 12, 0]}
                          barSize={15}
                          name="Available Stock"
                          label={{
                            position: 'right',
                            fill: '#222',
                            fontWeight: 700,
                            fontSize: 12,
                            formatter: (value) => `${value}`,
                            offset: 18,
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Product-wise Accordion Item */}
              <div className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => toggleAccordion('productWise')}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Product-wise Available Stock</h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${accordionState.productWise ? 'rotate-180' : ''}`}
                  />
                </button>
                {accordionState.productWise && (
                  <div className="px-6 pb-6">
                    <ResponsiveContainer width="100%" height={Math.max(25 * (getProductWiseData().length || 0), 300)}>
                      <BarChart
                        layout="vertical"
                        data={getProductWiseData()}
                        margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                        barCategoryGap={0}
                        barGap={0}
                      >
                        <defs>
                          <linearGradient id="productBar" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#444" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#aaa" stopOpacity={0.25} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ececec" horizontal={false} />
                        <XAxis type="number" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="product" stroke="#222" tick={{ fontSize: 10, fontWeight: 700 }} width={180} axisLine={false} tickLine={false} />
                        <Bar
                          dataKey="count"
                          fill="url(#productBar)"
                          radius={[0, 12, 12, 0]}
                          barSize={15}
                          name="Available Stock"
                          label={{
                            position: 'right',
                            fill: '#222',
                            fontWeight: 700,
                            fontSize: 12,
                            formatter: (value) => `${value}`,
                            offset: 18,
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Power-wise Accordion Item */}
              <div className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => toggleAccordion('powerWise')}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Power-wise Available Stock</h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${accordionState.powerWise ? 'rotate-180' : ''}`}
                  />
                </button>
                {accordionState.powerWise && (
                  <div className="px-6 pb-6">
                    <ResponsiveContainer width="100%" height={Math.max(25 * (getPowerWiseData().length || 0), 300)}>
                      <BarChart
                        layout="vertical"
                        data={getPowerWiseData()}
                        margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                        barCategoryGap={0}
                        barGap={0}
                      >
                        <defs>
                          <linearGradient id="powerBar" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#666" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#ccc" stopOpacity={0.25} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ececec" horizontal={false} />
                        <XAxis type="number" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="power" stroke="#222" tick={{ fontSize: 10, fontWeight: 700 }} width={180} axisLine={false} tickLine={false} />
                        <Bar
                          dataKey="count"
                          fill="url(#powerBar)"
                          radius={[0, 12, 12, 0]}
                          barSize={15}
                          name="Available Stock"
                          label={{
                            position: 'right',
                            fill: '#222',
                            fontWeight: 700,
                            fontSize: 12,
                            formatter: (value) => `${value}`,
                            offset: 18,
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'shipadmin' && userData?.role === 'superAdmin' && setSelectedShipperForSuperAdmin && (
          <div>
            {selectedShipperForSuperAdmin
              ? renderSuperAdminShipperDashboard()
              : (
                <div className="pt-8">
                  <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Shipper</h3>
                    <p className="text-gray-500 text-center">Choose a shipper from the dropdown to view their dashboard.</p>
                  </div>
                </div>
              )
            }
          </div>
        )}

        {/* Inventory Status - Only for 'user' role or when userData is null */}
        {activeTab === 'inventory' && userData?.role !== 'shipper' && (
          <>
            {/* Low Stock */}
            <div className="bg-white rounded-2xl shadow p-0 mb-6 overflow-x-auto">
              <div className="px-8 pt-8 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <h3 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h3>
                  <span className="ml-2 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                    {dashboardData?.lowStock?.length || 0} Items
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative max-w-[220px] w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm bg-gray-50"
                    />
                  </div>
                  <button
                    className="flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
                    onClick={() => exportToCSV(paginatedLowStock, lowStockCols, 'low_stock.csv')}
                  >
                    <Download className="w-4 h-4 mr-2" /> Export
                  </button>
                  <div className="relative">
                    <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 transition" onClick={() => setShowLowStockCols(v => !v)}>
                      Columns
                    </button>
                    {showLowStockCols && (
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded shadow z-10">
                        {Object.keys(lowStockCols).map(col => (
                          <label key={col} className="flex items-center px-3 py-1 text-sm">
                            <input type="checkbox" checked={lowStockCols[col]} onChange={() => setLowStockCols(cols => ({ ...cols, [col]: !cols[col] }))} className="mr-2 accent-red-600" />
                            {col.charAt(0).toUpperCase() + col.slice(1)}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                {dashboardData?.lowStock?.length > 0 ? (
                  <div>
                    <table className="w-full text-sm border-separate border-spacing-y-2">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          {lowStockCols.product && <th className="py-3 px-6 text-left font-semibold text-gray-700">Product</th>}
                          {lowStockCols.power && <th className="py-3 px-6 text-left font-semibold text-gray-700">Power</th>}
                          {lowStockCols.company && <th className="py-3 px-6 text-left font-semibold text-gray-700">Company</th>}
                          {lowStockCols.quantity && <th className="py-3 px-6 text-left font-semibold text-gray-700">Current Stock</th>}
                          {lowStockCols.status && <th className="py-3 px-6 text-left font-semibold text-gray-700">Status</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLowStock.map((item, idx) => (
                          <tr key={idx} className="bg-white shadow rounded-lg hover:bg-red-50 transition">
                            {lowStockCols.product && (
                              <td className="py-3 px-6 font-medium text-gray-900 whitespace-nowrap flex items-center gap-2">
                                <Package className="w-5 h-5 text-gray-400" />
                                {item.productName}
                              </td>
                            )}
                            {lowStockCols.power && <td className="py-3 px-6 text-gray-700 whitespace-nowrap">{item.power}</td>}
                            {lowStockCols.company && <td className="py-3 px-6 text-gray-700 whitespace-nowrap">{item.companyName}</td>}
                            {lowStockCols.quantity && (
                              <td className="py-3 px-6 whitespace-nowrap">
                                <span className={`inline-block px-3 py-1 rounded-full font-semibold text-xs ${item.quantity < 5 ? 'bg-red-200 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {item.quantity}
                                </span>
                              </td>
                            )}
                            {lowStockCols.status && (
                              <td className="py-3 px-6 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  <AlertTriangle className="w-4 h-4 mr-1" /> Low Stock
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between items-center gap-2 mt-6 px-6">
                      <span className="text-sm text-gray-600">
                        Showing {paginatedLowStock.length} of {filteredLowStock?.length || 0} low stock items
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setLowStockPage(p => Math.max(1, p - 1))} disabled={lowStockPage === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Prev</button>
                        <span className="text-sm text-gray-700">Page {lowStockPage} of {lowStockTotalPages}</span>
                        <button onClick={() => setLowStockPage(p => Math.min(lowStockTotalPages, p + 1))} disabled={lowStockPage === lowStockTotalPages} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Next</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="bg-gray-100 p-6 rounded-xl max-w-md mx-auto">
                      <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <h4 className="font-medium text-gray-900 text-lg mb-1">All Stock Levels Good</h4>
                      <p className="text-gray-600">No low stock items found in inventory</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Non-Moving & Expiring */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Non-Moving Stock</h3>
                  <div className="text-sm text-gray-500">{dashboardData?.nonMovingStock?.length || 0} items</div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Search..." value={nonMovingSearch} onChange={e => { setNonMovingSearch(e.target.value); setNonMovingPage(1); }} className="border border-gray-300 rounded px-2 py-1 text-sm" />
                    <button onClick={() => setNonMovingSort(s => ({ ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }))} className="px-2 py-1 border rounded text-sm">{nonMovingSort.direction === 'asc' ? '↑' : '↓'}</button>
                  </div>
                </div>
                {paginatedNonMoving && paginatedNonMoving.length > 0 ? (
                  <div className="space-y-4">
                    {paginatedNonMoving.map((item, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <p className="text-sm text-gray-600">{item.power}</p>
                          <p className="text-sm text-gray-600">{item.companyName}</p>
                        </div>
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">Non-Moving</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 p-6 rounded-xl max-w-md mx-auto">
                      <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <h4 className="font-medium text-gray-900 text-lg mb-1">No Non-Moving Stock Found</h4>
                      <p className="text-gray-600">No non-moving stock items match your search.</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-end items-center gap-2 mt-4">
                  <button onClick={() => setNonMovingPage(p => Math.max(1, p - 1))} disabled={nonMovingPage === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Prev</button>
                  <span className="text-sm text-gray-700">Page {nonMovingPage} of {nonMovingTotalPages}</span>
                  <button onClick={() => setNonMovingPage(p => Math.min(nonMovingTotalPages, p + 1))} disabled={nonMovingPage === nonMovingTotalPages} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Next</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Expiring Soon</h3>
                  <div className="text-sm text-gray-500">{dashboardData?.nearExpire?.count || 0} items</div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Search..." value={expSoonSearch} onChange={e => { setExpSoonSearch(e.target.value); setExpSoonPage(1); }} className="border border-gray-300 rounded px-2 py-1 text-sm" />
                    <select value={expSoonSort.key} onChange={e => setExpSoonSort(s => ({ ...s, key: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm">
                      <option value="productName">Product</option>
                      <option value="power">Power</option>
                      <option value="companyName">Company</option>
                      <option value="expiryDate">Expiry Date</option>
                    </select>
                    <button onClick={() => setExpSoonSort(s => ({ ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }))} className="px-2 py-1 border rounded text-sm">{expSoonSort.direction === 'asc' ? '↑' : '↓'}</button>
                  </div>
                </div>
                {paginatedExpSoon && paginatedExpSoon.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData?.nearExpire?.expiringInThreeMonths?.map((item, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <p className="text-sm text-gray-600">Exp: {new Date(item.expiryDate).toLocaleDateString()}</p>
                        </div>
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">Expiring</span>
                      </div>
                    )) || []}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 p-6 rounded-xl max-w-md mx-auto">
                      <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <h4 className="font-medium text-gray-900 text-lg mb-1">No Expiring Items Found</h4>
                      <p className="text-gray-600">No expiring items match your search.</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-end items-center gap-2 mt-4">
                  <button onClick={() => setExpSoonPage(p => Math.max(1, p - 1))} disabled={expSoonPage === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Prev</button>
                  <span className="text-sm text-gray-700">Page {expSoonPage} of {expSoonTotalPages}</span>
                  <button onClick={() => setExpSoonPage(p => Math.min(expSoonTotalPages, p + 1))} disabled={expSoonPage === expSoonTotalPages} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Consumption Reports - Only for 'user' role or when userData is null */}
        {activeTab === 'consumption' && userData?.role !== 'shipper' && (
          <>
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-md px-6 pb-6">
              {/* <h3 className="text-xl font-bold text-gray-900 mb-4">Consumption Reports</h3> */}
              {/* <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-md p-6 mb-6"> */}
              <div className="flex items-center justify-between my-5">
                <div className="flex items-center space-x-4 ">
                  <button onClick={() => { setConsumptionView('biller'); setSelectedConsumer(null); }} className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${consumptionView === 'biller' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Biller-wise Analysis</button>
                  <button onClick={() => { setConsumptionView('shipper'); setSelectedConsumer(null); }} className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${consumptionView === 'shipper' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Shipper-wise Analysis</button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={selectedConsumer || ''}
                      onChange={(e) => setSelectedConsumer(e.target.value || null)}
                      className="w-xl border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-none outline-none focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="">Choose a {consumptionView === 'biller' ? 'biller' : 'shipper'}</option>
                      {sortedConsumers.map((consumer) => (
                        <option key={consumer.consumerId} value={consumer.consumerId}>
                          {consumer.consumerName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* </div> */}

              {/* <div className="grid grid-cols-1 gap-6"> */}
              {/* Select Biller/Shipper Dropdown Section - Moved to Top */}
              {/* <div className="bg-white rounded-xl shadow-md p-6 mb-6"> */}
              {/* <h3 className="text-lg font-semibold text-gray-900 mb-4">{consumptionView === 'biller' ? 'Select Biller' : 'Select Shipper'}</h3> */}

              {/* <select
                  value={selectedConsumer || ''}
                  onChange={(e) => setSelectedConsumer(e.target.value || null)}
                  className="w-xl border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="">Choose a {consumptionView === 'biller' ? 'biller' : 'shipper'}</option>
                  {sortedConsumers.map((consumer) => (
                    <option key={consumer.consumerId} value={consumer.consumerId}>
                      {consumer.consumerName}
                    </option>
                  ))}
                </select> */}
              {/* </div> */}

              {/* Product Sections - Full Width Below Dropdown */}
              {selectedConsumer ? (
                <div className="bg-white rounded-xl shadow-md px-6 py-3 w-full">
                  <div className="flex justify-between items-center mb-4">
                    {selectedProduct && (
                      <button onClick={() => setSelectedProduct(null)} className="flex items-center text-gray-600 hover:text-gray-900 text-sm">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to list
                      </button>
                    )}
                  </div>

                  {selectedProduct ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-lg">{getSelectedProductData()?.productName}</h4>
                            <p className="text-gray-600">{getSelectedProductData()?.companyName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              Units: {pieData.reduce((sum, item) => sum + item.count, 0)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Powers: {pieData.length} variants
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Pie Chart for Power Distribution */}
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-900">Power Distribution</h4>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <ResponsiveContainer width={600} height={260}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="consumption"
                                nameKey="power"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                innerRadius={40}
                                label={({ power, consumption, count }) => `${power}: ${consumption}% (${count})`}
                                style={{ fontSize: '10px' }}
                                stroke="#fff"
                              >
                                {pieData.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.color || "#222"} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Legend */}
                          <div className="flex flex-wrap gap-3 justify-center mt-4">
                            {pieData.map((entry, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded-full" style={{ background: entry.color || "#222" }}></span>
                                <span className="text-xs text-gray-700">{entry.power}</span>
                                <span className="text-xs text-gray-500">{entry.consumption}% ({entry.count})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Side - Consumed Products List */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Product Consumption</h4>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
                          <div className="flex gap-2 mb-2">
                            <select value={productSort.key} onChange={e => setProductSort(s => ({ ...s, key: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-xs">
                              <option value="productName">Product</option>
                              <option value="companyName">Company</option>
                              <option value="count">Units</option>
                              <option value="percentage">Percentage</option>
                            </select>
                            <button onClick={() => setProductSort(s => ({ ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }))} className="px-2 py-1 border rounded text-xs">{productSort.direction === 'asc' ? '↑' : '↓'}</button>
                          </div>
                          {paginatedProducts.length > 0 ? (
                            paginatedProducts.map((product, idx) => (
                              <div key={idx} onClick={() => setSelectedProduct(product.power)} className={`px-3 py-1 rounded-lg border cursor-pointer transition-all ${selectedProduct === product.power ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex justify-between items-center">
                                  <div className="text-left">
                                    <h4 className="font-medium text-xs text-gray-900">{product.productName}</h4>
                                    <p className="text-xs text-gray-600">{product.companyName}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-medium text-gray-900">{product.totalConsumption} units</span>
                                    <div className="text-xs text-gray-500 mt-1">{product.percentage}% of total</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500 text-sm">No products consumed</p>
                            </div>
                          )}
                          <div className="flex justify-end items-center gap-2 mt-4">
                            <button onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1} className="px-2 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 text-xs">Prev</button>
                            <span className="text-xs text-gray-700">Page {productPage} of {productTotalPages}</span>
                            <button onClick={() => setProductPage(p => Math.min(productTotalPages, p + 1))} disabled={productPage === productTotalPages} className="px-2 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 text-xs">Next</button>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Overall Product Distribution */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Product Distribution</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          {availableProducts.length > 0 ? (
                            <div className="flex flex-col items-center">
                              <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                  <Pie
                                    data={availableProducts.map((product, idx) => ({
                                      name: product.productName,
                                      value: product.percentage,
                                      count: product.totalConsumption,
                                      company: product.companyName
                                    }))}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={160}
                                    innerRadius={70}
                                    stroke="#fff"
                                    strokeWidth={2}
                                    label={({ name, value, count }) => `${value.toFixed(1)}% (${count})`}
                                    labelLine={false}
                                    style={{ fontSize: '10px', fontWeight: 'bold' }}
                                  >
                                    {availableProducts.map((entry, index) => {
                                      const grayScale = ['#222', '#333', '#444', '#555', '#666', '#777', '#888', '#999', '#aaa', '#bbb', '#ccc'];
                                      return (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={grayScale[index % grayScale.length]}
                                        />
                                      );
                                    })}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value, name, props) => [
                                      `${props.payload.count} units (${value.toFixed(1)}%)`,
                                      props.payload.company
                                    ]}
                                    labelFormatter={(label) => `Product: ${label}`}
                                    contentStyle={{
                                      backgroundColor: '#fff',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      fontSize: '12px'
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <BarChart3 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500 text-sm">No distribution data available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a {consumptionView === 'biller' ? 'Biller' : 'Shipper'}</h3>
                  <p className="text-gray-500 text-center">Choose a {consumptionView === 'biller' ? 'biller' : 'shipper'} from the dropdown above to view consumed products.</p>
                </div>
              )}
              {/* </div> */}
            </div>
          </>
        )}

        {/* Patient Consumption Tab - Only for non-shipper roles */}
        {activeTab === 'patientConsumption' && userData?.role !== 'shipper' && (
          <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl text-left font-bold text-gray-900">Patient Consumption Reports</h1>
                    <p className="text-gray-600 mt-1">Track and analyze patient consumption data by shipper</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedPatientShipper || ''}
                      onChange={(e) => setSelectedPatientShipper(e.target.value || null)}
                      className="w-80 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-black focus:border-black transition-all duration-200"
                    >
                      <option value="">Select a Shipper</option>
                      {allShippersForPatients.map(shipper => (
                        <option key={shipper.shipperId} value={shipper.shipperId}>
                          {shipper.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              {patientConsumptionLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading patient consumption data...</p>
                  </div>
                </div>
              ) : patientConsumptionData ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Patient Consumption Details</h3>
                      <span className="text-sm text-gray-500">
                        {patientConsumptionData.companyWiseConsumption?.reduce((total, company) =>
                          total + (company.productWiseConsumption?.reduce((prodTotal, product) =>
                            prodTotal + (product.powerWise?.reduce((powTotal, power) =>
                              powTotal + (power.patients?.length || 0), 0) || 0), 0) || 0), 0) || 0} entries
                      </span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">#</th>
                          <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Company Name</th>
                          <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Product</th>
                          <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Serial No</th>
                          <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Billing Date</th>
                          <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Power</th>
                          <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Patient</th>
                          <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Surgery Type</th>
                          <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {patientConsumptionData.companyWiseConsumption?.map((company, companyIndex) =>
                          company.productWiseConsumption?.map((product, productIndex) =>
                            product.powerWise?.map((powerItem, powerIndex) =>
                              powerItem.patients?.map((patient, patientIndex) => {
                                const globalIndex = companyIndex * 1000 + productIndex * 100 + powerIndex * 10 + patientIndex + 1;
                                return (
                                  <tr key={`${companyIndex}-${productIndex}-${powerIndex}-${patientIndex}`} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 border-b border-gray-100">
                                    {/* SL NO */}
                                    <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-xs text-left">
                                      {globalIndex}
                                    </td>
                                    {/* Company Name */}
                                    <td className="px-2 py-1 whitespace-nowrap text-left">
                                      <div className="text-xs font-semibold text-gray-900 max-w-[120px] break-words">
                                        {company.companyName}
                                      </div>
                                    </td>
                                    {/* Product */}
                                    <td className="px-2 py-1 whitespace-nowrap text-left">
                                      <div className="text-xs font-semibold text-gray-900 max-w-[150px] break-words">
                                        {product.productName}
                                      </div>
                                    </td>
                                    {/* Serial No */}
                                    <td className="px-2 py-1 whitespace-nowrap text-left">
                                      <span className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded inline-block">
                                        {patient.serialNo}
                                      </span>
                                    </td>
                                    {/* Billing Date */}
                                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-left">
                                      {patient.billingDate ? new Date(patient.billingDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      }) : 'N/A'}
                                    </td>
                                    {/* Power */}
                                    <td className="px-2 py-1 whitespace-nowrap text-left">
                                      <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-0.5 rounded">
                                        {powerItem.power}
                                      </span>
                                    </td>
                                    {/* Patient */}
                                    <td className="px-2 py-1 text-left">
                                      <div>
                                        <div className="text-xs font-semibold text-gray-900 max-w-[120px] break-words capitalize">{patient.patientName}</div>
                                      </div>
                                    </td>
                                    {/* Surgery Type (patientCategory) */}
                                    <td className="px-2 py-1 text-left">
                                      <div>
                                        <div className="text-xs font-medium text-gray-900">{patient.patientCategory}</div>
                                      </div>
                                    </td>
                                    {/* Action */}
                                    <td className="px-2 py-1 whitespace-nowrap text-left">
                                      <button
                                        onClick={() => {
                                          setSelectedPatient(patient);
                                          setShowPatientModal(true);
                                        }}
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                        title="View Patient Details"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            ).flat()
                          ).flat()
                        ).flat()}
                      </tbody>
                    </table>
                  </div>

                  {(!patientConsumptionData.companyWiseConsumption ||
                    patientConsumptionData.companyWiseConsumption.length === 0) && (
                      <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Patient Data</h3>
                        <p className="mt-1 text-sm text-gray-500">No patient consumption data available for the selected shipper.</p>
                      </div>
                    )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                  <div className="text-center">
                    <Contact2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Shipper</h3>
                    <p className="mt-1 text-sm text-gray-500">Choose a shipper from the dropdown above to view patient consumption data and details.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}        {/* Shipper Dashboard - Only for 'shipper' role */}
        {activeTab === 'shipper' && userData?.role === 'shipper' && (
          <>
            <div className="space-y-6">
              {selectedShipperId && shipperDashboardData ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
                      <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Available Stock</div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{shipperDashboardData?.availableStock?.totalAvailableStock || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mb-1">Current inventory</div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
                      <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Total Consumed</div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{getShipperTotalSold()}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mb-1">
                        {timeFilter === 'daily' ? 'Latest day consumed' :
                          timeFilter === 'weekly' ? 'Latest week consumed' :
                            timeFilter === 'monthly' ? 'Latest month consumed' :
                              'All-time consumption'}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
                      <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Products</div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{getShipperProductWiseData().length || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mb-1">Unique products</div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-white rounded-2xl shadow border border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-3 flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
                      <div className="text-sm sm:text-base text-gray-700 font-semibold mb-2">Power Variants</div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">{getShipperPowerWiseData().length || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mb-1">Unique powers</div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-1">
                    <div className="bg-white rounded-2xl shadow p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                        <div>
                          <h3 className="text-lg text-left font-bold text-gray-900">Consumption Trend</h3>
                          <p className="text-sm text-gray-500">
                            {timeFilter === 'daily' ? 'Daily consumption overview' :
                              timeFilter === 'weekly' ? 'Weekly consumption overview' :
                                timeFilter === 'monthly' ? 'Monthly consumption overview' :
                                  'All-time consumption overview'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setTimeFilter('daily')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'daily'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                              }`}
                          >
                            Daily
                          </button>
                          <button
                            onClick={() => setTimeFilter('weekly')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'weekly'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                              }`}
                          >
                            Weekly
                          </button>
                          <button
                            onClick={() => setTimeFilter('monthly')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'monthly'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                              }`}
                          >
                            Monthly
                          </button>
                          <button
                            onClick={() => setTimeFilter('all-time')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeFilter === 'all-time'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                              }`}
                          >
                            All Time
                          </button>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={270}>
                        <AreaChart data={formatShipperMonthlyData()} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="shipperGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#222" stopOpacity={0.7} />
                              <stop offset="100%" stopColor="#fff" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                          <XAxis
                            dataKey="month"
                            stroke="#bdbdbd"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            angle={timeFilter === 'daily' ? -45 : 0}
                            textAnchor={timeFilter === 'daily' ? 'end' : 'middle'}
                            height={timeFilter === 'daily' ? 60 : 30}
                          />
                          <YAxis stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 13 }}
                            labelFormatter={(label) => {
                              if (timeFilter === 'daily') return `Date: ${label}`;
                              if (timeFilter === 'weekly') return `Week: ${label}`;
                              if (timeFilter === 'all-time') return `Month: ${label}`;
                              return `Month: ${label}`;
                            }}
                            formatter={(value, name, props) => {
                              if (timeFilter === 'all-time') {
                                return [
                                  [`${value} (Cumulative)`, 'Total Consumption'],
                                  props.payload?.originalConsumption ? [`${props.payload.originalConsumption} (This Month)`, 'Monthly Consumption'] : null
                                ].filter(Boolean);
                              }
                              return [value, 'Consumption'];
                            }}
                          />
                          <Area type="monotone" dataKey="consumption" stroke="#222" fill="url(#shipperGradient)" fillOpacity={1} dot={false} activeDot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Shipper Health Radar</h3>
                      <p className="text-sm text-gray-500 mb-4">Current shipper metrics</p>
                      <RadarChart cx="50%" cy="50%" outerRadius={110} width={460} height={260} data={shipperRadarData()}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="status" tick={{ fill: '#222', fontWeight: 700, fontSize: 15 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                        <Radar name="Metrics" dataKey="value" stroke="#222" strokeWidth={2} fill="#222" fillOpacity={0.15} />
                        <Tooltip />
                      </RadarChart>
                    </div>

                    <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl shadow-lg p-8 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Most Used Powers</h3>
                      <p className="text-sm text-gray-500 mb-4">Top power specifications consumed</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={getShipperMostUsedPowers()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                          <XAxis dataKey="power" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 13 }} />
                          <Bar dataKey="count" fill="#222" name="Usage Count" radius={[6, 6, 0, 0]} barSize={15} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Stock Analysis Accordion */}
                  <div className="bg-white rounded-2xl shadow mt-6">
                    <div className="p-6 border-b border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900">Available Stock Analysis</h2>
                      <p className="text-sm text-gray-500 mt-1">Detailed breakdown by company, product, and power specifications</p>
                    </div>

                    {/* Product-wise Accordion Item */}
                    <div className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => toggleAccordion('productWise')}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Product-wise Available Stock</h3>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${accordionState.productWise ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {accordionState.productWise && (
                        <div className="px-6 pb-6">
                          <ResponsiveContainer width="100%" height={Math.max(25 * (getShipperProductWiseData().length || 0), 300)}>
                            <BarChart
                              layout="vertical"
                              data={getShipperProductWiseData()}
                              margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                              barCategoryGap={0}
                              barGap={0}
                            >
                              <defs>
                                <linearGradient id="shipperProductBar" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#444" stopOpacity={0.85} />
                                  <stop offset="100%" stopColor="#aaa" stopOpacity={0.25} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ececec" horizontal={false} />
                              <XAxis type="number" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="product" stroke="#222" tick={{ fontSize: 10, fontWeight: 700 }} width={180} axisLine={false} tickLine={false} />
                              <Bar
                                dataKey="count"
                                fill="url(#shipperProductBar)"
                                radius={[0, 12, 12, 0]}
                                barSize={15}
                                name="Available Stock"
                                label={{
                                  position: 'right',
                                  fill: '#222',
                                  fontWeight: 700,
                                  fontSize: 12,
                                  formatter: (value) => `${value}`,
                                  offset: 18,
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Power-wise Accordion Item */}
                    <div className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => toggleAccordion('powerWise')}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Power-wise Available Stock</h3>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${accordionState.powerWise ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {accordionState.powerWise && (
                        <div className="px-6 pb-6">
                          <ResponsiveContainer width="100%" height={Math.max(25 * (getShipperPowerWiseData().length || 0), 300)}>
                            <BarChart
                              layout="vertical"
                              data={getShipperPowerWiseData()}
                              margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                              barCategoryGap={0}
                              barGap={0}
                            >
                              <defs>
                                <linearGradient id="shipperPowerBar" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#666" stopOpacity={0.85} />
                                  <stop offset="100%" stopColor="#ccc" stopOpacity={0.25} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ececec" horizontal={false} />
                              <XAxis type="number" stroke="#bdbdbd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="power" stroke="#222" tick={{ fontSize: 10, fontWeight: 700 }} width={180} axisLine={false} tickLine={false} />
                              <Bar
                                dataKey="count"
                                fill="url(#shipperPowerBar)"
                                radius={[0, 12, 12, 0]}
                                barSize={15}
                                name="Available Stock"
                                label={{
                                  position: 'right',
                                  fill: '#222',
                                  fontWeight: 700,
                                  fontSize: 12,
                                  formatter: (value) => `${value}`,
                                  offset: 18,
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400 mb-4" />
                  {userData?.role === 'shipper' ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Dashboard</h3>
                      <p className="text-gray-500 text-center">Loading your dashboard data...</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Shipper</h3>
                      <p className="text-gray-500 text-center">Choose a shipper from the dropdown above to view their dashboard.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Fallback for unauthorized access or missing user data */}
        {!userData && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Authentication Required</h3>
            <p className="text-gray-500 text-center">Please log in to access the dashboard.</p>
          </div>
        )}

        {/* Fallback for unrecognized roles */}
        {userData && !['user', 'shipper', 'superAdmin'].includes(userData.role) && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Denied</h3>
            <p className="text-gray-500 text-center">Your role ({userData.role}) does not have access to this dashboard.</p>
          </div>
        )}

        {/* Patient Details Modal */}
        {showPatientModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl border border-gray-300">
              {/* Compact Modal Header */}
              <div className="bg-black p-3 rounded-t-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-100 rounded-lg flex items-center justify-center shadow-lg">
                      <Contact2 className="w-4 h-4 text-gray-800" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-white">
                        Patient Details : <span className="font-bold text-green-400 capitalize">{selectedPatient.patientName}</span>
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPatientModal(false);
                      setSelectedPatient(null);
                    }}
                    className="p-1.5 hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4 text-gray-300 group-hover:text-white" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
                {/* Patient Information - Ultra Compact Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                  {/* Patient Information */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                        <Contact2 className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Patient Information</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Patient Name</label>
                        <p className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.patientName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">UHID</label>
                          <p className="text-xs font-mono text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.patientUhid}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Gender</label>
                          <p className="text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.patientGender}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Patient Type</label>
                          <p className="text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.patientType}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Patient Category</label>
                          <p className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.patientCategory}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                        <FileText className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Medical Information</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">OPD ID</label>
                          <p className="text-xs font-mono text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.opdId || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">IPD ID</label>
                          <p className="text-xs font-mono text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.ipdId || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Surgeon Name</label>
                        <p className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">Dr. {selectedPatient.surgeonName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">OT Date</label>
                          <p className="text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">
                            {selectedPatient.otDate ? new Date(selectedPatient.otDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Billing Date</label>
                          <p className="text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">
                            {selectedPatient.billingDate ? new Date(selectedPatient.billingDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance & Product Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                  {/* Insurance Information */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                        <Building2 className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Insurance & Billing</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Insurance Company</label>
                        <p className="text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.insuranceCompany || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Package Amount</label>
                        <p className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.packageAmount || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                        <Package className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Product Information</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Serial Number</label>
                        <p className="text-xs font-mono font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">{selectedPatient.serialNo}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ultra Compact Notice */}
                <div className="mb-4 p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded border-l-4 border-gray-500 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-800">Patient Information</p>
                      <p className="text-[10px] text-gray-700">
                        Complete patient details including medical and billing information.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compact Modal Footer */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-300">
                  <button
                    onClick={() => {
                      setShowPatientModal(false);
                      setSelectedPatient(null);
                    }}
                    className="px-4 py-1.5 rounded font-semibold transition-all duration-200 flex items-center space-x-1 text-xs shadow-sm hover:shadow-lg bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-700 border border-gray-600"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Close</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sale Report Modal - Professional Monochrome Design */}
        {showSaleReportModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-200/80 backdrop-blur-lg">
              {/* Professional Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-black to-gray-800 bg-clip-text text-transparent">
                    Sale Report
                  </h3>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-gray-600 via-black to-gray-500 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Configure report parameters</p>
                </div>
                <button
                  onClick={() => {
                    setShowSaleReportModal(false);
                    setSelectedBillerForReport('');
                    setSelectedShipperForReport('');
                    setReportDateFilter('monthly');
                    setReportFromDate('');
                    setReportToDate('');
                  }}
                  className="bg-gradient-to-br from-gray-100 via-white to-gray-200 hover:from-gray-200 hover:via-gray-100 hover:to-gray-300 text-gray-700 hover:text-black p-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-300/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Professional Form Container */}
              <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-xl p-5 border-2 border-gray-200/60 shadow-inner space-y-5">
                {/* Date Filter Type Selection */}
                <div>
                  <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Filter Type</label>
                  <select
                    value={reportDateFilter}
                    onChange={(e) => setReportDateFilter(e.target.value)}
                    className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <option value="monthly">Monthly Filter</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {/* Conditional Date Selection */}
                {reportDateFilter === 'monthly' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Year</label>
                      <select
                        value={reportYear}
                        onChange={(e) => setReportYear(parseInt(e.target.value))}
                        className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {getAvailableMonthsYears().years.length > 0 ? (
                          getAvailableMonthsYears().years.map(year => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))
                        ) : (
                          <option value="">No data available</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Month</label>
                      <select
                        value={reportMonth}
                        onChange={(e) => setReportMonth(parseInt(e.target.value))}
                        className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                        disabled={!reportYear}
                      >
                        {reportYear ? (
                          getAvailableMonthsForYear(reportYear).length > 0 ? (
                            getAvailableMonthsForYear(reportYear).map(month => (
                              <option key={month} value={month}>
                                {getMonthName(month)}
                              </option>
                            ))
                          ) : (
                            <option value="">No data for this year</option>
                          )
                        ) : (
                          <option value="">Select year first</option>
                        )}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">From Date</label>
                      <input
                        type="date"
                        value={reportFromDate}
                        onChange={(e) => setReportFromDate(e.target.value)}
                        className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">To Date</label>
                      <input
                        type="date"
                        value={reportToDate}
                        onChange={(e) => setReportToDate(e.target.value)}
                        className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                      />
                    </div>
                  </div>
                )}

                {/* Biller Selection */}
                <div>
                  <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Biller</label>
                  <select
                    value={selectedBillerForReport}
                    onChange={(e) => {
                      setSelectedBillerForReport(e.target.value);
                      setSelectedShipperForReport('');
                    }}
                    className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <option value="">-- Select Biller --</option>
                    {availableBillers.map(biller => (
                      <option key={biller.id} value={biller.id}>
                        {biller.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shipper Selection */}
                {selectedBillerForReport && (
                  <div>
                    <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Shipper (Optional)</label>
                    <select
                      value={selectedShipperForReport}
                      onChange={(e) => setSelectedShipperForReport(e.target.value)}
                      className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <option value="">-- All Shippers --</option>
                      {availableShippersForBiller.map(shipper => (
                        <option key={shipper.id} value={shipper.id}>
                          {shipper.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Professional Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaleReportModal(false);
                    setSelectedBillerForReport('');
                    setSelectedShipperForReport('');
                  }}
                  className="bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 hover:from-gray-300 hover:via-gray-200 hover:to-gray-400 text-gray-700 hover:text-black px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-400/50 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={generateSaleReportCSV}
                  disabled={!selectedBillerForReport || isGeneratingReport}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border flex items-center gap-3 ${!selectedBillerForReport || isGeneratingReport
                    ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-gray-300 cursor-not-allowed border-gray-500/30'
                    : 'bg-black text-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-black hover:to-gray-800 border-gray-700/30'
                    }`}
                >
                  <div className="bg-gradient-to-br from-white/20 to-gray-300/20 p-1.5 rounded-lg shadow-inner">
                    <Download className="w-4 h-4" />
                  </div>
                  {isGeneratingReport ? 'Generating...' : 'Download Report'}
                </button>
              </div>

              {/* Professional Footer */}
              <div className="mt-5 pt-4 border-t-2 border-gray-300/60">
                <div className="text-center text-xs">
                  <span className="bg-gradient-to-r from-gray-600 via-black to-gray-700 bg-clip-text text-transparent font-bold tracking-wide">
                    BUSINESS INTELLIGENCE • SALE REPORTS
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consumption Report Modal - Professional Monochrome Design */}
        {showConsumptionReportModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-200/80 backdrop-blur-lg">
              {/* Professional Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-black to-gray-800 bg-clip-text text-transparent">
                    Consumption Report
                  </h3>
                  <div className="w-20 h-0.5 bg-gradient-to-r from-gray-600 via-black to-gray-500 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Configure report parameters</p>
                </div>
                <button
                  onClick={() => {
                    setShowConsumptionReportModal(false);
                    setSelectedBillerForReport('');
                    setSelectedShipperForReport('');
                    setReportDateFilter('monthly');
                    setReportFromDate('');
                    setReportToDate('');
                  }}
                  className="bg-gradient-to-br from-gray-100 via-white to-gray-200 hover:from-gray-200 hover:via-gray-100 hover:to-gray-300 text-gray-700 hover:text-black p-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-300/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Professional Form Container */}
              <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-xl p-5 border-2 border-gray-200/60 shadow-inner space-y-5">
                {/* Date Filter Type Selection */}
                <div>
                  <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Filter Type</label>
                  <select
                    value={reportDateFilter}
                    onChange={(e) => setReportDateFilter(e.target.value)}
                    className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <option value="monthly">Monthly Filter</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {/* Conditional Date Selection */}
                {reportDateFilter === 'monthly' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Year</label>
                      <select
                        value={reportYear}
                        onChange={(e) => setReportYear(parseInt(e.target.value))}
                        className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {getAvailableMonthsYears().years.length > 0 ? (
                          getAvailableMonthsYears().years.map(year => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))
                        ) : (
                          <option value="">No data available</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Month</label>
                      <select
                        value={reportMonth}
                        onChange={(e) => setReportMonth(parseInt(e.target.value))}
                        className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                        disabled={!reportYear}
                      >
                        {reportYear ? (
                          getAvailableMonthsForYear(reportYear).length > 0 ? (
                            getAvailableMonthsForYear(reportYear).map(month => (
                              <option key={month} value={month}>
                                {getMonthName(month)}
                              </option>
                            ))
                          ) : (
                            <option value="">No data for this year</option>
                          )
                        ) : (
                          <option value="">Select year first</option>
                        )}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">From Date</label>
                      <input
                        type="date"
                        value={reportFromDate}
                        onChange={(e) => setReportFromDate(e.target.value)}
                        className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">To Date</label>
                      <input
                        type="date"
                        value={reportToDate}
                        onChange={(e) => setReportToDate(e.target.value)}
                        className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                      />
                    </div>
                  </div>
                )}

                {/* Biller Selection */}
                <div>
                  <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Biller</label>
                  <select
                    value={selectedBillerForReport}
                    onChange={(e) => {
                      setSelectedBillerForReport(e.target.value);
                      setSelectedShipperForReport('');
                    }}
                    className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <option value="">-- Select Biller --</option>
                    {availableBillers.map(biller => (
                      <option key={biller.id} value={biller.id}>
                        {biller.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shipper Selection */}
                {selectedBillerForReport && (
                  <div>
                    <label className="block text-sm font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent mb-2">Shipper (Optional)</label>
                    <select
                      value={selectedShipperForReport}
                      onChange={(e) => setSelectedShipperForReport(e.target.value)}
                      className="w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300/60 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-300/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <option value="">-- All Shippers --</option>
                      {availableShippersForBiller.map(shipper => (
                        <option key={shipper.id} value={shipper.id}>
                          {shipper.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Professional Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowConsumptionReportModal(false);
                    setSelectedBillerForReport('');
                    setSelectedShipperForReport('');
                  }}
                  className="bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 hover:from-gray-300 hover:via-gray-200 hover:to-gray-400 text-gray-700 hover:text-black px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-400/50 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={generateConsumptionReportCSV}
                  disabled={!selectedBillerForReport || isGeneratingReport}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border flex items-center gap-3 ${!selectedBillerForReport || isGeneratingReport
                    ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-gray-300 cursor-not-allowed border-gray-500/30'
                    : 'bg-black text-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-black hover:to-gray-800 border-gray-700/30'
                    }`}
                >
                  <div className="bg-gradient-to-br from-white/20 to-gray-300/20 p-1.5 rounded-lg shadow-inner">
                    <Download className="w-4 h-4" />
                  </div>
                  {isGeneratingReport ? 'Generating...' : 'Download Report'}
                </button>
              </div>

              {/* Professional Footer */}
              <div className="mt-5 pt-4 border-t-2 border-gray-300/60">
                <div className="text-center text-xs">
                  <span className="bg-gradient-to-r from-gray-600 via-black to-gray-700 bg-clip-text text-transparent font-bold tracking-wide">
                    BUSINESS INTELLIGENCE • CONSUMPTION REPORTS
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Snackbar */}
      {snackbar.show && (
        <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
          <div className={`
            rounded-2xl shadow-2xl border-2 p-4 min-w-[320px] max-w-[480px]
            ${snackbar.type === 'error' ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' :
              snackbar.type === 'success' ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' :
                snackbar.type === 'warning' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' :
                  'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
            }
          `}>
            <div className="flex items-start gap-3">
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                ${snackbar.type === 'error' ? 'bg-red-500' :
                  snackbar.type === 'success' ? 'bg-green-500' :
                    snackbar.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                }
              `}>
                {snackbar.type === 'error' && <X className="w-4 h-4 text-white" />}
                {snackbar.type === 'success' && <CheckCircle className="w-4 h-4 text-white" />}
                {snackbar.type === 'warning' && <AlertTriangle className="w-4 h-4 text-white" />}
                {snackbar.type === 'info' && <AlertCircle className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1">
                <p className={`
                  text-sm font-medium
                  ${snackbar.type === 'error' ? 'text-red-800' :
                    snackbar.type === 'success' ? 'text-green-800' :
                      snackbar.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                  }
                `}>
                  {snackbar.type === 'error' ? 'Error' :
                    snackbar.type === 'success' ? 'Success' :
                      snackbar.type === 'warning' ? 'Warning' :
                        'Information'
                  }
                </p>
                <p className={`
                  text-sm mt-1 leading-relaxed
                  ${snackbar.type === 'error' ? 'text-red-700' :
                    snackbar.type === 'success' ? 'text-green-700' :
                      snackbar.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                  }
                `}>
                  {snackbar.message}
                </p>
              </div>
              <button
                onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}
                className={`
                  flex-shrink-0 p-1 rounded-full transition-colors duration-200
                  ${snackbar.type === 'error' ? 'text-red-500 hover:bg-red-200' :
                    snackbar.type === 'success' ? 'text-green-500 hover:bg-green-200' :
                      snackbar.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-200' :
                        'text-blue-500 hover:bg-blue-200'
                  }
                `}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className={`
              mt-3 h-1 rounded-full overflow-hidden
              ${snackbar.type === 'error' ? 'bg-red-200' :
                snackbar.type === 'success' ? 'bg-green-200' :
                  snackbar.type === 'warning' ? 'bg-yellow-200' :
                    'bg-blue-200'
              }
            `}>
              <div
                className={`
                  h-full rounded-full transition-all duration-[4000ms] ease-linear
                  ${snackbar.type === 'error' ? 'bg-red-500' :
                    snackbar.type === 'success' ? 'bg-green-500' :
                      snackbar.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                  }
                `}
                style={{
                  width: snackbar.show ? '0%' : '100%',
                  transition: 'width 4000ms ease-linear'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDashBoard;
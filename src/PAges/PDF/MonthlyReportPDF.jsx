import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from './Pictures/logo.png'; // Adjust the path as necessary

const MonthlyReportPDF = ({
    dashboardData,
    shipperDashboardData,
    superAdminShipperDashboard,
    userData,
    selectedShipperForSuperAdmin,
    shippersList,
    timeFilter
}) => {
    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedYear, setSelectedYear] = useState(() => {
        const currentYear = new Date().getFullYear();
        return currentYear;
    });

    // Extract available months from data
    const getAvailableMonths = () => {
        let dataSource = null;

        if (userData?.role === 'shipper' && shipperDashboardData) {
            dataSource = shipperDashboardData;
        } else if (userData?.role === 'superAdmin' && selectedShipperForSuperAdmin && superAdminShipperDashboard) {
            dataSource = superAdminShipperDashboard;
        } else if (dashboardData) {
            dataSource = dashboardData;
        }

        if (!dataSource?.monthlyTrend?.monthly) return [];

        return dataSource.monthlyTrend.monthly.map(item => ({
            month: item.month,
            year: item.year,
            display: `${getMonthName(item.month)} ${item.year}`,
            value: `${item.month}-${item.year}`
        }));
    };

    const getMonthName = (monthNum) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[monthNum - 1] || 'Unknown';
    };

    const handleDownloadClick = () => {
        const months = getAvailableMonths();
        if (months.length > 0) {
            setAvailableMonths(months);
            // Set the selected year based on available months
            const years = [...new Set(months.map(m => m.year))].sort((a, b) => b - a);
            if (years.length > 0) {
                setSelectedYear(years[0]);
            }
            setShowMonthSelector(true);
        } else {
            generateMonthlyReportPDF();
        }
    };

    const handleMonthSelect = (selectedMonth) => {
        setShowMonthSelector(false);
        generateMonthlyReportPDF(selectedMonth);
    };

    const generateMonthlyReportPDF = (selectedMonth = null) => {
        try {
            console.log('Comprehensive PDF generation started...');

            const doc = new jsPDF('portrait', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);

            let currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            let reportPeriod = 'All Time';
            if (selectedMonth) {
                const [month, year] = selectedMonth.split('-');
                reportPeriod = `${getMonthName(parseInt(month))} ${year}`;
                currentDate = `${getMonthName(parseInt(month))} ${year} Report`;
            }

            // Determine data source based on user role
            let dataSource = null;
            let reportTitle = '';

            if (userData?.role === 'shipper' && shipperDashboardData) {
                dataSource = shipperDashboardData;
                reportTitle = `${userData.shippingUnitName || 'Shipper Dashboard'}`;
            } else if (userData?.role === 'superAdmin' && selectedShipperForSuperAdmin && superAdminShipperDashboard) {
                dataSource = superAdminShipperDashboard;
                const selectedShipper = shippersList.find(s => s.shipperId === selectedShipperForSuperAdmin);
                reportTitle = `${selectedShipper?.shipperName || 'Selected Shipper'}`;
            } else if (dashboardData) {
                dataSource = dashboardData;
                reportTitle = 'MONTHLY PERFORMANCE REPORT';
            }

            // PROFESSIONAL HEADER WITH INTEGRATED REPORT INFO
            // Expanded Header Box to accommodate logo, title, and report information
            doc.setFillColor(250, 250, 250);
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, 10, contentWidth, 48, 'FD');

            // Add Company Logo - Bigger and more prominent
            try {
                const logoWidth = 55;   // Increased from 40
                const logoHeight = 28;  // Increased from 20
                const logoX = margin + 2;  // Reduced margin from 8 to 2
                const logoY = 11;  // Moved up from 15 to 11 to stay within header bounds
                doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
            } catch (error) {
                console.warn('Logo could not be loaded:', error);
            }

            // Main Title - Adjusted positioning for bigger logo
            doc.setFontSize(15);  // Slightly smaller to accommodate larger logo
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            const titleText = reportTitle.length > 50 ? reportTitle.substring(0, 47) + '...' : reportTitle;
            const titleStartX = margin + 62;  // Adjusted for larger logo (55 + 7 spacing)
            const availableWidth = pageWidth - titleStartX - margin;
            const titleWidth = doc.getTextWidth(titleText);

            // Center title in the available space after logo
            const titleX = titleStartX + (availableWidth - titleWidth) / 2;
            doc.text(titleText, titleX, 22);  // Positioned higher in expanded header

            // Subtitle - Aligned with title
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "normal");
            const subtitleText = `${reportPeriod} - Overall Data Analytics`;
            const subtitleWidth = doc.getTextWidth(subtitleText);
            const subtitleX = titleStartX + (availableWidth - subtitleWidth) / 2;
            doc.text(subtitleText, subtitleX, 30);  // Positioned lower in expanded header

            // Horizontal line separator within header (with top margin)
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.5);
            doc.line(margin + 5, 37, pageWidth - margin - 5, 37);

            // Enhanced Report Information within Header - Professional Layout
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.setFont("helvetica", "bold");

            // Left Column - Labels with improved spacing
            doc.text('Generated:', margin + 8, 44);
            doc.text('Period:', margin + 8, 49);
            doc.text('Role:', margin + 8, 54);

            // Right Column - Values with professional alignment
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 40);
            doc.text(new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }), margin + 35, 44);
            doc.text(reportPeriod, margin + 35, 49);
            doc.text((userData?.role || 'Unknown').charAt(0).toUpperCase() + (userData?.role || 'Unknown').slice(1), margin + 35, 54);

            // Professional Separator after integrated header
            // doc.setDrawColor(0, 0, 0);
            // doc.setLineWidth(0.8);
            // doc.line(margin, 65, pageWidth - margin, 65);
            // doc.setDrawColor(200, 200, 200);
            // doc.setLineWidth(0.3);
            // doc.line(margin, 66, pageWidth - margin, 66);

            let yPosition = 65;  // Adjusted starting position for content after integrated header

            if (!dataSource) {
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                const noDataX = (pageWidth - doc.getTextWidth('⚠ No Data Available')) / 2;
                doc.text('⚠ No Data Available', noDataX, yPosition);

                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.setFont("helvetica", "normal");
                const messageX = (pageWidth - doc.getTextWidth('Unable to generate report - no data source found')) / 2;
                doc.text('Unable to generate report - no data source found', messageX, yPosition + 15);

                doc.save(`No_Data_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                return;
            }

            // ===========================================
            // EXECUTIVE SUMMARY - PROFESSIONAL LAYOUT
            // ===========================================
            // Section Header with Full Width
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text('EXECUTIVE SUMMARY', margin, yPosition + 7);
            yPosition += 12;

            const summaryData = [];

            if (dataSource.availableStock?.totalAvailableStock) {
                summaryData.push(['Total Available Stock', dataSource.availableStock.totalAvailableStock.toLocaleString()]);
            }

            if (dataSource.monthlyTrend?.monthly && dataSource.monthlyTrend.monthly.length > 0) {
                const currentMonthData = dataSource.monthlyTrend.monthly[0];
                const totalMonthlyConsumption = currentMonthData.totalConsumption || 0;
                summaryData.push(['Current Month Consumption', totalMonthlyConsumption.toLocaleString()]);

                if (dataSource.monthlyTrend.monthly.length > 1) {
                    const previousMonthData = dataSource.monthlyTrend.monthly[1];
                    const growthRate = previousMonthData.totalConsumption > 0
                        ? (((totalMonthlyConsumption - previousMonthData.totalConsumption) / previousMonthData.totalConsumption) * 100).toFixed(1)
                        : 'N/A';
                    summaryData.push(['Month-over-Month Growth', `${growthRate}%`]);
                }
            }

            if (dataSource.consumption?.totalConsumption) {
                summaryData.push(['Total Historical Consumption', dataSource.consumption.totalConsumption.toLocaleString()]);
            }

            if (dashboardData?.lowStock) {
                summaryData.push(['Low Stock Alerts', dashboardData.lowStock.length.toString()]);
            }

            if (dashboardData?.nearExpire?.count) {
                summaryData.push(['Near Expiry Items', dashboardData.nearExpire.count.toString()]);
            }

            if (dashboardData?.nonMovingStock) {
                summaryData.push(['Non-Moving Stock Items', dashboardData.nonMovingStock.length.toString()]);
            }

            // Available companies count
            if (dataSource.availableStock?.companyWise) {
                summaryData.push(['Active Companies', dataSource.availableStock.companyWise.length.toString()]);
            }

            if (summaryData.length > 0) {
                autoTable(doc, {
                    startY: yPosition,
                    head: [['Key Performance Indicators', 'Current Values']],
                    body: summaryData,
                    theme: 'plain',
                    styles: {
                        fontSize: 9,
                        cellPadding: 3,
                        lineWidth: 0.1,
                        lineColor: [200, 200, 200]
                    },
                    headStyles: {
                        fillColor: [0, 0, 0],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold',
                        halign: 'center',
                        cellPadding: 4
                    },
                    bodyStyles: {
                        textColor: [40, 40, 40],
                        cellPadding: 3
                    },
                    alternateRowStyles: {
                        fillColor: [248, 248, 248]
                    },
                    columnStyles: {
                        0: {
                            fontStyle: 'bold',
                            halign: 'center',
                            textColor: [20, 20, 20]
                        },
                        1: {
                            halign: 'center',
                            fontStyle: 'bold',
                            textColor: [60, 60, 60]
                        }
                    },
                    tableWidth: 'auto',
                    margin: { left: margin, right: margin }
                });
                yPosition = doc.lastAutoTable.finalY + 10;
            }

            // ===========================================
            // MONTHLY CONSUMPTION TREND - CORPORATE STYLING
            // ===========================================
            if (dataSource.monthlyTrend?.monthly && dataSource.monthlyTrend.monthly.length > 0) {
                if (yPosition > 200) {
                    doc.addPage();
                    yPosition = 25;
                }

                // Professional Section Header
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                doc.text('MONTHLY CONSUMPTION ANALYSIS', margin, yPosition + 7);
                yPosition += 12;

                // Filter data by selected month if specified
                let monthlyData = dataSource.monthlyTrend.monthly;
                if (selectedMonth) {
                    const [selectedMonthNum, selectedYear] = selectedMonth.split('-');
                    monthlyData = monthlyData.filter(item =>
                        item.month == selectedMonthNum && item.year == selectedYear
                    );
                }

                const trendData = monthlyData
                    .slice(0, 12)
                    .map((item, index) => {
                        const monthYear = `${getMonthName(item.month)} ${item.year}`;
                        const consumption = item.totalConsumption || 0;
                        const topPower = item.mostUsedPowerTop10?.[0]?.power || 'N/A';
                        const topPowerCount = item.mostUsedPowerTop10?.[0]?.count || 0;

                        let trend = 'Stable';
                        if (index < monthlyData.length - 1) {
                            const nextMonth = monthlyData[index + 1];
                            if (consumption > nextMonth.totalConsumption) trend = 'Growth';
                            else if (consumption < nextMonth.totalConsumption) trend = 'Decline';
                        }

                        return [
                            monthYear,
                            consumption.toLocaleString(),
                            `${topPower} (${topPowerCount})`,
                            trend
                        ];
                    });

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Period', 'Total Consumption', 'Top Power (Qty)', 'Trend']],
                    body: trendData,
                    theme: 'plain',
                    styles: {
                        fontSize: 8,
                        cellPadding: 3,
                        lineWidth: 0.1,
                        lineColor: [180, 180, 180]
                    },
                    headStyles: {
                        fillColor: [0, 0, 0],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'center',
                        cellPadding: 4
                    },
                    bodyStyles: {
                        textColor: [50, 50, 50],
                        cellPadding: 3
                    },
                    alternateRowStyles: {
                        fillColor: [250, 250, 250]
                    },
                    columnStyles: {
                        0: { halign: 'center', fontStyle: 'bold' },
                        1: { halign: 'center', textColor: [30, 30, 30] },
                        2: { halign: 'center', fontSize: 7 },
                        3: { halign: 'center', fontStyle: 'bold' }
                    },
                    tableWidth: contentWidth,
                    margin: { left: margin, right: 0 }
                });
                yPosition = doc.lastAutoTable.finalY + 10;
            }

            // ===========================================
            // COMPANY-WISE STOCK ANALYSIS - ELEGANT MONOCHROME
            // ===========================================
            if (dataSource.availableStock?.companyWise && dataSource.availableStock.companyWise.length > 0) {
                if (yPosition > 200) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Professional section header
                // doc.setFillColor(230, 230, 230);
                // doc.setDrawColor(100, 100, 100);
                // doc.roundedRect(20, yPosition, 170, 12, 1, 1, 'FD');

                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                doc.text('COMPANY-WISE INVENTORY ANALYSIS', margin, yPosition + 8);
                yPosition += 12;

                const companyStockData = dataSource.availableStock.companyWise
                    .map(company => {
                        const totalStock = company.productWise?.reduce((companyTotal, product) => {
                            const productTotal = product.powerWise?.reduce((powerTotal, power) => {
                                return powerTotal + (power.count || 0);
                            }, 0) || 0;
                            return companyTotal + productTotal;
                        }, 0) || 0;

                        const productCount = company.productWise?.length || 0;
                        const powerVarieties = new Set();

                        company.productWise?.forEach(product => {
                            product.powerWise?.forEach(power => {
                                if (power.power) powerVarieties.add(power.power);
                            });
                        });

                        return [
                            company.companyName || 'Unknown',
                            totalStock.toLocaleString(),
                            productCount.toString(),
                            powerVarieties.size.toString(),
                            totalStock > 0 ? 'Active' : 'Inactive'
                        ];
                    })
                    .sort((a, b) => parseInt(b[1].replace(/,/g, '')) - parseInt(a[1].replace(/,/g, '')))
                    .slice(0, 15); // Top 15 companies

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Company', 'Stock', 'Products', 'Powers', 'Status']],
                    body: companyStockData,
                    theme: 'plain',
                    headStyles: {
                        fillColor: [0, 0, 0],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'center',
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: [40, 40, 40],
                        cellPadding: 2.5,
                        lineWidth: 0.1
                    },
                    alternateRowStyles: {
                        fillColor: [248, 248, 248]
                    },
                    columnStyles: {
                        0: { halign: 'center', fontStyle: 'bold', textColor: [20, 20, 20] },
                        1: { halign: 'center', fontStyle: 'bold' },
                        2: { halign: 'center' },
                        3: { halign: 'center' },
                        4: { halign: 'center', fontStyle: 'bold', fontSize: 7 }
                    },
                    tableWidth: contentWidth,
                    margin: { left: margin, right: 0 }
                });
                yPosition = doc.lastAutoTable.finalY + 20;
            }

            // ===========================================
            // PRODUCT-WISE DETAILED ANALYSIS - PROFESSIONAL STYLING
            // ===========================================
            if (dataSource.availableStock?.companyWise) {
                if (yPosition > 180) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Professional section header
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                doc.text('PRODUCT PORTFOLIO ANALYSIS', margin, yPosition + 8);
                yPosition += 12;

                const productMap = {};
                dataSource.availableStock.companyWise.forEach(company => {
                    company.productWise?.forEach(product => {
                        const productKey = product.productName;
                        if (!productMap[productKey]) {
                            productMap[productKey] = {
                                totalStock: 0,
                                companies: new Set(),
                                powers: new Set(),
                                powerDetails: {}
                            };
                        }

                        productMap[productKey].companies.add(company.companyName);

                        product.powerWise?.forEach(power => {
                            productMap[productKey].totalStock += power.count || 0;
                            productMap[productKey].powers.add(power.power);

                            if (!productMap[productKey].powerDetails[power.power]) {
                                productMap[productKey].powerDetails[power.power] = 0;
                            }
                            productMap[productKey].powerDetails[power.power] += power.count || 0;
                        });
                    });
                });

                const productData = Object.entries(productMap)
                    .map(([productName, details]) => {
                        const topPower = Object.entries(details.powerDetails)
                            .sort(([, a], [, b]) => b - a)[0];

                        return [
                            productName || 'Unknown Product',
                            details.totalStock.toLocaleString(),
                            details.companies.size.toString(),
                            details.powers.size.toString(),
                            topPower ? `${topPower[0]} (${topPower[1]})` : 'N/A'
                        ];
                    })
                    .sort((a, b) => parseInt(b[1].replace(/,/g, '')) - parseInt(a[1].replace(/,/g, '')))
                    .slice(0, 20); // Top 20 products

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Product', 'Stock', 'Suppliers', 'Powers', 'Top Power']],
                    body: productData,
                    theme: 'plain',
                    headStyles: {
                        fillColor: [0, 0, 0],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'center',
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: [50, 50, 50],
                        cellPadding: 2.5,
                        lineWidth: 0.1
                    },
                    alternateRowStyles: {
                        fillColor: [252, 252, 252]
                    },
                    columnStyles: {
                        0: { fontStyle: 'bold', textColor: [30, 30, 30], halign: 'center' },
                        1: { halign: 'center', fontStyle: 'bold' },
                        2: { halign: 'center' },
                        3: { halign: 'center' },
                        4: { fontSize: 7, halign: 'center' }
                    },
                    tableLineColor: [150, 150, 150],
                    tableLineWidth: 0.2,
                    tableWidth: 'auto',
                    margin: { left: margin, right: margin }
                });
                yPosition = doc.lastAutoTable.finalY + 20;
            }

            // ===========================================
            // POWER DISTRIBUTION ANALYSIS - REFINED MONOCHROME
            // ===========================================
            if (dataSource.availableStock?.companyWise) {
                if (yPosition > 180) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Professional section header
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                doc.text('POWER DISTRIBUTION MATRIX', margin, yPosition + 8);
                yPosition += 12;

                const powerMap = {};
                dataSource.availableStock.companyWise.forEach(company => {
                    company.productWise?.forEach(product => {
                        product.powerWise?.forEach(power => {
                            if (!powerMap[power.power]) {
                                powerMap[power.power] = {
                                    totalCount: 0,
                                    companies: new Set(),
                                    products: new Set()
                                };
                            }
                            powerMap[power.power].totalCount += power.count || 0;
                            powerMap[power.power].companies.add(company.companyName);
                            powerMap[power.power].products.add(product.productName);
                        });
                    });
                });

                const totalAllPowers = Object.values(powerMap).reduce((sum, details) => sum + details.totalCount, 0);

                const powerData = Object.entries(powerMap)
                    .map(([power, details]) => {
                        const percentage = totalAllPowers > 0 ? ((details.totalCount / totalAllPowers) * 100).toFixed(1) : '0.0';
                        return [
                            power || 'Unknown',
                            details.totalCount.toLocaleString(),
                            `${percentage}%`,
                            details.companies.size.toString(),
                            details.products.size.toString()
                        ];
                    })
                    .sort((a, b) => parseInt(b[1].replace(/,/g, '')) - parseInt(a[1].replace(/,/g, '')))
                    .slice(0, 15); // Top 15 powers

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Power', 'Quantity', 'Share %', 'Suppliers', 'Products']],
                    body: powerData,
                    theme: 'plain',
                    headStyles: {
                        fillColor: [0, 0, 0],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'center',
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: [45, 45, 45],
                        cellPadding: 2.5,
                        lineWidth: 0.1
                    },
                    alternateRowStyles: {
                        fillColor: [246, 246, 246]
                    },
                    columnStyles: {
                        0: { fontStyle: 'bold', textColor: [25, 25, 25], halign: 'center' },
                        1: { halign: 'center', fontStyle: 'bold' },
                        2: { halign: 'center', fontStyle: 'bold', textColor: [70, 70, 70] },
                        3: { halign: 'center' },
                        4: { halign: 'center' }
                    },
                    tableLineColor: [140, 140, 140],
                    tableLineWidth: 0.2,
                    tableWidth: 'auto',
                    margin: { left: margin, right: margin }
                });
                yPosition = doc.lastAutoTable.finalY + 20;
            }

            // ===========================================
            // CRITICAL ALERTS SECTION - MONOCHROME EMPHASIS
            // ===========================================
            if (dashboardData?.lowStock && dashboardData.lowStock.length > 0) {
                if (yPosition > 160) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Alert section header with emphasis
                doc.setFillColor(50, 50, 50); // Dark grey for critical section
                doc.setDrawColor(0, 0, 0);
                doc.roundedRect(20, yPosition, 170, 12, 1, 1, 'FD');

                doc.setFontSize(16);
                doc.setTextColor(255, 255, 255); // White text on dark background
                doc.setFont("helvetica", "bold");
                doc.text('🚨 CRITICAL INVENTORY ALERTS', 25, yPosition + 8);
                yPosition += 20;

                const lowStockData = dashboardData.lowStock
                    .slice(0, 20)
                    .map(item => {
                        let priorityLevel = 'Medium';
                        if (item.quantity <= 3) priorityLevel = 'CRITICAL';
                        else if (item.quantity <= 7) priorityLevel = 'HIGH';
                        else if (item.quantity <= 15) priorityLevel = 'MEDIUM';

                        return [
                            item.productName || 'N/A',
                            item.power || 'N/A',
                            item.companyName || 'N/A',
                            (item.quantity || 0).toString(),
                            priorityLevel
                        ];
                    });

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Product', 'Power', 'Company', 'Stock', 'Priority']],
                    body: lowStockData,
                    theme: 'plain',
                    headStyles: {
                        fillColor: [0, 0, 0],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'center',
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: [60, 60, 60],
                        cellPadding: 2.5,
                        lineWidth: 0.1
                    },
                    alternateRowStyles: {
                        fillColor: [250, 250, 250]
                    },
                    columnStyles: {
                        0: { fontStyle: 'bold', textColor: [30, 30, 30], halign: 'center' },
                        1: { halign: 'center' },
                        2: { fontSize: 7, halign: 'center' },
                        3: { halign: 'center', fontStyle: 'bold', textColor: [80, 80, 80] },
                        4: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0] }
                    },
                    tableLineColor: [120, 120, 120],
                    tableLineWidth: 0.2,
                    tableWidth: 'auto',
                    margin: { left: margin, right: margin }
                });
                yPosition = doc.lastAutoTable.finalY + 20;
            }

            // ===========================================
            // EXPIRY MANAGEMENT - PROFESSIONAL MONOCHROME
            // ===========================================
            if (dashboardData?.expiringSoon && dashboardData.expiringSoon.length > 0) {
                if (yPosition > 160) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Professional expiry section header
                doc.setFillColor(70, 70, 70);
                doc.setDrawColor(30, 30, 30);
                doc.roundedRect(20, yPosition, 170, 12, 1, 1, 'FD');

                doc.setFontSize(16);
                doc.setTextColor(255, 255, 255);
                doc.setFont("helvetica", "bold");
                doc.text('⏰ EXPIRY MANAGEMENT DASHBOARD', 25, yPosition + 8);
                yPosition += 20;

                const expiryData = dashboardData.expiringSoon
                    .slice(0, 20)
                    .map(item => {
                        const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                        const daysToExpiry = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A';

                        let urgencyLevel = 'Monitor';
                        if (daysToExpiry !== 'N/A') {
                            if (daysToExpiry <= 7) urgencyLevel = 'URGENT';
                            else if (daysToExpiry <= 30) urgencyLevel = 'HIGH';
                            else if (daysToExpiry <= 60) urgencyLevel = 'MEDIUM';
                        }

                        return [
                            item.productName || 'N/A',
                            item.power || 'N/A',
                            item.companyName || 'N/A',
                            expiryDate ? expiryDate.toLocaleDateString() : 'N/A',
                            daysToExpiry !== 'N/A' ? `${daysToExpiry}d` : 'N/A',
                            urgencyLevel
                        ];
                    });

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Product', 'Power', 'Company', 'Expiry', 'Days', 'Urgency']],
                    body: expiryData,
                    theme: 'plain',
                    headStyles: {
                        fillColor: [0, 0, 0],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'center',
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: [55, 55, 55],
                        cellPadding: 2.5,
                        lineWidth: 0.1
                    },
                    alternateRowStyles: {
                        fillColor: [249, 249, 249]
                    },
                    columnStyles: {
                        0: { fontStyle: 'bold', textColor: [35, 35, 35], halign: 'center' },
                        1: { halign: 'center' },
                        2: { fontSize: 7, halign: 'center' },
                        3: { halign: 'center', fontSize: 7 },
                        4: { halign: 'center', fontStyle: 'bold' },
                        5: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0] }
                    },
                    tableLineColor: [130, 130, 130],
                    tableLineWidth: 0.2,
                    tableWidth: 'auto',
                    margin: { left: margin, right: margin }
                });
                yPosition = doc.lastAutoTable.finalY + 20;
            }

            // ===========================================
            // TOP PERFORMANCE PRODUCTS - ELEGANT MONOCHROME
            // ===========================================
            if (dataSource.consumption?.productWiseConsumption && dataSource.consumption.productWiseConsumption.length > 0) {
                if (yPosition > 160) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Premium section header
                doc.setFillColor(215, 215, 215);
                doc.setDrawColor(70, 70, 70);
                doc.roundedRect(20, yPosition, 170, 12, 1, 1, 'FD');

                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                doc.text('🔥 TOP PERFORMANCE PRODUCTS', 25, yPosition + 8);
                yPosition += 20;

                const topProductsData = dataSource.consumption.productWiseConsumption
                    .slice(0, 15)
                    .map((product, index) => {
                        // Create ranking badges
                        let rankBadge = `#${index + 1}`;
                        if (index === 0) rankBadge = '🥇 #1';
                        else if (index === 1) rankBadge = '🥈 #2';
                        else if (index === 2) rankBadge = '🥉 #3';

                        return [
                            rankBadge,
                            product.productName || 'N/A',
                            product.companyName || 'N/A',
                            (product.totalConsumption || 0).toLocaleString(),
                            product.powerWiseConsumption?.map(p => `${p.power}(${p.count})`).slice(0, 2).join(', ') || 'N/A'
                        ];
                    });

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Rank', 'Product', 'Company', 'Consumed', 'Top Powers']],
                    body: topProductsData,
                    theme: 'plain',
                    headStyles: {
                        fillColor: [0, 0, 0],
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'center',
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: [60, 60, 60],
                        cellPadding: 2.5,
                        lineWidth: 0.1
                    },
                    alternateRowStyles: {
                        fillColor: [251, 251, 251]
                    },
                    columnStyles: {
                        0: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0] },
                        1: { fontStyle: 'bold', textColor: [40, 40, 40], halign: 'center' },
                        2: { fontSize: 7, halign: 'center' },
                        3: { halign: 'center', fontStyle: 'bold', textColor: [80, 80, 80] },
                        4: { fontSize: 7, halign: 'center' }
                    },
                    tableLineColor: [160, 160, 160],
                    tableLineWidth: 0.2,
                    tableWidth: 'auto',
                    margin: { left: margin, right: margin }
                });
                yPosition = doc.lastAutoTable.finalY + 20;
            }

            // ===========================================
            // PROFESSIONAL FOOTER & BRANDING - ENHANCED DESIGN
            // ===========================================
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                // Enhanced footer design with professional gradient
                doc.setFillColor(248, 249, 250);
                doc.rect(margin, pageHeight - 25, contentWidth, 20, 'F');

                // Elegant top border with multiple lines
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1.2);
                doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

                doc.setDrawColor(160, 160, 160);
                doc.setLineWidth(0.5);
                doc.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);

                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                doc.line(margin, pageHeight - 23, pageWidth - margin, pageHeight - 23);

                // Single line footer with all information properly spaced
                doc.setFontSize(7);
                doc.setTextColor(60, 60, 60);
                doc.setFont("helvetica", "normal");

                // Create footer text elements
                const generatedText = `Generated: ${new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })}`;

                const reportPeriodText = `Report Period: ${reportPeriod}`;
                const pageText = `Page ${i} of ${pageCount}`;
                const timeText = new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                const yPos = pageHeight - 15;

                // Left side - MONTHLY PERFORMANCE REPORT (bold and prominent)
                doc.setFontSize(9);
                doc.setTextColor(20, 20, 20);
                doc.setFont("helvetica", "bold");
                const leftText = "MONTHLY PERFORMANCE REPORT";
                const leftStartX = margin + 5;
                doc.text(leftText, leftStartX, yPos);

                // Right side - Generated information (bold and professional)
                doc.setFontSize(8);
                doc.setTextColor(40, 40, 40);
                doc.setFont("helvetica", "bold");
                const rightSideText = `${generatedText}  •  ${reportPeriodText}  •  ${pageText}  •  ${timeText}`;
                const rightTextWidth = doc.getTextWidth(rightSideText);
                const rightStartX = pageWidth - margin - rightTextWidth - 5;
                doc.text(rightSideText, rightStartX, yPos);

                // Bottom accent line
                doc.setDrawColor(120, 120, 120);
                doc.setLineWidth(0.8);
                doc.line(margin + contentWidth * 0.25, pageHeight - 7, pageWidth - margin - contentWidth * 0.25, pageHeight - 7);
            }

            // Save the premium professional PDF
            const filename = `Business_Report_${reportPeriod.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            console.log(`Generating professional PDF: ${filename}`);
            doc.save(filename);
            console.log('✅ Professional PDF generated successfully!');

        } catch (error) {
            console.error('❌ Error generating PDF:', error);
        }
    };

    return (
        <div className="relative">
            {/* Download Icon Button */}
            <button
                onClick={handleDownloadClick}
                className="bg-black hover:bg-gray-800 text-white p-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                title="Download PDF Report"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </button>

            {/* Month Selector Modal - Professional Monochrome Design */}
            {showMonthSelector && (
                <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-200/80 backdrop-blur-lg">
                        {/* Professional Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-black to-gray-800 bg-clip-text text-transparent">
                                    Report Calendar
                                </h3>
                                <div className="w-16 h-0.5 bg-gradient-to-r from-gray-600 via-black to-gray-500 rounded-full mt-2"></div>
                                <p className="text-sm text-gray-600 mt-2 font-medium">Select reporting period</p>
                            </div>
                            <button
                                onClick={() => setShowMonthSelector(false)}
                                className="bg-gradient-to-br from-gray-100 via-white to-gray-200 hover:from-gray-200 hover:via-gray-100 hover:to-gray-300 text-gray-700 hover:text-black p-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-300/50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Year Selector - If multiple years available */}
                        {(() => {
                            const currentYear = new Date().getFullYear();
                            const years = [...new Set(availableMonths.map(m => m.year))].sort((a, b) => b - a);

                            const monthsInYear = [
                                'January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'
                            ];

                            const getAvailableMonthsForYear = (year) => {
                                return availableMonths.filter(m => m.year === year);
                            };

                            const isMonthAvailable = (monthIndex, year) => {
                                return availableMonths.some(m => m.month === monthIndex + 1 && m.year === year);
                            };

                            return (
                                <>
                                    {/* Professional Year Navigation */}
                                    {years.length > 1 && (
                                        <div className="mb-5 flex justify-center">
                                            <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl p-1.5 flex gap-1 shadow-inner border border-gray-300/50">
                                                {years.map(year => (
                                                    <button
                                                        key={year}
                                                        onClick={() => setSelectedYear(year)}
                                                        className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 ${selectedYear === year
                                                            ? 'bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white shadow-lg transform scale-105'
                                                            : 'text-gray-700 hover:text-black hover:bg-gradient-to-r hover:from-white hover:to-gray-100 hover:shadow-md'
                                                            }`}
                                                    >
                                                        {year}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Professional Annual Report Button */}
                                    <div className="mb-5">
                                        <button
                                            onClick={() => handleMonthSelect(null)}
                                            className="w-full bg-black text-white px-5 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-2xl border border-gray-700/30"
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="bg-gradient-to-br from-white/20 to-gray-300/20 p-2 rounded-lg shadow-inner">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-bold">Complete Annual Report</div>
                                                    <div className="text-gray-300 text-xs">Comprehensive {selectedYear} analysis</div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Professional Calendar Grid */}
                                    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-xl p-4 border-2 border-gray-200/60 shadow-inner">
                                        <div className="text-center mb-4">
                                            <h4 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-black to-gray-700 bg-clip-text text-transparent">{selectedYear}</h4>
                                            <div className="w-12 h-0.5 bg-gradient-to-r from-gray-500 via-black to-gray-600 mx-auto mt-2 rounded-full"></div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3">
                                            {monthsInYear.map((monthName, monthIndex) => {
                                                const isAvailable = isMonthAvailable(monthIndex, selectedYear);
                                                const monthValue = `${monthIndex + 1}-${selectedYear}`;

                                                return (
                                                    <button
                                                        key={monthIndex}
                                                        onClick={() => isAvailable ? handleMonthSelect(monthValue) : null}
                                                        disabled={!isAvailable}
                                                        className={`
                                                            relative p-3 rounded-xl text-xs font-bold transition-all duration-300 transform
                                                            ${isAvailable
                                                                ? 'bg-gradient-to-br from-white via-gray-50 to-gray-100 hover:from-gray-100 hover:via-white hover:to-gray-200 border-2 border-gray-300/60 hover:border-gray-500 text-gray-800 hover:text-black shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer'
                                                                : 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 border-2 border-gray-400/60 text-gray-500 cursor-not-allowed opacity-70'
                                                            }
                                                        `}
                                                    >
                                                        {/* Professional Month Icon */}
                                                        <div className={`w-6 h-6 mx-auto mb-2 rounded-lg flex items-center justify-center ${isAvailable
                                                            ? 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 shadow-inner'
                                                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                                            }`}>
                                                            {isAvailable ? (
                                                                <svg className="w-3.5 h-3.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {/* Month Name */}
                                                        <div className="text-xs font-bold">{monthName.slice(0, 3)}</div>

                                                        {/* Professional Status Indicator */}
                                                        {isAvailable ? (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-gray-700 via-black to-gray-800 rounded-full border-2 border-white shadow-lg"></div>
                                                        ) : (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full border-2 border-white shadow-sm"></div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Professional Legend */}
                                    <div className="mt-4 flex justify-center gap-6 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-gradient-to-br from-gray-700 via-black to-gray-800 rounded-full border border-gray-300 shadow-md"></div>
                                            <span className="text-gray-700 font-medium">Reports Available</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full border border-gray-300 shadow-sm"></div>
                                            <span className="text-gray-600 font-medium">No Data</span>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        {/* Professional No Data State */}
                        {availableMonths.length === 0 && (
                            <div className="text-center py-6">
                                <div className="bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 p-6 rounded-xl border-2 border-gray-300/50 shadow-inner">
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-800 font-bold text-base mb-2">No Reports Available</p>
                                    <p className="text-gray-600 text-sm font-medium">Please check back when monthly data is available</p>
                                </div>
                            </div>
                        )}

                        {/* Professional Footer */}
                        <div className="mt-5 pt-4 border-t-2 border-gray-300/60">
                            <div className="text-center text-xs">
                                <span className="bg-gradient-to-r from-gray-600 via-black to-gray-700 bg-clip-text text-transparent font-bold tracking-wide">
                                    BUSINESS INTELLIGENCE • REPORT CALENDAR
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyReportPDF;

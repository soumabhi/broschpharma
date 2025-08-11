import React from "react";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import Signature from "../PDF/Pictures/Sign.png";
import logo from "../PDF/Pictures/image.png";

const cellBase = {
  fontSize: 8,
  padding: 3,
  borderWidth: 0.5,
  borderColor: "#000",
  textAlign: "center",
  lineHeight: 1.3,
  // justifyContent and alignItems can interfere with flexWrap
  // justifyContent: "center",
  // alignItems: "center",
};

// Enhanced PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 15,
    fontSize: 8,
    fontFamily: "Courier",
    // height: "300mm", // Not typically needed for Page component
  },
  headerContainer: {
    border: "0.5px solid #000",
    marginBottom: 8,
  },
  header: {
    position: "relative",
    height: 35,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  centerText: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  companyInfo: {
    flexDirection: "row",
    borderTop: "1px solid #000",
  },
  addressSection: {
    width: "35%",
    flexDirection: "row",
    alignItems: "flex-start",
    borderRight: "1px solid #000",
    padding: 10,
  },
  logoContainer: {
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  companyDetails: {
    flex: 1,
  },
  invoiceDetails: {
    width: "30%",
    padding: 8,
    borderRight: "1px solid #000",
    fontSize: 7,
  },
  section: {
    width: "35%",
    flexDirection: "row",
  },
  billTo: {
    width: "50%",
    padding: 6,
    borderRight: "0.5px solid #000",
  },
  shipTo: {
    width: "50%",
    padding: 6,
  },
  sectionHeader: {
    borderBottom: "1px solid #000",
    fontWeight: "bold",
    marginBottom: 3,
    paddingBottom: 2,
  },
  // Enhanced Table Styles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e9ecef",
    fontWeight: "bold",
    fontSize: 7,
    borderTopWidth: "0.4px solid gray",
    borderBottomWidth: "0.1px solid gray",
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: "0.5px solid gray",
    borderColor: "#ccc",
  },
  // Perfectly aligned columns
  col1: { width: "3%", ...cellBase, fontSize: 7 }, // #
  col2: {
    width: "20%",
    ...cellBase,
    fontSize: 7,
    textAlign: "left",
    paddingLeft: 2,
    flexWrap: "wrap", // ADDED - Allows Item Name to wrap
  }, // Item name
  col3: { width: "6%", ...cellBase, fontSize: 7 }, // HSN/SAC
  col4: {
    width: "27%",
    ...cellBase,
    fontSize: 7,
    textAlign: "left",
    paddingLeft: 2,
    flexWrap: "wrap",
    wordBreak: "break-word",
  }, // SL NO
  col5: { width: "6%", ...cellBase, fontSize: 7 }, // POWER
  col6: { width: "8%", ...cellBase, fontSize: 7 }, // Exp. Date
  col7: { width: "4%", ...cellBase, fontSize: 7 }, // Qty
  col8: { width: "7%", ...cellBase, fontSize: 7 }, // Price/Unit
  col9: { width: "7%", ...cellBase, fontSize: 7 }, // Discount
  col10: { width: "6%", ...cellBase, fontSize: 7 }, // Taxable Amt
  col11: { width: "8%", ...cellBase, fontSize: 7 }, // GST
  col12: { width: "9%", ...cellBase, fontSize: 7, borderRightWidth: 1 }, // Amount
  totalRow: {
    flexDirection: "row",
    fontWeight: "bold",
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    // borderTopWidth: 2,
    borderColor: "#000",
  },
  // Enhanced Invoice Amount Container - Two Parts (removed GST breakdown table)
  invoiceAmountContainer: {
    flexDirection: "row",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#000",
  },
  // Part 1: Amount in Words
  amountWordsSection: {
    width: "30%",
    padding: 8,
    borderRight: "1px solid #000",
  },
  // Part 2: Authorization Section (expanded to fill GST breakdown space)
  authorizationSection: {
    width: "45%",
    padding: 8,
    borderRight: "1px solid #000",
    alignItems: "center",
    justifyContent: "center",
  },
  // Part 3: Total Summary
  totalSummarySection: {
    width: "25%",
    padding: 8,
  },
  totalSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  finalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderTopWidth: 0.4,
    borderTopColor: "gray", // or "#888"
    backgroundColor: "#f8f9fa",
    fontWeight: "bold",
  },

  footerContainer: {
    position: "absolute",
    bottom: 15,
    left: 15,
    right: 15,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end", // Align to right since we removed terms
  },
  signature: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
    alignItems: "center",
  },
  contentContainer: {
    marginBottom: 100,
  },
  // Table border wrapper
  tableWrapper: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 8,
  },
});

// Calculate totals with override data
const calculateTotals = (items, discount = 0, overrideData = null) => {
  // If override data is provided, use it instead of calculating from items
  if (overrideData) {
    return {
      totalQty: overrideData.totalQty || 0,
      totalAmount: overrideData.totalAmount || "0.00",
      grandTotalAmount: overrideData.grandTotalAmount || "0.00",
      totalGST: overrideData.totalGST || "0.00",
      taxableValue: overrideData.taxableValue || "0.00",
      cgst: overrideData.cgst || "0.00",
      sgst: overrideData.sgst || "0.00",
      igst: overrideData.igst || "0.00",
      totalTaxAmount: overrideData.totalTaxAmount || "0.00",
      discount: overrideData.discount || "0.00",
    };
  }
  // Original calculation logic
  const totalQty = items.reduce(
    (sum, item) => sum + (Number(item.qty || item.quantity) || 0),
    0
  );
  const totalAmount = items.reduce((sum, item) => {
    let amt = item.amount;
    if (typeof amt === "string") {
      amt = parseFloat(amt.replace(/,/g, ""));
    }
    if (typeof amt !== "number" || isNaN(amt)) amt = 0;
    return sum + amt;
  }, 0);
  const totalGST = items.reduce((sum, item) => {
    let gst = item.gst;
    if (typeof gst === "string") {
      gst = parseFloat(gst.replace(/,/g, ""));
    }
    if (typeof gst !== "number" || isNaN(gst)) gst = 0;
    return sum + gst;
  }, 0);
  const taxableValue = totalAmount / 1.05;
  const cgst = taxableValue * 0.025;
  const sgst = taxableValue * 0.025;
  const discountAmt = Number(discount) || 0;
  return {
    totalQty,
    totalAmount: totalAmount.toFixed(2),
    grandTotalAmount: (totalAmount + totalGST).toFixed(2),
    totalGST: totalGST.toFixed(2),
    taxableValue: taxableValue.toFixed(2),
    cgst: cgst.toFixed(2),
    sgst: sgst.toFixed(2),
    totalTaxAmount: (cgst + sgst).toFixed(2),
    discount: discountAmt.toFixed(2),
  };
};

// Function to convert number to words
const numberToWords = (num) => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  if (num === 0) return "Zero";
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100)
    return (
      tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "")
    );
  if (num < 1000)
    return (
      ones[Math.floor(num / 100)] +
      " Hundred" +
      (num % 100 !== 0 ? " " + numberToWords(num % 100) : "")
    );
  const thousand = Math.floor(num / 1000);
  const remainder = num % 1000;
  return (
    numberToWords(thousand) +
    " Thousand" +
    (remainder !== 0 ? " " + numberToWords(remainder) : "")
  );
};

const PDFGeneration = ({
  invoice,
  overrideData = null,
  overrideItems = null,
}) => {
  // Use override items if provided, otherwise use invoice items
  const items = overrideItems || invoice.items || [];

  const totals = calculateTotals(items, invoice.discount, overrideData);
  const amountInWords = `${numberToWords(
    Math.floor(Number(totals.totalAmount))
  )} Rupees Only`;

  return (
    <Document>
      {/* Render a single page and let the content flow */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header Container - Rendered once at the top */}
        <View style={styles.headerContainer} fixed>
          {" "}
          {/* 'fixed' might help keep it on each physical page if content flows */}
          {/* Header */}
          <View style={styles.header}>
            <View
              style={{
                width: "20%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image src={logo} style={{ width: 50, height: 20 }} />
            </View>
            <View style={styles.centerText}>
              <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                TAX INVOICE
              </Text>
            </View>
          </View>
          {/* Company Info and Invoice Details */}
          <View style={styles.companyInfo}>
            {/* Company Info */}
            <View style={styles.addressSection}>
              <View style={styles.companyDetails}>
                <Text
                  style={{ fontWeight: "bold", fontSize: 9, marginBottom: 2 }}
                >
                  BROSCH PHARMA PRIVATE LIMITED
                </Text>
                <Text style={{ marginBottom: 1 }}>
                  PLOT NO - 256 / 263, Aerodrome Area, In Front of JINDAL Office
                </Text>
                <Text style={{ marginBottom: 1 }}>
                  BHUBANESWAR,{" "}
                  <Text style={{ fontWeight: "semibold" }}>MOB-</Text>
                  9777684484,{" "}
                  <Text style={{ fontWeight: "semibold" }}>EMAIL-</Text>
                  info@broschpharma.com
                </Text>

                <Text style={{ marginBottom: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>State:</Text> 21-Odisha,{" "}
                  <Text style={{ fontWeight: "bold" }}>GSTIN:</Text>{" "}
                  21AAMCB7648A1ZX
                </Text>
                <Text>
                  <Text style={{ fontWeight: "bold" }}>WEBSITE:</Text>{" "}
                  www.broschpharma.com
                </Text>
              </View>
            </View>
            {/* Invoice Details */}
            <View style={styles.invoiceDetails}>
              <Text style={{ marginBottom: 4, fontSize: 8 }}>
                <Text style={{ fontWeight: "bold" }}>Invoice Number: </Text>
                {invoice.invoice || ""}
              </Text>
              <Text style={{ marginBottom: 4, fontSize: 8 }}>
                <Text style={{ fontWeight: "bold" }}>Date: </Text>
                {invoice.date
                  ? new Date(invoice.date).toLocaleDateString()
                  : ""}
              </Text>
              <Text style={{ marginBottom: 4, fontSize: 8 }}>
                <Text style={{ fontWeight: "bold" }}>Place of Supply: </Text>
                {invoice.placeofsupply || ""}
              </Text>
            </View>
            {/* Bill To and Ship To */}
            <View style={styles.section}>
              <View style={styles.billTo}>
                <Text style={styles.sectionHeader}>Bill To</Text>
                <Text style={{ fontWeight: "bold", marginBottom: 2 }}>
                  {invoice.bill_to_name || ""}
                </Text>
                <Text style={{ marginBottom: 1 }}>
                  Address: {invoice.bill_to_address || ""}
                </Text>
                <Text style={{ marginBottom: 1 }}>
                  Contact No.: {invoice.bill_to_phone || ""}
                </Text>
                <Text>GSTIN: {invoice.bill_to_gst || ""}</Text>
              </View>
              <View style={styles.shipTo}>
                <Text style={styles.sectionHeader}>Ship To</Text>
                <Text style={{ fontWeight: "bold", marginBottom: 2 }}>
                  {invoice.ship_to_name || ""}
                </Text>
                <Text style={{ marginBottom: 1 }}>
                  Shipping Address: {invoice.ship_to_address || ""}
                </Text>
                <Text>Contact No.: {invoice.ship_to_phone || ""}</Text>
              </View>
            </View>
          </View>
        </View>{" "}
        {/* End Header Container */}
        {/* Items Table - Let it flow */}
        <View style={styles.contentContainer}>
          {" "}
          {/* This container should allow growth */}
          <View style={styles.tableWrapper}>
            {/* Table Header */}
            <View style={styles.tableHeader} fixed>
              {" "}
              {/* 'fixed' might help keep header on each broken page */}
              <Text style={styles.col1}>#</Text>
              <Text style={styles.col2}>Item Name</Text>
              <Text style={styles.col3}>HSN/SAC</Text>
              <Text style={styles.col4}>Serial No.</Text>
              <Text style={styles.col5}>Power</Text>
              <Text style={styles.col6}>Exp. Date</Text>
              <Text style={styles.col7}>Qty</Text>
              <Text style={styles.col8}>Price/Unit</Text>
              <Text style={styles.col9}>Discount</Text>
              <Text style={styles.col10}>Taxable Amt</Text>
              <Text style={styles.col11}>GST</Text>
              <Text style={styles.col12}>Amount</Text>
            </View>
            {/* Table Rows - Render ALL items */}
            {/* --- MAIN CHANGE: No pagination slicing --- */}
            {items.map((item, idx) => (
              <View key={item.id || idx} style={styles.tableRow}>
                {" "}
                {/* Ensure tableRow doesn't have minHeight */}
                <Text style={styles.col1}>{idx + 1}</Text>
                <Text style={styles.col2}>{item.item_name || "-"}</Text>
                <Text style={styles.col3}>
                  {item.hsn_sac || item.hsn || item.Hsn || item.HSN || "-"}
                </Text>
                {/* Serial No. with wrapping and array handling */}
                <Text style={styles.col4}>
                  {Array.isArray(item.serial_no)
                    ? item.serial_no.join(", ")
                    : item.serial_no || item.serialNo || item.SLNO || "-"}
                </Text>
                <Text style={styles.col5}>{item.power || "-"}</Text>
                <Text style={styles.col6}>
                  {item.expDate && String(item.expDate).trim() !== ""
                    ? item.expDate
                    : item.exp_date &&
                      (item.exp_date.day != null ||
                        item.exp_date.month != null ||
                        item.exp_date.year != null)
                    ? `${
                        item.exp_date.month != null
                          ? item.exp_date.month.toString().padStart(2, "0")
                          : "--"
                      }/${
                        item.exp_date.year != null ? item.exp_date.year : "----"
                      }`
                    : "-"}
                </Text>
                <Text style={styles.col7}>
                  {item.quantity || item.qty || "-"} {item.unit || ""}
                </Text>
                <Text style={styles.col8}>
                  {(
                    (Number(item?.taxableAmount) || 0) +
                    (Number(item?.discountAmount) || 0)
                  ).toFixed(2)}
                </Text>
                <Text style={styles.col9}>
                  {(Number(item?.discountAmount) || 0).toFixed(2)}
                </Text>
                <Text style={styles.col10}>
                  {(Number(item?.taxableAmount) || 0).toFixed(2)}
                </Text>
                <Text style={styles.col11}>
                  {item?.gst ? `${item.gst}%` : "0%"} /{""}
                  {(Number(item?.gstAmount) || 0).toFixed(2)}
                </Text>
                <Text style={styles.col12}>
                  {(Number(item?.amount) || 0).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={{ width: "61%" }}></Text>
              <Text
                style={{
                  width: "6%",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {totals.totalQty}
              </Text>
              <Text style={{ width: "23%" }}></Text>
              <Text
                style={{
                  width: "10%",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {totals.totalAmount}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.footerContainer} fixed>
          {" "}
          {/* 'fixed' attempts to keep it on each page */}
          <View style={styles.invoiceAmountContainer}>
            {/* Part 1: Amount in Words */}
            <View style={styles.authorizationSection}>
              <Text
                style={{
                  fontWeight: "bold",
                  marginBottom: 15,
                  fontSize: 9,
                  textAlign: "center",
                }}
              >
                For: {invoice.companyName || "BROSCH PHARMA PRIVATE LIMITED"}
              </Text>
              <Image
                src={Signature}
                style={{ width: 80, height: 50, marginBottom: 10 }}
              />
              <Text
                style={{
                  fontSize: 8,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Authorized Signatory
              </Text>
              <Text style={{ fontSize: 7, textAlign: "center", marginTop: 5 }}>
                Director/Manager
              </Text>
            </View>
            {/* Part 2: Authorization Section (expanded) */}
            <View style={styles.amountWordsSection}>
              <Text
                style={{ fontWeight: "bold", marginBottom: 8, fontSize: 9 }}
              >
                Invoice Amount in Words
              </Text>
              <Text style={{ fontWeight: "bold", fontSize: 8 }}>
                {amountInWords}
              </Text>
            </View>
            {/* Part 3: Total Summary with GST values */}
            <View style={styles.totalSummarySection}>
              <Text
                style={{ fontWeight: "bold", marginBottom: 5, fontSize: 9 }}
              >
                Summary
              </Text>
              <View style={styles.totalSummaryRow}>
                <Text style={{ fontSize: 7 }}>Total Amount:</Text>
                <Text style={{ fontSize: 7, fontWeight: "bold" }}>
                  {(
                    invoice?.totalTaxableAmount + invoice?.discountAmount
                  ).toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalSummaryRow}>
                <Text style={{ fontSize: 7 }}>Discount:</Text>
                <Text style={{ fontSize: 7 }}>
                  {(invoice?.discountAmount).toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalSummaryRow}>
                <Text style={{ fontSize: 7 }}>Taxable Amount:</Text>
                <Text style={{ fontSize: 7 }}>
                  {(invoice?.totalTaxableAmount).toFixed(2)}
                </Text>
              </View>
              {/* Show CGST/SGST or IGST based on availability */}
              {invoice.CGST ? (
                <>
                  <View style={styles.totalSummaryRow}>
                    <Text style={{ fontSize: 7 }}>CGST:</Text>
                    <Text style={{ fontSize: 7 }}>
                      {(invoice?.CGST).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.totalSummaryRow}>
                    <Text style={{ fontSize: 7 }}>SGST:</Text>
                    <Text style={{ fontSize: 7 }}>
                      {(invoice?.SGST).toFixed(2)}
                    </Text>
                  </View>
                </>
              ) : invoice?.IGST ? (
                <View style={styles.totalSummaryRow}>
                  <Text style={{ fontSize: 7 }}>IGST:</Text>
                  <Text style={{ fontSize: 7 }}>
                    {(invoice?.IGST).toFixed(2)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.totalSummaryRow}>
                <Text style={{ fontSize: 7 }}>Total GST:</Text>
                <Text style={{ fontSize: 7 }}>
                  {(invoice?.totalGstAmount).toFixed(2)}
                </Text>
              </View>
              <View style={styles.finalTotalRow}>
                <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                  Grand Total:
                </Text>
                <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                  {"Rs. " + Number(invoice?.amountPayable).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.footer}>{/* Footer content */}</View>
        </View>
      </Page>
    </Document>
  );
};

export default PDFGeneration;

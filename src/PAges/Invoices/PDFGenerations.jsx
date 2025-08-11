// /components/PDFGeneration.jsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Basic styles
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  section: { marginBottom: 10 },
  heading: { fontSize: 16, marginBottom: 6, fontWeight: "bold" },
  table: { display: "table", width: "auto", marginTop: 10 },
  row: { flexDirection: "row", borderBottom: "1px solid #ccc", paddingBottom: 4, marginBottom: 4 },
  cell: { flex: 1 },
});

const PDFGeneration = ({ invoice }) => {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.heading}>Invoice: {invoice.invoice}</Text>

        <View style={styles.section}>
          <Text>Date: {new Date(invoice.date).toLocaleDateString()}</Text>
          <Text>Bill To: {invoice.bill_to?.billerName || "-"}</Text>
          <Text>Ship To: {invoice.ship_to || "-"}</Text>
          <Text>Store: {invoice.storeId?.name || "-"}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cell]}>Item</Text>
            <Text style={[styles.cell]}>Batch No</Text>
            <Text style={[styles.cell]}>Qty</Text>
            <Text style={[styles.cell]}>Price</Text>
            <Text style={[styles.cell]}>Amount</Text>
          </View>

          {(invoice.items || []).map((item, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.cell}>{item.itemName}</Text>
              <Text style={styles.cell}>{item.batchNo}</Text>
              <Text style={styles.cell}>{item.quantity}</Text>
              <Text style={styles.cell}>₹{item.price}</Text>
              <Text style={styles.cell}>₹{(item.quantity * item.price).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text>Total: ₹{invoice.total || "-"}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFGeneration;

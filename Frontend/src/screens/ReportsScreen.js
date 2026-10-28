import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { api } from "../config/api";
import { downloadReportFile } from "../utils/reportDownloader";
export default function ReportsScreen({ onOpenDrawer, onBack }) {
  const [reportType, setReportType] = useState("sales");
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [parties, setParties] = useState([]);
  const loadData = async () => {
    setLoading(true);
    try {
      if (reportType === "sales") {
        const res = await api.reports.getSales(`period=${period}`);
        if (res.success) {
          setSalesData(res);
        }
      } else if (reportType === "inventory") {
        const res = await api.items.getAll();
        if (res.success && res.items) {
          setInventoryItems(res.items);
        }
      } else if (reportType === "parties") {
        const res = await api.parties.getAll();
        if (res.success && res.parties) {
          setParties(res.parties);
        }
      }
    } catch (err) {
      console.warn("Failed to load report data:", err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [reportType, period]);
  const handleDownload = async (format) => {
    setDownloading(true);
    let url = "";
    let fileName = "";
    let mimeType = format === "pdf" ? "application/pdf" : "text/csv";
    const timestamp = new Date().toISOString().slice(0, 10);
    if (reportType === "sales") {
      url = api.reports.getSalesPdfUrl(`period=${period}`);
      fileName = `SalesReport_${period}_${timestamp}.pdf`;
    } else if (reportType === "inventory") {
      url = api.reports.getInventoryPdfUrl();
      fileName = `InventoryReport_${timestamp}.pdf`;
    } else if (reportType === "parties") {
      url = api.reports.getPartiesPdfUrl();
      fileName = `CustomerLedger_${timestamp}.pdf`;
    }
    try {
      const res = await downloadReportFile(url, fileName, mimeType);
      if (!res.success && res.error) {
        Alert.alert("Download Note", res.error);
      }
    } catch (e) {
      Alert.alert("Download Error", e.message || "Could not complete download");
    } finally {
      setDownloading(false);
    }
  };
  return (
    <View style={{ flex: 1 }} className="flex-1 bg-gray-50">
      <View className="bg-blue-600 px-4 pt-10 pb-4 flex-row items-center justify-between shadow-md">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={onOpenDrawer} className="mr-3 p-1">
            <Ionicons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-lg font-black tracking-wide">
              Reports & Downloads
            </Text>
            <Text className="text-blue-100 text-[10px] font-medium">
              Sales, Stock & Customer Ledgers
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={loadData}
          disabled={loading}
          className="bg-blue-500/80 p-2 rounded-xl"
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View className="bg-white border-b border-gray-200 px-2 py-2 flex-row justify-around">
        <TouchableOpacity
          onPress={() => setReportType("sales")}
          className={`flex-1 py-2 rounded-xl items-center flex-row justify-center mx-1 ${
            reportType === "sales" ? "bg-blue-600 shadow-sm" : "bg-gray-100"
          }`}
        >
          <Ionicons
            name="bar-chart"
            size={14}
            color={reportType === "sales" ? "#FFFFFF" : "#4B5563"}
          />
          <Text
            className={`text-xs font-bold ml-1.5 ${
              reportType === "sales" ? "text-white" : "text-gray-700"
            }`}
          >
            Sales
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setReportType("inventory")}
          className={`flex-1 py-2 rounded-xl items-center flex-row justify-center mx-1 ${
            reportType === "inventory" ? "bg-emerald-600 shadow-sm" : "bg-gray-100"
          }`}
        >
          <Ionicons
            name="cube"
            size={14}
            color={reportType === "inventory" ? "#FFFFFF" : "#4B5563"}
          />
          <Text
            className={`text-xs font-bold ml-1.5 ${
              reportType === "inventory" ? "text-white" : "text-gray-700"
            }`}
          >
            Inventory
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setReportType("parties")}
          className={`flex-1 py-2 rounded-xl items-center flex-row justify-center mx-1 ${
            reportType === "parties" ? "bg-purple-600 shadow-sm" : "bg-gray-100"
          }`}
        >
          <Ionicons
            name="people"
            size={14}
            color={reportType === "parties" ? "#FFFFFF" : "#4B5563"}
          />
          <Text
            className={`text-xs font-bold ml-1.5 ${
              reportType === "parties" ? "text-white" : "text-gray-700"
            }`}
          >
            Customers
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        {reportType === "sales" && (
          <View className="flex-row gap-2 mb-4">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "week", label: "Last 7 Days" },
              { id: "month", label: "This Month" },
            ].map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setPeriod(p.id)}
                className={`flex-1 py-1.5 rounded-lg items-center border ${
                  period === p.id
                    ? "bg-blue-50 border-blue-600"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    period === p.id ? "text-blue-700" : "text-gray-600"
                  }`}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm">
          <Text className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
            Download Report File
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            Export official formatted PDF reports for your accountant, tax filings, or store records.
          </Text>
          <TouchableOpacity
            onPress={() => handleDownload("pdf")}
            disabled={downloading}
            className="w-full bg-red-600 py-3.5 rounded-xl flex-row items-center justify-center shadow-sm active:bg-red-700"
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="document-text" size={18} color="#FFFFFF" />
                <Text className="text-white font-extrabold text-sm ml-2">
                  Download Official PDF Report
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {reportType === "sales" && salesData && (
          <View className="mb-4">
            <View className="flex-row gap-2.5 mb-2.5">
              <View className="flex-1 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
                <Text className="text-[11px] font-bold text-gray-500">Total Sales</Text>
                <Text className="text-xl font-black text-gray-900 mt-1">
                  Rs. {Number(salesData.summary?.totalSales || 0).toLocaleString("en-IN")}
                </Text>
                <Text className="text-[10px] text-gray-400 mt-0.5">
                  {salesData.summary?.totalBills || 0} Bills Generated
                </Text>
              </View>
              <View className="flex-1 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
                <Text className="text-[11px] font-bold text-gray-500">Discounts Given</Text>
                <Text className="text-xl font-black text-emerald-600 mt-1">
                  Rs. {Number(salesData.summary?.totalDiscount || 0).toLocaleString("en-IN")}
                </Text>
                <Text className="text-[10px] text-gray-400 mt-0.5">Customer Savings</Text>
              </View>
            </View>
            <View className="flex-row gap-2.5">
              <View className="flex-1 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                <Text className="text-[10px] font-bold text-emerald-800">Cash Collected</Text>
                <Text className="text-sm font-black text-emerald-900 mt-0.5">
                  Rs. {Number(salesData.summary?.totalCash || 0).toLocaleString("en-IN")}
                </Text>
              </View>
              <View className="flex-1 bg-purple-50/70 p-3 rounded-xl border border-purple-200">
                <Text className="text-[10px] font-bold text-purple-800">UPI Received</Text>
                <Text className="text-sm font-black text-purple-900 mt-0.5">
                  Rs. {Number(salesData.summary?.totalUpi || 0).toLocaleString("en-IN")}
                </Text>
              </View>
              <View className="flex-1 bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                <Text className="text-[10px] font-bold text-blue-800">GST Collected</Text>
                <Text className="text-sm font-black text-blue-900 mt-0.5">
                  Rs. {Number(salesData.summary?.totalTax || 0).toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          </View>
        )}
        {reportType === "inventory" && (
          <View className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-gray-500 font-bold">Total Catalog Items</Text>
                <Text className="text-2xl font-black text-gray-900 mt-0.5">
                  {inventoryItems.length} Products
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-500 font-bold">Stock Valuation</Text>
                <Text className="text-lg font-black text-emerald-600 mt-0.5">
                  Rs.{" "}
                  {inventoryItems
                    .reduce((acc, it) => acc + (it.stock || 0) * (it.sellingPrice || 0), 0)
                    .toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          </View>
        )}
        {reportType === "parties" && (
          <View className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-gray-500 font-bold">Total Customers</Text>
                <Text className="text-2xl font-black text-gray-900 mt-0.5">
                  {parties.length} Customers
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-500 font-bold">Total Receivables (Udhar)</Text>
                <Text className="text-lg font-black text-red-600 mt-0.5">
                  Rs.{" "}
                  {parties
                    .reduce((acc, p) => acc + (p.balance || 0), 0)
                    .toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          </View>
        )}
        <View className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <View className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex-row justify-between items-center">
            <Text className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {reportType === "sales"
                ? `Invoices (${salesData?.invoices?.length || 0})`
                : reportType === "inventory"
                ? `Stock Items (${inventoryItems.length})`
                : `Customer Ledger (${parties.length})`}
            </Text>
            <Text className="text-[10px] text-gray-400 font-medium">Recent Records</Text>
          </View>
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="small" color="#2563EB" />
              <Text className="text-xs text-gray-400 mt-2">Loading report records...</Text>
            </View>
          ) : reportType === "sales" ? (
            (salesData?.invoices || []).length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-xs text-gray-400">No invoices in this period</Text>
              </View>
            ) : (
              (salesData?.invoices || []).slice(0, 15).map((inv) => (
                <View
                  key={inv._id}
                  className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center">
                      <Text className="text-xs font-black text-gray-900">
                        #{inv.invoiceNumber}
                      </Text>
                      <Text className="text-[10px] text-gray-500 ml-2">
                        {inv.createdAt
                          ? new Date(inv.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })
                          : ""}
                      </Text>
                      <View className="bg-gray-100 px-1.5 py-0.5 rounded ml-2">
                        <Text className="text-[9px] font-bold text-gray-600">
                          {inv.paymentMode}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-gray-600 mt-0.5 font-medium" numberOfLines={1}>
                      {inv.partyName || "Cash Customer"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-black text-gray-900">
                      Rs. {Number(inv.grandTotal || 0).toLocaleString("en-IN")}
                    </Text>
                    <Text className="text-[10px] text-emerald-600 font-bold">
                      {inv.paymentStatus || "PAID"}
                    </Text>
                  </View>
                </View>
              ))
            )
          ) : reportType === "inventory" ? (
            inventoryItems.slice(0, 15).map((it) => (
              <View
                key={it._id}
                className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between"
              >
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-black text-gray-900">{it.name}</Text>
                  <Text className="text-[10px] text-gray-500 mt-0.5">
                    Category: {it.category || "General"} | Unit: {it.unit || "PCS"}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-black text-gray-900">
                    {it.stock || 0} in stock
                  </Text>
                  <Text
                    className={`text-[9px] font-bold ${
                      (it.stock || 0) <= (it.lowStockThreshold || 5)
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {(it.stock || 0) <= (it.lowStockThreshold || 5) ? "LOW STOCK" : "IN STOCK"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            parties.slice(0, 15).map((p) => (
              <View
                key={p._id}
                className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between"
              >
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-black text-gray-900">{p.name}</Text>
                  <Text className="text-[10px] text-gray-500 mt-0.5">
                    Phone: {p.phone || p.whatsappNumber || "--"} | Visits: {p.visitCount || 1}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-black text-gray-900">
                    Spent: Rs. {Number(p.totalSpent || 0).toLocaleString("en-IN")}
                  </Text>
                  <Text
                    className={`text-[10px] font-bold ${
                      (p.balance || 0) > 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    Udhar: Rs. {Number(p.balance || 0).toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
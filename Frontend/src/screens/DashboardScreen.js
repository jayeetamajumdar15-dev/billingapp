import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Alert,
  Linking,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { api } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { shareBackendPdf, printTestSlip } from "../utils/receiptPdfGenerator";

export default function DashboardScreen({
  user,
  onOpenDrawer,
  onNavigateTab,
  onCreateInvoice,
}) {
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBtGuide, setShowBtGuide] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [printerPaperSize, setPrinterPaperSize] = useState("2inch");

  const fetchDashboardData = async () => {
    setLoading(true);
    const res = await api.dashboard.getStats();
    setLoading(false);
    setRefreshing(false);

    if (res.success) {
      setStats(res.stats);
      setRecentTransactions(res.recentTransactions || []);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    AsyncStorage.getItem("billFormatOptions").then((res) => {
      if (res) {
        try {
          const parsed = JSON.parse(res);
          if (parsed.paperWidth) setPrinterPaperSize(parsed.paperWidth);
        } catch {}
      }
    });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleTestSlip = async () => {
    setTestingPrinter(true);
    try {
      const storeData = {
        businessName: user?.businessName || "My Store",
        phone: user?.phone || "7003317615",
        address: user?.address || "",
        email: user?.email || "",
        gstin: user?.gstin || "",
      };
      await printTestSlip(storeData, { paperWidth: printerPaperSize }, "both");
    } catch (e) {
      Alert.alert("Printer Notice", e.message || "Could not launch print service");
    } finally {
      setTestingPrinter(false);
    }
  };

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-gray-100">
      <View className="bg-blue-600 px-4 pt-10 pb-4 flex-row items-center justify-between shadow-md">
        <TouchableOpacity onPress={onOpenDrawer} className="p-1">
          <Ionicons name="menu" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <View className="flex-row items-center">
          {user?.logo ? (
            <Image
              source={{ uri: user.logo }}
              style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, borderWidth: 1, borderColor: "#FFFFFF" }}
            />
          ) : null}
          <Text className="text-white text-base font-extrabold uppercase tracking-widest">
            {user?.businessName || "COMPANY NAME"}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          {/* Quick Bluetooth Connect Button in Top Bar */}
          <TouchableOpacity
            onPress={() => setShowBtGuide(true)}
            className="bg-blue-700 p-1.5 rounded-full mr-1 items-center justify-center border border-blue-400"
          >
            <Ionicons name="bluetooth" size={19} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onRefresh} className="p-1">
            <Ionicons name="sync" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ─── BLUETOOTH THERMAL PRINTER QUICK-CONNECT CARD ─── */}
        <View className="bg-white rounded-2xl p-3.5 mb-3.5 border border-blue-300 shadow-xs flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mr-3 shadow-xs">
              <Ionicons name="bluetooth" size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Thermal Printer
                </Text>
                <View className="ml-2 bg-emerald-100 px-1.5 py-0.2 rounded-full flex-row items-center">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1" />
                  <Text className="text-[9px] font-bold text-emerald-800">Ready</Text>
                </View>
              </View>
              <Text className="text-[11px] text-gray-500 font-medium mt-0.5">
                58mm / 80mm Bluetooth printer connection
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              onPress={handleTestSlip}
              disabled={testingPrinter}
              className="bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-xl flex-row items-center active:bg-blue-100"
            >
              {testingPrinter ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <>
                  <Ionicons name="print-outline" size={13} color="#2563EB" />
                  <Text className="text-blue-700 text-[11px] font-bold ml-1">Test Print</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowBtGuide(true)}
              className="bg-blue-600 px-3 py-1.5 rounded-xl flex-row items-center shadow-xs"
            >
              <Ionicons name="bluetooth-outline" size={13} color="#FFFFFF" />
              <Text className="text-white text-[11px] font-bold ml-1">Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Reports Banner matching Screen-1 */}
        <TouchableOpacity
          onPress={() => (onNavigateTab ? onNavigateTab("reports") : onRefresh())}
          activeOpacity={0.85}
          className="bg-white rounded-2xl p-4 mb-4 border border-blue-200 shadow-sm"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Reports Overview
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs font-bold text-blue-600 mr-1">
                Check Reports
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#2563EB" />
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-gray-500">Today Sales</Text>
              <Text className="text-2xl font-black text-gray-900 mt-0.5">
                Rs. {stats?.todaySalesTotal || 0}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-gray-500">Invoices</Text>
              <Text className="text-base font-bold text-blue-700 mt-0.5">
                {stats?.todayInvoiceCount || 0} bills
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-100">
            <View className="flex-1 bg-blue-50/70 p-2 rounded-lg">
              <Text className="text-[10px] text-gray-500">Regular Customers</Text>
              <Text className="text-xs font-bold text-blue-900 mt-0.5">
                {stats?.regularCustomers || 0} active
              </Text>
            </View>
            <View className="flex-1 bg-amber-50/70 p-2 rounded-lg">
              <Text className="text-[10px] text-gray-500">To Collect (Udhar)</Text>
              <Text className="text-xs font-bold text-amber-900 mt-0.5">
                Rs. {stats?.totalReceivable || 0}
              </Text>
            </View>
            <View className="flex-1 bg-red-50/70 p-2 rounded-lg">
              <Text className="text-[10px] text-gray-500">Low Stock</Text>
              <Text className="text-xs font-bold text-red-700 mt-0.5">
                {stats?.lowStockCount || 0} items
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recent Sale Transactions matching Screen-1 */}
        <View className="flex-row items-center justify-between mb-2 px-1">
          <Text className="text-xs font-extrabold text-gray-700 uppercase tracking-widest">
            Recent Sale Transactions
          </Text>
          <Text className="text-[11px] text-gray-400">
            {recentTransactions.length} recorded
          </Text>
        </View>

        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        ) : recentTransactions.length === 0 ? (
          <TouchableOpacity
            onPress={onCreateInvoice}
            activeOpacity={0.8}
            className="bg-white rounded-2xl p-8 items-center justify-center border border-gray-200 active:bg-blue-50"
          >
            <FontAwesome5 name="file-invoice-dollar" size={36} color="#2563EB" />
            <Text className="text-gray-700 font-bold text-sm mt-3">
              No sales yet
            </Text>
            <Text className="text-blue-600 font-bold text-xs mt-1">
              Tap here or "+ Sale Invoice" below to create your first bill!
            </Text>
          </TouchableOpacity>
        ) : (
          recentTransactions.map((tx) => (
            <View
              key={tx._id}
              className="bg-white rounded-xl p-3.5 mb-2.5 border border-gray-200 shadow-sm flex-row items-center justify-between"
            >
              <View className="flex-1 pr-2">
                <View className="flex-row items-center">
                  <Text className="text-sm font-extrabold text-gray-900 mr-2">
                    {tx.partyName || "Cash Sale"}
                  </Text>
                  {tx.isRegularCustomer ? (
                    <View className="bg-amber-100 px-1.5 py-0.2 rounded">
                      <Text className="text-[9px] font-bold text-amber-800">
                        Regular
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-[11px] text-gray-400 mt-0.5">
                  {tx.invoiceNumber} • {new Date(tx.invoiceDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>

                <View className="flex-row items-center gap-1.5 mt-2">
                  <View
                    className={`px-2 py-0.5 rounded border ${
                      tx.paymentMode === "CASH"
                        ? "bg-emerald-50 border-emerald-300"
                        : tx.paymentMode === "UPI"
                        ? "bg-purple-50 border-purple-300"
                        : tx.paymentMode === "UPI/CASH"
                        ? "bg-amber-50 border-amber-300"
                        : "bg-blue-50 border-blue-300"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        tx.paymentMode === "CASH"
                          ? "text-emerald-700"
                          : tx.paymentMode === "UPI"
                          ? "text-purple-700"
                          : tx.paymentMode === "UPI/CASH"
                          ? "text-amber-800"
                          : "text-blue-700"
                      }`}
                    >
                      {tx.paymentMode}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-base font-extrabold text-gray-900 mb-1">
                  Rs. {tx.grandTotal}
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    await shareBackendPdf(tx, `Invoice_${tx.invoiceNumber || tx._id}.pdf`);
                  }}
                  className="bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-lg flex-row items-center active:bg-emerald-100"
                >
                  <FontAwesome5 name="whatsapp" size={11} color="#059669" />
                  <Text className="text-emerald-800 text-[10px] font-bold ml-1">Share Bill</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button: + Sale Invoice */}
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", bottom: 16, left: 0, right: 0, alignItems: "center", zIndex: 50, elevation: 8 }}
      >
        <TouchableOpacity
          onPress={onCreateInvoice}
          activeOpacity={0.85}
          className="bg-blue-600 px-8 py-3.5 rounded-full shadow-lg shadow-blue-600/40 flex-row items-center border border-blue-400"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text className="text-white font-extrabold text-sm ml-1.5 uppercase tracking-wider">
            Sale Invoice
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bluetooth Connection Guide Modal */}
      <Modal visible={showBtGuide} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
                  <Ionicons name="bluetooth" size={18} color="#2563EB" />
                </View>
                <Text className="text-base font-extrabold text-gray-900">
                  Connect Bluetooth Printer
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowBtGuide(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-3">
              <Text className="text-xs font-bold text-blue-900 mb-1">
                How to Connect VEER B41 Thermal Printer:
              </Text>
              <Text className="text-xs text-blue-800 leading-5">
                1. <Text className="font-bold">Turn ON</Text> your VEER B41 printer (power on).{"\n"}
                2. Open phone <Text className="font-bold">Settings ➔ Bluetooth</Text>, scan & pair with <Text className="font-bold">B41</Text> (PIN is <Text className="font-bold">1234</Text> or <Text className="font-bold">0000</Text>).{"\n"}
                3. Because VEER B41 uses Bluetooth (not Wi-Fi), install the free <Text className="font-bold">RawBT Driver</Text> below to stop "Searching for printers" and print in 1 tap!
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => Linking.openURL("https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter")}
              className="bg-emerald-600 py-2.5 rounded-xl flex-row items-center justify-center mb-3 shadow-xs"
            >
              <Ionicons name="download-outline" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold ml-1.5">
                Install VEER B41 Driver (RawBT on Play Store)
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleTestSlip}
                disabled={testingPrinter}
                className="flex-1 bg-blue-600 py-3 rounded-xl items-center flex-row justify-center shadow-sm"
              >
                {testingPrinter ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="print" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold ml-1.5">
                      Send Test Print Slip
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowBtGuide(false);
                  if (onNavigateTab) onNavigateTab("settings");
                }}
                className="flex-1 bg-gray-100 py-3 rounded-xl items-center flex-row justify-center border border-gray-200"
              >
                <Ionicons name="settings-outline" size={16} color="#374151" />
                <Text className="text-gray-800 text-xs font-bold ml-1.5">
                  Printer Settings
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowBtGuide(false)}
              className="mt-3 py-2 items-center"
            >
              <Text className="text-gray-500 font-bold text-xs">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

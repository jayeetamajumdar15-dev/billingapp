import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { buildUpiPaymentUrl, getUpiQrImageUrl } from "../utils/qrCodeGenerator";

export default function DynamicUpiQrModal({
  visible,
  onClose,
  upiId,
  storeName = "Bistromate",
  amount = 0,
  invoiceNumber = "",
  tableName = "",
  onMarkPaid,
}) {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const cleanUpi = (upiId || "").trim();
  const grandTotal = Number(amount || 0);

  const upiUrl = buildUpiPaymentUrl({
    upiId: cleanUpi,
    storeName,
    amount: grandTotal,
    invoiceNumber,
  });

  const qrImageUrl = getUpiQrImageUrl(upiUrl, 280);

  const handleCopyUpi = () => {
    if (!cleanUpi) return;
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cleanUpi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      Alert.alert("Store UPI ID", cleanUpi);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl items-center border border-slate-100">
          {/* Header */}
          <View className="w-full flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-2">
                <Ionicons name="qr-code" size={18} color="#2563EB" />
              </View>
              <Text className="text-base font-black text-slate-900 tracking-tight">
                Dynamic UPI Payment
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Amount Badge */}
          <View className="w-full bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 items-center mb-4">
            <Text className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-0.5">
              {tableName ? `Table ${tableName} • ` : ""}Exact Bill Amount
            </Text>
            <Text className="text-3xl font-black text-blue-900">
              ₹{grandTotal.toFixed(2)}
            </Text>
            <Text className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)
            </Text>
          </View>

          {/* Dynamic QR Box */}
          <View className="w-64 h-64 bg-white border-2 border-slate-900/10 rounded-2xl items-center justify-center p-2 mb-3 shadow-inner">
            {cleanUpi && qrImageUrl ? (
              <>
                <Image
                  source={{ uri: qrImageUrl }}
                  style={{ width: 236, height: 236, borderRadius: 12 }}
                  resizeMode="contain"
                  onLoadEnd={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <View className="absolute inset-0 items-center justify-center bg-white/90 rounded-2xl">
                    <ActivityIndicator size="small" color="#2563EB" />
                  </View>
                )}
              </>
            ) : (
              <View className="items-center px-4">
                <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#DC2626" />
                <Text className="text-xs font-bold text-red-600 text-center mt-2">
                  Store UPI ID Not Configured
                </Text>
                <Text className="text-[11px] text-slate-400 text-center mt-1">
                  Add your UPI ID in Settings to enable dynamic payment QR codes.
                </Text>
              </View>
            )}
          </View>

          {/* UPI ID Pill */}
          {cleanUpi ? (
            <TouchableOpacity
              onPress={handleCopyUpi}
              className="flex-row items-center bg-slate-100 px-3.5 py-1.5 rounded-full mb-4 active:bg-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-700 mr-1.5">
                UPI: <Text className="font-bold">{cleanUpi}</Text>
              </Text>
              <Ionicons
                name={copied ? "checkmark-circle" : "copy-outline"}
                size={14}
                color={copied ? "#059669" : "#64748B"}
              />
            </TouchableOpacity>
          ) : null}

          {/* Action Buttons */}
          <View className="w-full flex-row gap-2.5">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
            >
              <Text className="text-slate-700 font-bold text-sm">Close</Text>
            </TouchableOpacity>

            {onMarkPaid ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onMarkPaid();
                }}
                className="flex-1 py-3 bg-emerald-600 rounded-xl items-center flex-row justify-center shadow-sm active:bg-emerald-700"
              >
                <Ionicons name="checkmark-done" size={17} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text className="text-white font-bold text-sm">Mark Paid</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}


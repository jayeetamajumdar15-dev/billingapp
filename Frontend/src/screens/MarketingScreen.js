import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { api } from "../config/api";
import { shareCataloguePdf, CATALOGUE_STYLES } from "../utils/cataloguePdfGenerator";

const MARKETING_TEMPLATES = [
  {
    id: "weekend_sale",
    title: "🎉 Weekend Mega Discount",
    tag: "Sale / Offer",
    message: "Special Weekend Offer from {STORE}! Enjoy flat 15% OFF on all your favorite items this Saturday & Sunday. Visit us today or reply to this message to place your order! 🛍️✨",
  },
  {
    id: "new_arrivals",
    title: "🌟 New Arrivals & Fresh Stock",
    tag: "Fresh Stock",
    message: "Exciting news from {STORE}! Our newest collection and fresh items have just arrived. Drop by to explore or message us on WhatsApp for fast home delivery! 🚀",
  },
  {
    id: "vip_loyalty",
    title: "👑 Exclusive VIP Member Reward",
    tag: "VIP Club",
    message: "Dear Valued Customer, as a thank you for your continued loyalty with {STORE}, we have an exclusive complimentary perk waiting for you on your next visit! Show this message at the counter to redeem. 🎁",
  },
  {
    id: "festive_greeting",
    title: "🪔 Festive Greetings & Special Deals",
    tag: "Festival",
    message: "Warm wishes for the festive season from {STORE}! Celebrate with your loved ones and make every moment sweet with our festive specials and discounts. Available now! 🪔🎉",
  },
  {
    id: "we_miss_you",
    title: "❤️ We Miss You - Welcome Back Gift",
    tag: "Win-back",
    message: "It has been a while since we saw you at {STORE}! We would love to welcome you back with a special 10% discount on your next purchase. Simply show this text at checkout! 😊",
  },
  {
    id: "quick_order",
    title: "📱 1-Tap WhatsApp Ordering",
    tag: "Delivery",
    message: "Need quick delivery from {STORE}? Save our number and order anytime directly on WhatsApp for fast, convenient doorstep delivery! Reply with 'MENU' to get started. 🛵📦",
  },
];

export default function MarketingScreen({ user, onOpenDrawer, onBack }) {
  const [catalogues, setCatalogues] = useState([]);
  const [selectedCatStyle, setSelectedCatStyle] = useState("modern_minimal");
  const [generatingCatalogue, setGeneratingCatalogue] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [customBroadcastMsg, setCustomBroadcastMsg] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState("all");
  const [broadcasting, setBroadcasting] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [flyerTableNum, setFlyerTableNum] = useState("Table 1");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    setLoadingItems(true);
    try {
      const res = await api.items.getAll();
      if (res && res.success) {
        setCatalogues(res.items || []);
      }
    } catch {} finally {
      setLoadingItems(false);
    }
  };

  const handlePullRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMenuItems();
    } catch {}
    setRefreshing(false);
  };

  const handleBroadcastToAllParties = async () => {
    if (!customBroadcastMsg.trim()) {
      Alert.alert("Empty Message", "Please type your message in the broadcast box before sending.");
      return;
    }
    setBroadcasting(true);
    try {
      const res = await api.parties.broadcastOffer({
        targetAudience: broadcastAudience,
        customMessage: customBroadcastMsg.trim(),
      });
      if (res && res.success) {
        Alert.alert(
          "Broadcast Dispatched 🎉",
          res.message || `Message broadcast successfully to ${res.total || 0} customers!`
        );
        setCustomBroadcastMsg("");
      } else {
        Alert.alert("Broadcast Notice", res?.message || "Failed to broadcast message to all parties.");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to broadcast message");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleShareCatalogue = async () => {
    if (!catalogues || catalogues.length === 0) {
      Alert.alert("Catalogue Empty", "No items found in your inventory. Add items first to generate catalogue.");
      return;
    }
    setGeneratingCatalogue(true);
    try {
      const storeData = {
        businessName: user?.businessName || "My Store",
        phone: user?.phone || "7003317615",
        address: user?.address || "",
        logo: user?.logo || "",
        email: user?.email || "",
      };
      const res = await shareCataloguePdf(catalogues, storeData, selectedCatStyle);
      if (res && !res.success) {
        Alert.alert("Catalogue Notice", res.error || "Could not launch PDF share");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to generate catalogue");
    } finally {
      setGeneratingCatalogue(false);
    }
  };

  const handleShareCampaign = (template) => {
    const storeName = user?.businessName || "Our Store";
    const text = template.message.replace(/\{STORE\}/g, storeName);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined" && window.open) {
      window.open(waUrl, "_blank");
    } else {
      require("react-native").Linking.openURL(waUrl);
    }
  };

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-gray-50">
      <View className="bg-blue-600 px-4 pt-10 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onOpenDrawer} className="mr-2 p-1">
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                className="flex-row items-center bg-white/20 px-2.5 py-1 rounded-lg mr-2"
              >
                <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold ml-1">Back</Text>
              </TouchableOpacity>
            ) : null}
            <View>
              <Text className="text-white text-xl font-bold">Marketing & Growth</Text>
              <Text className="text-blue-100 text-[11px]">
                WhatsApp Broadcasts, PDF Catalogues & Flyers
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 120, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
            tintColor="#2563EB"
            colors={["#2563EB"]}
          />
        }
      >
        <View className="bg-white rounded-2xl p-4 mb-4 border border-blue-200 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Broadcast WhatsApp Message to All Customers
              </Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                Send custom announcements, new offers, or greetings to all customer numbers
              </Text>
            </View>
            <View className="bg-blue-100 px-2.5 py-0.5 rounded-full">
              <Text className="text-[10px] text-blue-700 font-bold">Bulk WhatsApp</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-xs font-bold text-gray-700 mr-1">Target Audience:</Text>
            <TouchableOpacity
              onPress={() => setBroadcastAudience("all")}
              className={`px-3 py-1.5 rounded-full border ${
                broadcastAudience === "all"
                  ? "bg-blue-600 border-blue-600"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  broadcastAudience === "all" ? "text-white" : "text-gray-700"
                }`}
              >
                All Customers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBroadcastAudience("vips")}
              className={`px-3 py-1.5 rounded-full border ${
                broadcastAudience === "vips"
                  ? "bg-amber-500 border-amber-500"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  broadcastAudience === "vips" ? "text-white" : "text-gray-700"
                }`}
              >
                VIP Members Only
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-bold text-gray-700 mb-1">Message Text:</Text>
          <TextInput
            multiline
            numberOfLines={4}
            className="bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-800 mb-3"
            style={{ minHeight: 90, textAlignVertical: "top" }}
            placeholder="Type your message here... e.g. Special treat for our customers! Enjoy flat 10% off today only."
            value={customBroadcastMsg}
            onChangeText={setCustomBroadcastMsg}
          />

          <TouchableOpacity
            onPress={handleBroadcastToAllParties}
            disabled={broadcasting}
            className={`w-full py-3.5 rounded-xl flex-row items-center justify-center shadow-xs ${
              broadcasting ? "bg-gray-400" : "bg-blue-600 active:bg-blue-700"
            }`}
          >
            {broadcasting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FontAwesome name="whatsapp" size={17} color="#FFFFFF" />
                <Text className="text-white font-bold text-xs ml-2">
                  Send Message to All {broadcastAudience === "vips" ? "VIP Customers" : "Parties"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Store Catalogue PDF ({CATALOGUE_STYLES.length} Visual Styles)
              </Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                Generate and share professional product brochures on WhatsApp
              </Text>
            </View>
            <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Text className="text-[10px] text-emerald-700 font-bold">{CATALOGUE_STYLES.length} Themes</Text>
            </View>
          </View>

          <Text className="text-xs font-bold text-gray-700 mb-2">
            Choose Catalogue Theme:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mb-3"
          >
            {CATALOGUE_STYLES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCatStyle(cat.id)}
                style={{
                  width: 145,
                  borderColor: selectedCatStyle === cat.id ? cat.color : "#E5E7EB",
                  borderWidth: selectedCatStyle === cat.id ? 2 : 1,
                }}
                className={`p-3 rounded-xl mr-2.5 ${
                  selectedCatStyle === cat.id ? "bg-white shadow-xs" : "bg-gray-50"
                }`}
              >
                <View
                  style={{ backgroundColor: cat.color }}
                  className="w-full h-2 rounded-full mb-2"
                />
                <Text className="text-xs font-bold text-gray-900 mb-0.5" numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text className="text-[10px] text-gray-500 mb-2" numberOfLines={2}>
                  {cat.description}
                </Text>
                <View className="bg-gray-200/80 px-1.5 py-0.5 rounded self-start">
                  <Text className="text-[9px] font-bold text-gray-700">{cat.badge}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="cube-outline" size={18} color="#4B5563" />
              <Text className="text-xs font-bold text-gray-700 ml-2">
                Items in Catalogue: {catalogues.length} products
              </Text>
            </View>
            <TouchableOpacity
              onPress={loadMenuItems}
              disabled={loadingItems}
              className="bg-gray-200 px-2.5 py-1 rounded-lg"
            >
              <Text className="text-[11px] font-bold text-gray-700">Refresh Items</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleShareCatalogue}
            disabled={generatingCatalogue}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-3.5 rounded-xl flex-row items-center justify-center shadow-xs"
          >
            {generatingCatalogue ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FontAwesome name="whatsapp" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-xs ml-2">
                  Generate & Share Catalogue PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Ready-to-Send Marketing Messages
            </Text>
            <View className="bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              <Text className="text-[10px] text-purple-700 font-bold">1-Tap WhatsApp</Text>
            </View>
          </View>
          <Text className="text-xs text-gray-500 mb-3">
            Pre-composed marketing campaigns to re-engage customers and drive store sales.
          </Text>

          <View className="gap-2.5">
            {MARKETING_TEMPLATES.map((tmpl) => (
              <View
                key={tmpl.id}
                className="p-3 rounded-xl bg-gray-50 border border-gray-200"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-bold text-gray-800">{tmpl.title}</Text>
                  <View className="bg-purple-100 px-2 py-0.5 rounded">
                    <Text className="text-[9.5px] font-bold text-purple-700">{tmpl.tag}</Text>
                  </View>
                </View>
                <Text className="text-[11.5px] text-gray-600 leading-4 mb-2.5">
                  {tmpl.message.replace(/\{STORE\}/g, user?.businessName || "Our Store")}
                </Text>
                <TouchableOpacity
                  onPress={() => handleShareCampaign(tmpl)}
                  className="bg-emerald-600 py-1.5 px-3 rounded-lg self-start flex-row items-center"
                >
                  <FontAwesome name="whatsapp" size={13} color="#FFFFFF" />
                  <Text className="text-white text-[11px] font-bold ml-1.5">
                    Share on WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Counter & Table QR Flyer
              </Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                Printable standee flyer with your store's WhatsApp QR
              </Text>
            </View>
            <View className="bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Text className="text-[10px] text-amber-700 font-bold">Printable Standee</Text>
            </View>
          </View>

          <Text className="text-xs text-gray-600 mb-3">
            Place this flyer on your billing counter or dining tables. Customers can scan with their camera to get the digital menu and place instant orders directly on WhatsApp!
          </Text>

          <TouchableOpacity
            onPress={() => setShowFlyerModal(true)}
            className="bg-amber-500 hover:bg-amber-600 py-3 rounded-xl flex-row items-center justify-center shadow-xs"
          >
            <Ionicons name="qr-code-outline" size={17} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs ml-2">Preview Store QR Standee</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showFlyerModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 16 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, width: "100%", maxWidth: 360, padding: 20, alignItems: "center" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Counter / Table Standee</Text>
              <TouchableOpacity onPress={() => setShowFlyerModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={{ width: "100%", borderWidth: 2, borderColor: "#2563EB", borderRadius: 16, padding: 16, alignItems: "center", backgroundColor: "#EFF6FF" }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1E3A8A", textTransform: "uppercase", letterSpacing: 1 }}>
                {user?.businessName || "OUR STORE"}
              </Text>
              <Text style={{ fontSize: 11, color: "#3B82F6", fontWeight: "600", marginTop: 2 }}>
                Scan to Order on WhatsApp
              </Text>

              <View style={{ width: 140, height: 140, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 8, marginVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#BFDBFE" }}>
                <FontAwesome5 name="qrcode" size={110} color="#1E3A8A" />
              </View>

              <View style={{ backgroundColor: "#2563EB", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 8 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>{flyerTableNum}</Text>
              </View>

              <Text style={{ fontSize: 11, color: "#4B5563", textAlign: "center" }}>
                Point camera at QR code ➔ Open WhatsApp ➔ Send 'Hi' to start!
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 14, width: "100%" }}>
              {["Table 1", "Counter", "Delivery"].map((lbl) => (
                <TouchableOpacity
                  key={lbl}
                  onPress={() => setFlyerTableNum(lbl)}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    alignItems: "center",
                    backgroundColor: flyerTableNum === lbl ? "#2563EB" : "#F3F4F6",
                    borderColor: flyerTableNum === lbl ? "#2563EB" : "#E5E7EB",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: flyerTableNum === lbl ? "#FFFFFF" : "#4B5563" }}>
                    {lbl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowFlyerModal(false);
                Alert.alert("Print Standee", "Use browser or mobile screenshot to print this counter QR standee card.");
              }}
              style={{ width: "100%", backgroundColor: "#2563EB", paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 14 }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13 }}>Print Standee</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

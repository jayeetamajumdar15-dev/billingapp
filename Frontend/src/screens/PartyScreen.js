import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { api } from "../config/api";

export default function PartyScreen({ onOpenDrawer, onBack }) {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [bulkSending, setBulkSending] = useState(false);

  const [perksModalVisible, setPerksModalVisible] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [formIsRegular, setFormIsRegular] = useState(false);
  const [formDiscount, setFormDiscount] = useState("0");
  const [formFreebie, setFormFreebie] = useState("");

  // Special Offers & Occasions broadcast state
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerCategory, setOfferCategory] = useState("puja"); // "puja" | "weekend" | "occasion" | "custom"
  const [offerAudience, setOfferAudience] = useState("all"); // "all" | "vips"
  const [offerTitle, setOfferTitle] = useState("Durga Puja & Festive Dhamaka 🪔");
  const [offerDiscount, setOfferDiscount] = useState("15");
  const [offerFreebie, setOfferFreebie] = useState("Special Sweet Treat");
  const [offerValidity, setOfferValidity] = useState("This Festive Week");
  const [offerCustomMsg, setOfferCustomMsg] = useState("");
  const [broadcastingOffer, setBroadcastingOffer] = useState(false);

  const handleSelectOfferPreset = (cat) => {
    setOfferCategory(cat);
    if (cat === "puja") {
      setOfferTitle("Durga Puja & Festive Dhamaka 🪔");
      setOfferDiscount("15");
      setOfferFreebie("Special Sweet Treat");
      setOfferValidity("This Festive Week");
      setOfferCustomMsg("");
    } else if (cat === "weekend") {
      setOfferTitle("Weekend Bonanza 🎉");
      setOfferDiscount("20");
      setOfferFreebie("Free Beverage");
      setOfferValidity("This Weekend");
      setOfferCustomMsg("");
    } else if (cat === "occasion") {
      setOfferTitle("Celebration Special Treat 🌟");
      setOfferDiscount("10");
      setOfferFreebie("Special Gift");
      setOfferValidity("Next 7 Days");
      setOfferCustomMsg("");
    } else {
      setOfferTitle("Customized Special Offer 🎁");
      setOfferDiscount("");
      setOfferFreebie("");
      setOfferValidity("");
      setOfferCustomMsg("");
    }
  };

  const loadParties = useCallback(async () => {
    setLoading(true);
    let query = search ? `search=${encodeURIComponent(search)}` : "";
    if (filterType === "vip") {
      query += `${query ? "&" : ""}isRegular=true`;
    } else if (filterType === "customer" || filterType === "supplier") {
      query += `${query ? "&" : ""}type=${filterType}`;
    }
    const res = await api.parties.getAll(query);
    setLoading(false);
    if (res.success && res.parties) setParties(res.parties);
  }, [search, filterType]);

  useEffect(() => {
    loadParties();
  }, [filterType]);

  const handleSavePerks = async () => {
    if (!selectedParty) return;
    const res = await api.parties.updateRegularPerks(selectedParty._id, {
      isRegular: formIsRegular,
      customDiscountPercent: Number(formDiscount) || 0,
      assignedFreebie: formFreebie.trim(),
    });
    if (res.success) {
      setPerksModalVisible(false);
      loadParties();
      Alert.alert("Saved", "Customer perks updated");
    } else {
      Alert.alert("Error", res.message || "Failed to update perks");
    }
  };

  const openWhatsAppOffer = async (party) => {
    const res = await api.parties.getWhatsAppOffer(party._id);
    if (res.success && res.whatsappUrl) {
      Linking.openURL(res.whatsappUrl);
    } else {
      const phone = party.whatsappNumber || party.phone;
      Linking.openURL(`https://wa.me/91${phone}`);
    }
  };

  const handleBulkVipOffer = async () => {
    const vips = parties.filter((p) => p.isRegular);
    if (!vips.length) {
      Alert.alert("No VIPs", "No VIP customers found.");
      return;
    }
    Alert.alert(
      "Notify All VIPs",
      `Send WhatsApp offer to ${vips.length} VIP customer(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send All",
          onPress: async () => {
            setBulkSending(true);
            const res = await api.parties.sendBulkVipOffer();
            setBulkSending(false);
            if (res.success && res.vips && res.vips.length > 0) {
              for (const vip of res.vips) {
                await Linking.openURL(vip.whatsappUrl);
                await new Promise((r) => setTimeout(r, 800));
              }
              Alert.alert("Done", `WhatsApp opened for ${res.vips.length} VIP(s).`);
            } else {
              Alert.alert("No Results", res.message || "No VIP offers to send.");
            }
          },
        },
      ]
    );
  };

  const handleBroadcastOffer = async () => {
    setBroadcastingOffer(true);
    try {
      const payload = {
        targetAudience: offerAudience,
        offerCategory,
        offerTitle,
        discountPercent: Number(offerDiscount) || 0,
        freebieItem: offerFreebie.trim(),
        validUntil: offerValidity.trim(),
        customMessage: offerCustomMsg.trim(),
      };
      const res = await api.parties.broadcastOffer(payload);
      if (res.success) {
        setOfferModalVisible(false);
        Alert.alert(
          "Broadcast Successful 🎉",
          res.message || `Special offer prepared for ${res.total || 0} customer(s)!`
        );
      } else {
        Alert.alert("Broadcast Notice", res.message || "Failed to broadcast offer.");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to broadcast offer.");
    } finally {
      setBroadcastingOffer(false);
    }
  };

  const openPerksDialog = (party) => {
    setSelectedParty(party);
    setFormIsRegular(party.isRegular);
    setFormDiscount((party.customDiscountPercent || 0).toString());
    setFormFreebie(party.assignedFreebie || "");
    setPerksModalVisible(true);
  };

  const vipCount = parties.filter((p) => p.isRegular).length;

  const visitLabel = (count) => {
    if (!count || count === 0) return "New Customer";
    if (count === 1) return "1 visit";
    return `${count} visits`;
  };

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-gray-50">
      <View className="bg-blue-600 px-4 pt-10 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onOpenDrawer} className="mr-2">
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
              <Text className="text-white text-xl font-bold">Customers</Text>
              <Text className="text-blue-200 text-[11px]">
                {parties.length} total · {vipCount} VIP
              </Text>
            </View>
          </View>
          {vipCount > 0 ? (
            <TouchableOpacity
              onPress={handleBulkVipOffer}
              disabled={bulkSending}
              className="bg-amber-400 px-3 py-1.5 rounded-lg flex-row items-center"
            >
              {bulkSending ? (
                <ActivityIndicator size="small" color="#78350f" />
              ) : (
                <>
                  <FontAwesome name="whatsapp" size={14} color="#78350f" />
                  <Text className="text-amber-900 font-bold text-xs ml-1">
                    Notify {vipCount} VIPs
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ─── FESTIVE & SPECIAL OCCASION OFFERS BUTTON ─── */}
        <TouchableOpacity
          onPress={() => {
            handleSelectOfferPreset("puja");
            setOfferModalVisible(true);
          }}
          className="bg-amber-500 rounded-xl p-2.5 mb-3 flex-row items-center justify-between border border-amber-300 shadow-sm"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <Text className="text-xl mr-2">🪔</Text>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-white font-black text-xs">
                  Puja & Special Offers
                </Text>
                <View className="bg-amber-800/40 px-1.5 py-0.2 rounded ml-1.5">
                  <Text className="text-[9px] text-amber-100 font-bold uppercase">All Customers</Text>
                </View>
              </View>
              <Text className="text-amber-100 text-[10px] font-medium">
                Send Puja, festive & custom offers to all customers
              </Text>
            </View>
          </View>
          <View className="bg-white px-2.5 py-1.5 rounded-lg flex-row items-center">
            <FontAwesome name="whatsapp" size={12} color="#B45309" />
            <Text className="text-amber-800 font-bold text-[10px] ml-1">Send Deals ➔</Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row bg-white rounded-xl px-3 py-2 items-center">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-800"
            placeholder="Search by name or phone..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadParties}
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(""); loadParties(); }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View className="flex-row bg-white border-b border-gray-200 px-2 py-2">
        {[
          { key: "all", label: "All" },
          { key: "vip", label: "VIP" },
          { key: "customer", label: "Customers" },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setFilterType(t.key)}
            className={`px-3 py-1.5 rounded-full mr-2 ${
              filterType === t.key ? "bg-blue-600" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                filterType === t.key ? "text-white" : "text-gray-600"
              }`}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <Text className="text-[11px] text-blue-700 font-medium">
          Customers are added automatically when you bill with their phone number.
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={parties}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <MaterialIcons name="people-outline" size={52} color="#9CA3AF" />
              <Text className="text-gray-500 font-semibold text-sm mt-3">
                No customers yet
              </Text>
              <Text className="text-gray-400 text-xs mt-1 text-center px-8">
                Create a bill with a customer phone number and they will appear here automatically.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200 shadow-sm">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center flex-wrap mb-1" style={{ gap: 6 }}>
                    <Text className="text-base font-extrabold text-gray-900">
                      {item.name}
                    </Text>
                    {item.isRegular ? (
                      <View className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                        <Text className="text-amber-800 text-[10px] font-bold">VIP</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text className="text-xs text-gray-500 mb-2">{item.phone}</Text>

                  <View className="flex-row flex-wrap mb-2" style={{ gap: 6 }}>
                    <View className="bg-gray-100 rounded-lg px-2.5 py-1">
                      <Text className="text-xs font-extrabold text-blue-700">
                        {visitLabel(item.visitCount)}
                      </Text>
                    </View>
                    {item.totalSpent > 0 ? (
                      <View className="bg-gray-100 rounded-lg px-2.5 py-1">
                        <Text className="text-xs font-extrabold text-emerald-700">
                          Rs. {item.totalSpent} spent
                        </Text>
                      </View>
                    ) : null}
                    {item.lastVisitDate ? (
                      <View className="bg-gray-100 rounded-lg px-2.5 py-1">
                        <Text className="text-[10px] font-bold text-gray-500">
                          Last: {new Date(item.lastVisitDate).toLocaleDateString()}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {item.isRegular && (item.customDiscountPercent > 0 || item.assignedFreebie) ? (
                    <View className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
                      {item.customDiscountPercent > 0 ? (
                        <Text className="text-amber-900 text-xs font-bold">
                          {item.customDiscountPercent}% discount on every bill
                        </Text>
                      ) : null}
                      {item.assignedFreebie ? (
                        <Text className="text-amber-800 text-xs mt-0.5">
                          Free gift: {item.assignedFreebie}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {!item.isRegular && item.visitCount >= 3 ? (
                    <View className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                      <Text className="text-blue-800 text-xs font-bold">
                        {item.visitCount >= 5
                          ? "Auto-promoted to VIP!"
                          : `${5 - item.visitCount} more visits to become VIP`}
                      </Text>
                    </View>
                  ) : null}

                  <TouchableOpacity onPress={() => openPerksDialog(item)}>
                    <Text className="text-xs font-bold text-blue-600">
                      {item.isRegular ? "Edit VIP Perks" : "Mark as VIP / Set Perks"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => openWhatsAppOffer(item)}
                  activeOpacity={0.8}
                  className="w-12 h-12 rounded-full bg-emerald-500 items-center justify-center"
                >
                  <FontAwesome name="whatsapp" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={perksModalVisible} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-2xl p-6 shadow-xl">
            <Text className="text-base font-bold text-gray-900 mb-1">
              {selectedParty?.isRegular ? "VIP Customer Perks" : "Set VIP Status"}
            </Text>
            <Text className="text-xs text-gray-500 mb-1">{selectedParty?.name}</Text>
            <Text className="text-[11px] text-gray-400 mb-4">
              {visitLabel(selectedParty?.visitCount)} · Rs. {selectedParty?.totalSpent || 0} total spent
            </Text>

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm font-bold text-gray-800">VIP Customer Status</Text>
              <Switch
                value={formIsRegular}
                onValueChange={setFormIsRegular}
                trackColor={{ false: "#D1D5DB", true: "#2563EB" }}
              />
            </View>

            {formIsRegular ? (
              <>
                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">
                    Custom Discount % (auto-applied on bills)
                  </Text>
                  <TextInput
                    className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                    placeholder="e.g. 10"
                    keyboardType="numeric"
                    value={formDiscount}
                    onChangeText={setFormDiscount}
                  />
                </View>
                <View className="mb-5">
                  <Text className="text-xs font-bold text-gray-700 mb-1">
                    Free Gift Item (given on each visit)
                  </Text>
                  <TextInput
                    className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                    placeholder="e.g. Cold Drink 250ml / Free Sample"
                    value={formFreebie}
                    onChangeText={setFormFreebie}
                  />
                </View>
              </>
            ) : (
              <View className="mb-5" />
            )}

            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setPerksModalVisible(false)}
                className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-bold text-xs">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePerks}
                className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-xs">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── SPECIAL FESTIVE & OCCASION OFFERS BROADCAST MODAL ─── */}
      <Modal
        visible={offerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[90%] p-5">
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center mr-2">
                  <Text className="text-base">🪔</Text>
                </View>
                <View>
                  <Text className="text-base font-extrabold text-gray-900">
                    Special & Festive Offers
                  </Text>
                  <Text className="text-[11px] text-gray-500">
                    Broadcast promotional offers directly to customers via WhatsApp
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setOfferModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="py-3" showsVerticalScrollIndicator={false}>
              {/* Audience Selector */}
              <Text className="text-xs font-bold text-gray-700 mb-1.5">
                Target Audience:
              </Text>
              <View className="flex-row bg-gray-100 p-1 rounded-xl mb-3.5 border border-gray-200">
                <TouchableOpacity
                  onPress={() => setOfferAudience("all")}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    offerAudience === "all" ? "bg-white shadow-xs border border-gray-200" : "bg-transparent"
                  }`}
                >
                  <Text className={`text-xs font-bold ${offerAudience === "all" ? "text-blue-700" : "text-gray-600"}`}>
                    👥 All Customers ({parties.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setOfferAudience("vips")}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    offerAudience === "vips" ? "bg-white shadow-xs border border-gray-200" : "bg-transparent"
                  }`}
                >
                  <Text className={`text-xs font-bold ${offerAudience === "vips" ? "text-amber-700" : "text-gray-600"}`}>
                    ⭐ VIP Regulars Only ({vipCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Offer Preset Tabs */}
              <Text className="text-xs font-bold text-gray-700 mb-1.5">
                Choose Occasion / Offer Theme:
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-3.5">
                {[
                  { key: "puja", label: "🪔 Puja Offer" },
                  { key: "weekend", label: "🎉 Weekend Deal" },
                  { key: "occasion", label: "🌟 Celebration" },
                  { key: "custom", label: "✍️ Custom Offer" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => handleSelectOfferPreset(item.key)}
                    className={`px-3 py-2 rounded-xl border flex-row items-center ${
                      offerCategory === item.key
                        ? "bg-amber-50 border-amber-500"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        offerCategory === item.key ? "text-amber-900" : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Offer Details Form */}
              <View className="mb-2.5">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Offer Title / Occasion:
                </Text>
                <TextInput
                  value={offerTitle}
                  onChangeText={setOfferTitle}
                  placeholder="e.g. Durga Puja Special Offer 🪔"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900"
                />
              </View>

              <View className="flex-row gap-2 mb-2.5">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-700 mb-1">
                    Discount %:
                  </Text>
                  <TextInput
                    value={offerDiscount}
                    onChangeText={setOfferDiscount}
                    keyboardType="numeric"
                    placeholder="e.g. 15"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-700 mb-1">
                    Freebie / Perk:
                  </Text>
                  <TextInput
                    value={offerFreebie}
                    onChangeText={setOfferFreebie}
                    placeholder="e.g. Free Sweet Treat"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900"
                  />
                </View>
              </View>

              <View className="mb-2.5">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Offer Validity:
                </Text>
                <TextInput
                  value={offerValidity}
                  onChangeText={setOfferValidity}
                  placeholder="e.g. Valid This Festive Week"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900"
                />
              </View>

              {offerCategory === "custom" ? (
                <View className="mb-2.5">
                  <Text className="text-xs font-bold text-gray-700 mb-1">
                    Custom Message Text:
                  </Text>
                  <TextInput
                    value={offerCustomMsg}
                    onChangeText={setOfferCustomMsg}
                    multiline={true}
                    numberOfLines={3}
                    placeholder="Type your customized message here..."
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  />
                </View>
              ) : null}

              {/* Live Preview Card */}
              <View className="mt-2 mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                <View className="flex-row items-center mb-1">
                  <FontAwesome name="whatsapp" size={14} color="#059669" />
                  <Text className="text-emerald-800 text-[11px] font-bold ml-1.5">
                    WhatsApp Message Preview:
                  </Text>
                </View>
                <Text className="text-[11px] text-gray-700 font-mono leading-relaxed bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  {offerCategory === "puja"
                    ? `🪔 DURGA PUJA & FESTIVE SPECIAL OFFER 🪔\n\nDear Customer,\n\nCelebrate this festive season with us!\n\n✨ Special Festive Offer:\nEnjoy exclusive ${offerDiscount ? offerDiscount + "% FESTIVE DISCOUNT" : "festive treats"}${offerFreebie ? " + complimentary " + offerFreebie + " on us! 🎁" : "! 🪔"}\n${offerValidity ? "📅 Valid: " + offerValidity + "\n\n" : "\n"}Reply to this message to order directly on WhatsApp! 🙏`
                    : offerCategory === "weekend"
                    ? `🎉 WEEKEND SPECIAL DHAMAKA 🎉\n\nDear Customer,\n\nMake your weekend special!\n\n🔥 Weekend Offer: ${offerDiscount ? "flat " + offerDiscount + "% OFF" : "special treats"}${offerFreebie ? "\n🎁 Free Treat: " + offerFreebie : ""}\n${offerValidity ? "📅 Valid: " + offerValidity + "\n\n" : "\n"}Reply to this message now to book your order!`
                    : `🌟 ${offerTitle.toUpperCase()} 🌟\n\nDear Customer,\n\nSpecial celebration reward just for you!\n${offerDiscount ? "🎁 Special Discount: " + offerDiscount + "% OFF\n" : ""}${offerFreebie ? "🍰 Complimentary Gift: " + offerFreebie + "\n" : ""}${offerValidity ? "📅 Valid: " + offerValidity + "\n\n" : "\n"}Show this message at counter to claim your offer!`}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleBroadcastOffer}
              disabled={broadcastingOffer}
              className="w-full bg-emerald-600 py-3.5 rounded-2xl flex-row items-center justify-center shadow-md active:bg-emerald-700"
            >
              {broadcastingOffer ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <FontAwesome name="whatsapp" size={18} color="#FFFFFF" />
                  <Text className="text-white font-extrabold text-sm ml-2">
                    Send WhatsApp Offer ({offerAudience === "all" ? "All Customers" : "VIPs"}) 🚀
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

import React, { useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLocale, LANGUAGES, CURRENCIES } from "../context/LocaleContext";

export default function LanguageCurrencyScreen() {
    const router = useRouter();
    const {
        language, currency, exchangeRates,
        ratesLoading, setLanguage, setCurrency, formatPrice,
    } = useLocale();

    const [savingLang, setSavingLang] = useState(false);
    const [savingCurr, setSavingCurr] = useState(false);

    const handleLanguage = async (code: string) => {
        if (code === language) return;
        setSavingLang(true);
        await setLanguage(code);
        setSavingLang(false);
        Alert.alert("Language updated", `App language set to ${LANGUAGES.find(l => l.code === code)?.name}.`);
    };

    const handleCurrency = async (code: string) => {
        if (code === currency) return;
        setSavingCurr(true);
        await setCurrency(code);
        setSavingCurr(false);
    };

    return (
        <SafeAreaView style={lcStyles.safe} edges={["top"]}>
            <View style={lcStyles.header}>
                <TouchableOpacity style={lcStyles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={lcStyles.headerTitle}>Language & Currency</Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

                {/* ── Language ── */}
                <View style={lcStyles.sectionHeader}>
                    <Ionicons name="language-outline" size={18} color="#f97316" />
                    <Text style={lcStyles.sectionTitle}>Language</Text>
                    {savingLang && <ActivityIndicator size="small" color="#f97316" style={{ marginLeft: "auto" }} />}
                </View>
                <Text style={lcStyles.sectionNote}>
                    Controls the display language across the app.
                </Text>

                <View style={lcStyles.card}>
                    {LANGUAGES.map((lang, i) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={[
                                lcStyles.row,
                                i < LANGUAGES.length - 1 && lcStyles.rowBorder,
                                language === lang.code && lcStyles.rowActive,
                            ]}
                            onPress={() => handleLanguage(lang.code)}
                        >
                            <Text style={lcStyles.rowFlag}>{lang.flag}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={lcStyles.rowLabel}>{lang.name}</Text>
                                <Text style={lcStyles.rowSub}>{lang.nativeName}</Text>
                            </View>
                            {language === lang.code && (
                                <View style={lcStyles.checkCircle}>
                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Currency ── */}
                <View style={[lcStyles.sectionHeader, { marginTop: 24 }]}>
                    <Ionicons name="cash-outline" size={18} color="#f97316" />
                    <Text style={lcStyles.sectionTitle}>Currency</Text>
                    {(savingCurr || ratesLoading) && (
                        <ActivityIndicator size="small" color="#f97316" style={{ marginLeft: "auto" }} />
                    )}
                </View>
                <Text style={lcStyles.sectionNote}>
                    Prices are converted live from GHS using current exchange rates.
                </Text>

                <View style={lcStyles.card}>
                    {CURRENCIES.map((curr, i) => {
                        const rate = exchangeRates[curr.code];
                        const exampleConverted = curr.code === "GHS"
                            ? "GH₵100.00"
                            : rate
                                ? `${curr.symbol}${(100 * rate).toFixed(2)}`
                                : "...";

                        return (
                            <TouchableOpacity
                                key={curr.code}
                                style={[
                                    lcStyles.row,
                                    i < CURRENCIES.length - 1 && lcStyles.rowBorder,
                                    currency === curr.code && lcStyles.rowActive,
                                ]}
                                onPress={() => handleCurrency(curr.code)}
                            >
                                <Text style={lcStyles.rowFlag}>{curr.flag}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={lcStyles.rowLabel}>{curr.name}</Text>
                                    <Text style={lcStyles.rowSub}>{curr.code} · {curr.symbol}</Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={lcStyles.rateExample}>{exampleConverted}</Text>
                                    <Text style={lcStyles.rateLabel}>per GH₵100</Text>
                                </View>
                                {currency === curr.code && (
                                    <View style={[lcStyles.checkCircle, { marginLeft: 10 }]}>
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Live rate info */}
                {currency !== "GHS" && (
                    <View style={lcStyles.rateInfoCard}>
                        <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
                        <Text style={lcStyles.rateInfoText}>
                            Live rate: GH₵1 = {CURRENCIES.find(c => c.code === currency)?.symbol}
                            {exchangeRates[currency]?.toFixed(4) ?? "..."}{" "}
                            · Rates via Frankfurter API
                        </Text>
                    </View>
                )}

                {/* Preview */}
                <View style={lcStyles.previewCard}>
                    <Text style={lcStyles.previewLabel}>Price Preview</Text>
                    <View style={lcStyles.previewRow}>
                        {[50, 199, 450, 1200].map(price => (
                            <View key={price} style={lcStyles.previewItem}>
                                <Text style={lcStyles.previewPrice}>{formatPrice(price)}</Text>
                                <Text style={lcStyles.previewOriginal}>GH₵{price}</Text>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const lcStyles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f9fafb" },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb", gap: 12 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
    sectionNote: { fontSize: 12, color: "#9ca3af", marginBottom: 12, lineHeight: 18 },
    card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f3f4f6", overflow: "hidden", marginBottom: 8 },
    row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6" },
    rowActive: { backgroundColor: "#fff7ed" },
    rowFlag: { fontSize: 24 },
    rowLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
    rowSub: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
    checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
    rateExample: { fontSize: 13, fontWeight: "700", color: "#111827" },
    rateLabel: { fontSize: 10, color: "#9ca3af" },
    rateInfoCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#eff6ff", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#bfdbfe" },
    rateInfoText: { flex: 1, fontSize: 12, color: "#2563eb", lineHeight: 18 },
    previewCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f3f4f6" },
    previewLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
    previewRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    previewItem: { flex: 1, minWidth: "40%", backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, alignItems: "center" },
    previewPrice: { fontSize: 15, fontWeight: "800", color: "#f97316" },
    previewOriginal: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
});
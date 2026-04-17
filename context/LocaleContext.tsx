import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

// ── Supported languages ───────────────────────────────────────────────────────
export type Language = {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
};

export const LANGUAGES: Language[] = [
    { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
    { code: "tw", name: "Twi", nativeName: "Twi", flag: "🇬🇭" },
    { code: "ga", name: "Ga", nativeName: "Ga", flag: "🇬🇭" },
    { code: "ee", name: "Ewe", nativeName: "Eʋegbe", flag: "🇬🇭" },
    { code: "ha", name: "Hausa", nativeName: "Hausa", flag: "🇬🇭" },
    { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
];

// ── Supported currencies ──────────────────────────────────────────────────────
export type Currency = {
    code: string;
    name: string;
    symbol: string;
    flag: string;
};

export const CURRENCIES: Currency[] = [
    { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", flag: "🇬🇭" },
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
];

// ── Basic translations ────────────────────────────────────────────────────────
type TranslationKey =
    | "home" | "search" | "cart" | "orders" | "account"
    | "add_to_cart" | "buy_now" | "checkout" | "total"
    | "delivery" | "in_stock" | "out_of_stock"
    | "sign_in" | "sign_out" | "welcome_back"
    | "my_orders" | "my_addresses" | "payment_methods"
    | "settings" | "language" | "currency" | "save" | "cancel";

type Translations = Record<TranslationKey, string>;

const TRANSLATIONS: Record<string, Translations> = {
    en: {
        home: "Home", search: "Search", cart: "Cart",
        orders: "Orders", account: "Account",
        add_to_cart: "Add to Cart", buy_now: "Buy Now",
        checkout: "Checkout", total: "Total",
        delivery: "Delivery", in_stock: "In Stock", out_of_stock: "Out of Stock",
        sign_in: "Sign In", sign_out: "Sign Out", welcome_back: "Welcome back",
        my_orders: "My Orders", my_addresses: "My Addresses",
        payment_methods: "Payment Methods", settings: "Settings",
        language: "Language", currency: "Currency", save: "Save", cancel: "Cancel",
    },
    tw: {
        home: "Fie", search: "Hwehwɛ", cart: "Basket",
        orders: "Adefoo", account: "Account",
        add_to_cart: "Fa to Basket mu", buy_now: "Tɔ seesei",
        checkout: "Tua ka", total: "Nyinaa",
        delivery: "Brɛ aba", in_stock: "Wɔ hɔ", out_of_stock: "Nni hɔ",
        sign_in: "Wo kra", sign_out: "Pue", welcome_back: "Akwaaba",
        my_orders: "Me Adefoo", my_addresses: "Me Beae",
        payment_methods: "Tua Ka Kwan", settings: "Nhyehyɛe",
        language: "Kasa", currency: "Sika", save: "Sie", cancel: "Gyae",
    },
    fr: {
        home: "Accueil", search: "Rechercher", cart: "Panier",
        orders: "Commandes", account: "Compte",
        add_to_cart: "Ajouter au panier", buy_now: "Acheter",
        checkout: "Passer commande", total: "Total",
        delivery: "Livraison", in_stock: "En stock", out_of_stock: "Rupture",
        sign_in: "Se connecter", sign_out: "Se déconnecter", welcome_back: "Bon retour",
        my_orders: "Mes commandes", my_addresses: "Mes adresses",
        payment_methods: "Paiements", settings: "Paramètres",
        language: "Langue", currency: "Devise", save: "Enregistrer", cancel: "Annuler",
    },
    ga: {
        home: "Fie", search: "Lɛ", cart: "Basket",
        orders: "Shishie", account: "Account",
        add_to_cart: "Kɛ basket mu", buy_now: "Lɛ sane",
        checkout: "Tua fees", total: "Gbɛkɛ",
        delivery: "Bɛ aba", in_stock: "Bii le", out_of_stock: "Bii tee le",
        sign_in: "Tswa", sign_out: "Ba", welcome_back: "Ojekoo",
        my_orders: "Mii Shishie", my_addresses: "Mii Akutso",
        payment_methods: "Tua Kwan", settings: "Nhyehyɛe",
        language: "Wɔlɔmɔ", currency: "Sika", save: "Kɛ sie", cancel: "Bɔ",
    },
    ee: {
        home: "Ƒe", search: "Dii", cart: "Basket",
        orders: "Dɔwɔwɔ", account: "Account",
        add_to_cart: "Tsɔ de basket me", buy_now: "Xɔ fifia",
        checkout: "Xɔ", total: "Kpekpeɖeŋu",
        delivery: "Xu aƒe", in_stock: "Le eme", out_of_stock: "Mele eme o",
        sign_in: "Ɖe ŋkume", sign_out: "Tso ŋkume", welcome_back: "Woezooo",
        my_orders: "Nye Dɔwɔwɔ", my_addresses: "Nye Xɔdzodzowo",
        payment_methods: "Xɔ Kwan", settings: "Dɔwɔwɔ",
        language: "Gbe", currency: "Ga", save: "Dzra", cancel: "Tó",
    },
    ha: {
        home: "Gida", search: "Nema", cart: "Kwano",
        orders: "Odar", account: "Asusu",
        add_to_cart: "Zuba kwano", buy_now: "Saya yanzu",
        checkout: "Biya", total: "Jimla",
        delivery: "Isar kaya", in_stock: "Akwai", out_of_stock: "Babu",
        sign_in: "Shiga", sign_out: "Fita", welcome_back: "Barka da dawo",
        my_orders: "Odarina", my_addresses: "Adiroshina",
        payment_methods: "Hanyar Biya", settings: "Saituna",
        language: "Harshe", currency: "Kuɗi", save: "Ajiye", cancel: "Soke",
    },
};

// ── Context ───────────────────────────────────────────────────────────────────
type LocaleContextType = {
    language: string;
    currency: string;
    exchangeRates: Record<string, number>;
    ratesLoading: boolean;
    setLanguage: (code: string) => Promise<void>;
    setCurrency: (code: string) => Promise<void>;
    t: (key: TranslationKey) => string;
    formatPrice: (amountInGHS: number) => string;
    convertPrice: (amountInGHS: number) => number;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const [language, setLanguageState] = useState("en");
    const [currency, setCurrencyState] = useState("GHS");
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ GHS: 1 });
    const [ratesLoading, setRatesLoading] = useState(false);

    // Load saved prefs on mount
    useEffect(() => {
        (async () => {
            const [savedLang, savedCurr] = await Promise.all([
                AsyncStorage.getItem("app_language"),
                AsyncStorage.getItem("app_currency"),
            ]);
            if (savedLang) setLanguageState(savedLang);
            if (savedCurr) {
                setCurrencyState(savedCurr);
                fetchRates(savedCurr);
            }
        })();
    }, []);

    // Sync from profile when it loads
    useEffect(() => {
        if (profile?.language) setLanguageState(profile.language);
        if (profile?.currency) {
            setCurrencyState(profile.currency);
            fetchRates(profile.currency);
        }
    }, [profile?.language, profile?.currency]);

    // Fetch live exchange rates from GHS base
    const fetchRates = useCallback(async (targetCurrency: string) => {
        if (targetCurrency === "GHS") {
            setExchangeRates({ GHS: 1 });
            return;
        }
        setRatesLoading(true);
        try {
            // Free tier — no key needed, 1500 req/month
            const res = await fetch(
                `https://api.frankfurter.app/latest?from=GHS&to=${targetCurrency}`
            );
            const data = await res.json();
            if (data.rates) {
                setExchangeRates({ GHS: 1, ...data.rates });
            }
        } catch {
            // Fallback static rates if API fails
            const fallback: Record<string, number> = {
                USD: 0.067, EUR: 0.062, GBP: 0.053,
                NGN: 102.5, KES: 8.9,
            };
            setExchangeRates({ GHS: 1, [targetCurrency]: fallback[targetCurrency] ?? 1 });
        } finally {
            setRatesLoading(false);
        }
    }, []);

    const setLanguage = async (code: string) => {
        setLanguageState(code);
        await AsyncStorage.setItem("app_language", code);
        if (user?.id) {
            await supabase.from("profiles").update({ language: code }).eq("id", user.id);
        }
    };

    const setCurrency = async (code: string) => {
        setCurrencyState(code);
        await AsyncStorage.setItem("app_currency", code);
        await fetchRates(code);
        if (user?.id) {
            await supabase.from("profiles").update({ currency: code }).eq("id", user.id);
        }
    };

    // Translate a key
    const t = (key: TranslationKey): string => {
        return TRANSLATIONS[language]?.[key] ?? TRANSLATIONS["en"][key] ?? key;
    };

    // Convert GHS amount to selected currency
    const convertPrice = (amountInGHS: number): number => {
        const rate = exchangeRates[currency] ?? 1;
        return amountInGHS * rate;
    };

    // Format with symbol
    const formatPrice = (amountInGHS: number): string => {
        const curr = CURRENCIES.find(c => c.code === currency);
        const converted = convertPrice(amountInGHS);
        const formatted = converted.toLocaleString("en-GH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${curr?.symbol ?? "GH₵"}${formatted}`;
    };

    return (
        <LocaleContext.Provider value={{
            language, currency, exchangeRates, ratesLoading,
            setLanguage, setCurrency, t, formatPrice, convertPrice,
        }}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale() {
    const ctx = useContext(LocaleContext);
    if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
    return ctx;
}
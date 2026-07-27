import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ProductsProvider } from "../context/ProductsContext";
import { OrdersProvider } from "../context/OrdersContext";
import { WishlistProvider } from "../context/WishlistContext";
import { LocaleProvider } from "../context/LocaleContext";
import SplashScreen from "../components/SplashScreen";

// ── Auth guard ────────────────────────────────────────────────────────────────
function AuthGuard() {
  const { session, loading, isGuest } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";
    const authenticated = session || isGuest;

    if (!authenticated && !inAuth && !inOnboarding) {
      router.replace("/auth");
    } else if (authenticated && (inAuth || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments, isGuest]);

  return null;
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <AuthProvider>
      <ProductsProvider>
        <OrdersProvider>
          <WishlistProvider>
            <CartProvider>
              <LocaleProvider>
                <AuthGuard />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="onboarding/onboarding" />
                  <Stack.Screen name="auth/index" options={{ animation: "slide_from_bottom" }} />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="product/[id]" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="checkout/index" options={{ animation: "slide_from_bottom" }} />
                  <Stack.Screen name="order/[id]" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="search/index" options={{ animation: "fade" }} />
                  <Stack.Screen name="notifications/index" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="wishlist/index" options={{ animation: "slide_from_right" }} />
                </Stack>
                {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
              </LocaleProvider>
            </CartProvider>
          </WishlistProvider>
        </OrdersProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
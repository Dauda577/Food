// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { ThemeProvider } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";
import { COLORS } from "../../constants/colors";

// ── Cart icon with badge ──────────────────────────────────────────────────────
function CartIcon({ color, focused }: { color: string; focused: boolean }) {
  const { itemCount } = useCart();
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <Ionicons
        name={focused ? "bag" : "bag-outline"}
        color={color}
        size={focused ? 25 : 23}
      />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount > 9 ? "9+" : itemCount}</Text>
        </View>
      )}
    </View>
  );
}

// ── Tab icon wrapper — adds active dot indicator ──────────────────────────────
function TabIcon({
  name,
  focusedName,
  color,
  focused,
  size = 23,
}: {
  name: any;
  focusedName: any;
  color: string;
  focused: boolean;
  size?: number;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? focusedName : name}
        color={color}
        size={focused ? size + 2 : size}
      />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  return (
    <ThemeProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: "#9ca3af",
          // Hide tab bar on desktop
          tabBarStyle: isDesktop ? { display: "none" } : styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="home-outline"
                focusedName="home"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="compass-outline"
                focusedName="compass"
                color={color}
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="wishlist"
          options={{
            title: "Wishlist",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="heart-outline"
                focusedName="heart"
                color={color}
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="mycart"
          options={{
            title: "Cart",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconWrap}>
                <CartIcon color={color} focused={focused} />
                {focused && <View style={styles.dot} />}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Account",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="person-outline"
                focusedName="person"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 85 : 65,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
  },
  tabItem: {
    paddingTop: 6,
    paddingBottom: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 0,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 1,
  },
  // Cart badge
  badge: {
    position: "absolute",
    top: -3,
    right: -7,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 7.5,
    fontWeight: "800",
    lineHeight: 10,
  },
});
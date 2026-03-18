import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Platform } from "react-native";
import { ThemeProvider } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";

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
  name, focusedName, color, focused, size = 23,
}: {
  name: any; focusedName: any; color: string; focused: boolean; size?: number;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={focused ? focusedName : name} color={color} size={focused ? size + 2 : size} />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <ThemeProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#f97316",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="home-outline" focusedName="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="compass-outline" focusedName="compass" color={color} focused={focused} />
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
              <TabIcon name="person-outline" focusedName="person" color={color} focused={focused} />
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
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderTopWidth: 0,
    // Shadow iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    // Shadow Android
    elevation: 12,
    paddingBottom: 0,
    paddingTop: 0,
  },
  tabItem: {
    paddingTop: 10,
    paddingBottom: 8,
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
    backgroundColor: "#f97316",
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
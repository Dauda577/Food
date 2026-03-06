import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemeProvider } from "../../context/ThemeContext";

export default function TabsLayout() {
  return (
    <ThemeProvider>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f97316",
          },
          headerTitleStyle: {
            color: "#fff",
            fontSize: 20,
            fontWeight: "bold",
          },
          headerTintColor: "#fff",

          tabBarActiveTintColor: "#f97316",
          tabBarInactiveTintColor: "#9CA3AF",

          tabBarStyle: {
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            height: 70,
            borderRadius: 30,
            backgroundColor: "#fff",
            elevation: 6,

            shadowColor: "#000",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.1,
            shadowRadius: 8,

            paddingBottom: 10,
            paddingTop: 8,
          },

          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                color={color}
                size={focused ? 26 : 24}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="categories"
          options={{
            title: "Categories",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "grid" : "grid-outline"}
                color={color}
                size={focused ? 26 : 24}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="mycart"
          options={{
            title: "My Cart",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                color={color}
                size={focused ? 26 : 24}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                color={color}
                size={focused ? 26 : 24}
              />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
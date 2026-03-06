import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";


export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#f97316',
        height: 120,
        paddingVertical: 12, 
      },
      tabBarActiveTintColor: '#f97316', 
      tabBarInactiveTintColor: '#9CA3AF', 
      tabBarStyle: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        elevation: 5,
        backgroundColor: 'white', 
        borderRadius: 30, 
        height: 70,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        paddingBottom: 10,
        paddingTop: 8,
      },
     tabBarItemStyle: {
          paddingVertical: 5,
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
          title: "",
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="person-circle-outline" size={28} color="white" />
              </TouchableOpacity>

              <View style={styles.searchWrapper}>
                <Ionicons name="search" size={18} color="gray" />
                <TextInput
                  placeholder="Search meals..."
                  placeholderTextColor="gray"
                  style={styles.searchInput}
                />
              </View>

              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={focused ? 26 : 24}
            />
          ),
        }}
      />

      {/* Categories Tab - Inactive (Grey) */}
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

      {/* Profile Tab - Inactive (Grey) */}
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
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  iconButton: {
    padding: 4,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 35,
    marginHorizontal: 8,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: "black",
  },
});
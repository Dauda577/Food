import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Search } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { ThemeProvider } from '../../context/ThemeContext';

export default function TabsLayout() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  
  const filters = ["All", "Popular", "New", "Offers"];

  return (
    <ThemeProvider>
      <Tabs screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#f97316',
          height: 120,
        },
        headerTitleStyle: {
          color: 'white',
          fontSize: 20,
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#f97316', 
        tabBarInactiveTintColor: '#9CA3AF', 
        tabBarStyle: {
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
      }}>
        
        {/* Home Tab */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
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
        
        {/* Categories Tab - With Search and Filters in Header */}
        <Tabs.Screen
          name="categories"
          options={{
            title: "Categories",
            // Custom header that includes search and filters (this overrides everything)
            header: ({ navigation, route }) => (
              <View style={{ backgroundColor: '#f97316', paddingTop: 50 }}>
                {/* Title row */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingBottom: 12,
                }}>
                  <TouchableOpacity style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                  }}>
                    <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
                  </TouchableOpacity>
                  
                  <Text style={{ 
                    fontSize: 22, 
                    fontWeight: "800", 
                    color: "#fff", 
                    letterSpacing: -0.5 
                  }}>
                    Categories
                  </Text>
                  
                  <View style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                  }}>
                    <Text style={{ color: "#f97316", fontSize: 13, fontWeight: "700" }}>10</Text>
                  </View>
                </View>

                {/* Search Bar */}
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  marginHorizontal: 16,
                  marginBottom: 12,
                  paddingHorizontal: 14,
                  height: 48,
                  gap: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <Search size={16} color="#aaa" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      // Update params to pass to Categories screen
                      navigation.setParams({ 
                        searchQuery: text,
                        activeFilter: activeFilter 
                      });
                    }}
                    placeholder="Search categories..."
                    placeholderTextColor="#bbb"
                    style={{ flex: 1, fontSize: 14, color: "#1a1a2e" }}
                  />
                </View>

                {/* Filter Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ paddingLeft: 16 }}
                  contentContainerStyle={{ paddingRight: 20, paddingBottom: 12 }}
                >
                  {filters.map((f) => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => {
                        setActiveFilter(f);
                        // Update params to pass to Categories screen
                        navigation.setParams({ 
                          searchQuery: searchQuery,
                          activeFilter: f 
                        });
                      }}
                      style={[{
                        paddingHorizontal: 18,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: "#fff",
                        marginRight: 8,
                        borderWidth: 1.5,
                        borderColor: "#eee",
                      }, activeFilter === f && {
                        backgroundColor: "#FF6B35",
                        borderColor: "#FF6B35"
                      }]}
                    >
                      <Text style={[{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#888",
                      }, activeFilter === f && {
                        color: "#fff"
                      }]}>
                        {f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "grid" : "grid-outline"} 
                color={color} 
                size={focused ? 26 : 24} 
              />
            ),
          }}
        />

        {/* My Cart Tab */}
        <Tabs.Screen
          name="mycart"
          options={{
            title: "My Cart",
            headerStyle: {
              backgroundColor: '#f97316',
            },
            headerTitleStyle: {
              color: 'white',
            },
            headerTintColor: 'white',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "cart" : "cart-outline"} 
                color={color} 
                size={focused ? 26 : 24} 
              />
            ),
          }}
        />

        {/* Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerStyle: {
              backgroundColor: '#f97316',
            },
            headerTitleStyle: {
              color: 'white',
            },
            headerTintColor: 'white',
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
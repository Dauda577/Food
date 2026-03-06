import {
  StyleSheet, Text, View, Image, ScrollView,
  TouchableOpacity, Switch,
} from "react-native";
import React, { useState } from "react";
import {
  ArrowLeft, User, Bell, Heart, ShoppingBag, CreditCard,
  MapPin, HelpCircle, LogOut, ChevronRight, Star,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../../context/ThemeContext';

const profile = () => {
  const { darkMode, setDarkMode, theme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const menuItems = [
    { id: 1, icon: ShoppingBag, label: "My Orders", badge: 3 },
    { id: 2, icon: Heart, label: "Favorites", badge: 12 },
    { id: 3, icon: CreditCard, label: "Payment Methods" },
    { id: 4, icon: MapPin, label: "Addresses" },
    { id: 5, icon: Star, label: "Rate & Review" },
    { id: 6, icon: Bell, label: "Notifications" },
    { id: 7, icon: HelpCircle, label: "Help & Support" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.cardBackground }]}>
            <ArrowLeft size={20} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── User Info ── */}
        <View style={[styles.userCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.userLeft}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80" }}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.userName, { color: theme.textColor }]}>John Doe</Text>
              <Text style={[styles.userEmail, { color: theme.subTextColor }]}>john.doe@email.com</Text>
              <Text style={[styles.userPhone, { color: theme.subTextColor }]}>+233 24 123 4567</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statNumber, { color: theme.accentColor }]}>24</Text>
            <Text style={[styles.statLabel, { color: theme.subTextColor }]}>Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statNumber, { color: theme.accentColor }]}>156</Text>
            <Text style={[styles.statLabel, { color: theme.subTextColor }]}>Points</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statNumber, { color: theme.accentColor }]}>4.8</Text>
            <Text style={[styles.statLabel, { color: theme.subTextColor }]}>Rating</Text>
          </View>
        </View>

        {/* ── Menu Items ── */}
        <View style={[styles.menuSection, { backgroundColor: theme.cardBackground }]}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.menuItem, { borderBottomColor: theme.borderColor }]}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconWrap, { backgroundColor: theme.accentColor + '15' }]}>
                  <item.icon size={18} color={theme.accentColor} />
                </View>
                <Text style={[styles.menuLabel, { color: theme.textColor }]}>{item.label}</Text>
              </View>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <ChevronRight size={16} color={theme.subTextColor} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Settings ── */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Settings</Text>

          <View style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.accentColor + '15' }]}>
                <Bell size={18} color={theme.accentColor} />
              </View>
              <Text style={[styles.settingLabel, { color: theme.textColor }]}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#ddd", true: theme.accentColor }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.accentColor + '15' }]}>
                <Text style={{ fontSize: 18 }}>🌙</Text>
              </View>
              <Text style={[styles.settingLabel, { color: theme.textColor }]}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={(value) => setDarkMode(value)}
              trackColor={{ false: "#ddd", true: theme.accentColor }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.cardBackground }]}>
          <LogOut size={18} color="#E63946" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scroll: { paddingBottom: 20 },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1a1a2e", letterSpacing: -0.5 },

  // ── User Info ──
  userCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", marginHorizontal: 20, marginBottom: 20,
    borderRadius: 18, padding: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  userLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 14 },
  userName: { fontSize: 18, fontWeight: "800", color: "#1a1a2e", marginBottom: 2 },
  userEmail: { fontSize: 13, color: "#888", marginBottom: 1 },
  userPhone: { fontSize: 13, color: "#888" },
  editBtn: {
    backgroundColor: "#FF6B35", borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  editText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // ── Stats ──
  statsRow: {
    flexDirection: "row", justifyContent: "space-around",
    marginHorizontal: 20, marginBottom: 24,
  },
  statCard: {
    alignItems: "center", backgroundColor: "#fff",
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
    minWidth: 80,
  },
  statNumber: { fontSize: 20, fontWeight: "800", color: "#FF6B35", marginBottom: 2 },
  statLabel: { fontSize: 12, color: "#888", fontWeight: "600" },

  // ── Menu ──
  menuSection: {
    backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#f5f5f5",
  },
  menuLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#FFF3EE", alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#1a1a2e" },
  badge: {
    backgroundColor: "#FF6B35", borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // ── Settings ──
  settingsSection: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 16, fontWeight: "800", color: "#1a1a2e",
    letterSpacing: -0.3, marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: "600", color: "#1a1a2e", marginLeft: 12 },

  // ── Logout ──
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 14,
    paddingVertical: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#E63946", marginLeft: 8 },
});
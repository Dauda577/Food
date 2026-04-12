import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, TextInput, StatusBar, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase"; // 👈 adjust if needed

const { width } = Dimensions.get("window");
const SW = 88;
const PW = width - SW;
const TILE = (PW - 40) / 3;
const TAB_BAR_HEIGHT = 65;

// ── Types ─────────────────────────────────────────────────────────────────────

type LeafCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
};

type GroupCategory = {
  id: string;
  name: string;
  slug: string;
  leaves: LeafCategory[];
};

type ParentCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SidebarSkeleton = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <View key={i} style={sk.sideItem}>
        <View style={sk.sideIcon} />
        <View style={sk.sideLabel} />
      </View>
    ))}
  </>
);

const PanelSkeleton = () => (
  <View style={{ padding: 16, gap: 20 }}>
    {[6, 3, 3].map((count, si) => (
      <View key={si} style={{ gap: 12 }}>
        <View style={sk.secTitle} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {Array.from({ length: count }).map((_, ti) => (
            <View key={ti} style={{ width: TILE, alignItems: "center" }}>
              <View style={sk.tileImg} />
              <View style={sk.tileName} />
            </View>
          ))}
        </View>
      </View>
    ))}
  </View>
);

// ── Tile ──────────────────────────────────────────────────────────────────────

const Tile = ({
  item,
  onPress,
}: {
  item: LeafCategory;
  onPress: (item: LeafCategory) => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const press = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.tile, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPressIn={() => press(0.95)}
        onPressOut={() => press(1)}
        onPress={() => onPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.tileImgWrap}>
          {item.image ? (
            <>
              <Image
                source={{ uri: item.image }}
                style={styles.tileImg}
                resizeMode="cover"
              />
              <View style={styles.tileOverlay} />
            </>
          ) : (
            <View style={styles.tilePlaceholder}>
              <Ionicons name="grid-outline" size={28} color="#f97316" />
            </View>
          )}
        </View>
        <Text style={styles.tileName} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Section ───────────────────────────────────────────────────────────────────

const Section = ({
  group,
  isLast,
  onTilePress,
  onViewAll,
}: {
  group: GroupCategory;
  isLast: boolean;
  onTilePress: (item: LeafCategory) => void;
  onViewAll: (group: GroupCategory) => void;
}) => (
  <View style={[styles.section, !isLast && styles.sectionDivider]}>
    <View style={styles.secHeader}>
      <View style={styles.secTitleRow}>
        <View style={styles.secTitleBar} />
        <Text style={styles.secTitle}>{group.name}</Text>
      </View>
      <TouchableOpacity
        style={styles.secViewAllBtn}
        onPress={() => onViewAll(group)}
      >
        <Text style={styles.secViewAllText}>View All</Text>
        <Ionicons name="arrow-forward" size={12} color="#f97316" />
      </TouchableOpacity>
    </View>

    <View style={styles.grid}>
      {group.leaves.map((leaf) => (
        <Tile key={leaf.id} item={leaf} onPress={onTilePress} />
      ))}
    </View>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CategoriesScreen() {
  const router = useRouter();
  const panelRef = useRef<ScrollView>(null);

  const [parents, setParents] = useState<ParentCategory[]>([]);
  const [groups, setGroups] = useState<GroupCategory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingParents, setLoadingParents] = useState(true);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── 1. Load sidebar parents ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingParents(true);
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .is("parent_id", null)
        .order("name");

      if (error) {
        setError("Could not load categories.");
      } else if (data?.length) {
        setParents(data);
        setSelectedId(data[0].id);
      }
      setLoadingParents(false);
    };
    load();
  }, []);

  // ── 2. Load groups + leaves when parent changes ───────────────────────────
  useEffect(() => {
    if (!selectedId) return;

    const load = async () => {
      setLoadingPanel(true);
      setGroups([]);
      setError(null);

      // Fetch level-2 groups whose parent = selectedId
      const { data: groupData, error: groupErr } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("parent_id", selectedId)
        .order("name");

      if (groupErr || !groupData) {
        setError("Could not load sub-categories.");
        setLoadingPanel(false);
        return;
      }

      if (groupData.length === 0) {
        setGroups([]);
        setLoadingPanel(false);
        return;
      }

      // Fetch all level-3 leaves in one shot
      const groupIds = groupData.map((g) => g.id);
      const { data: leafData, error: leafErr } = await supabase
        .from("categories")
        .select("id, name, slug, image, icon, parent_id")
        .in("parent_id", groupIds)
        .order("name");

      if (leafErr || !leafData) {
        setError("Could not load sub-categories.");
        setLoadingPanel(false);
        return;
      }

      // Stitch groups + leaves together client-side
      const assembled: GroupCategory[] = groupData.map((g) => ({
        ...g,
        leaves: leafData.filter((l) => l.parent_id === g.id),
      }));

      setGroups(assembled);
      setLoadingPanel(false);
    };

    load();
  }, [selectedId]);

  // ── Sidebar change ────────────────────────────────────────────────────────
  const handleParentChange = useCallback((id: string) => {
    setSelectedId(id);
    setSearchQuery("");
    panelRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  // ── Search — filters leaf names across all groups ─────────────────────────
  const filteredGroups = searchQuery.trim()
    ? groups
      .map((g) => ({
        ...g,
        leaves: g.leaves.filter((l) =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((g) => g.leaves.length > 0)
    : groups;

  // ── Navigation helpers ────────────────────────────────────────────────────
  const handleLeafPress = useCallback(
    (leaf: LeafCategory) => {
      router.push({
        pathname: "/products",
        params: { categoryId: leaf.id, categoryName: leaf.name },
      });
    },
    [router]
  );

  const handleViewAll = useCallback(
    (group: GroupCategory) => {
      router.push({
        pathname: "/products",
        params: { categoryId: group.id, categoryName: group.name },
      });
    },
    [router]
  );

  const selectedParent = parents.find((p) => p.id === selectedId);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="heart-outline" size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color="#f97316" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={40} color="#f97316" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => setSelectedId((id) => id)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.body}>
          {/* ── Sidebar ── */}
          <View style={styles.sidebar}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8, paddingBottom: TAB_BAR_HEIGHT + 20 }}
            >
              {loadingParents ? (
                <SidebarSkeleton />
              ) : (
                parents.map((cat) => {
                  const active = selectedId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.sideItem, active && styles.sideItemActive]}
                      onPress={() => handleParentChange(cat.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.sideIconWrap, active && styles.sideIconWrapActive]}>
                        <Ionicons
                          name={(cat.icon ?? "grid-outline") as any}
                          size={22}
                          color={active ? "#f97316" : "#64748b"}
                        />
                      </View>
                      <Text
                        style={[styles.sideLabel, active && styles.sideLabelActive]}
                        numberOfLines={2}
                      >
                        {cat.name}
                      </Text>
                      {active && <View style={styles.sideActiveBar} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* ── Right Panel ── */}
          <ScrollView
            ref={panelRef}
            style={styles.panel}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
          >
            {/* Featured Banner */}
            <TouchableOpacity style={styles.featuredBanner} activeOpacity={0.9}>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTag}>HOT DEALS</Text>
                <Text style={styles.featuredTitle}>Up to 70% Off</Text>
                <Text style={styles.featuredSubtitle}>on selected items</Text>
                <View style={styles.featuredBtn}>
                  <Text style={styles.featuredBtnText}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </View>
              <View style={{ opacity: 0.8 }}>
                <Ionicons name="pricetag" size={48} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Parent header row */}
            {selectedParent && (
              <TouchableOpacity
                style={styles.seeAllRow}
                onPress={() =>
                  router.push({
                    pathname: "/products",
                    params: { categoryId: selectedParent.id, categoryName: selectedParent.name },
                  })
                }
              >
                <Text style={styles.seeAllLabel}>{selectedParent.name}</Text>
                <View style={styles.seeAllArrow}>
                  <Text style={styles.seeAllText}>See All Products</Text>
                  <Ionicons name="arrow-forward" size={14} color="#f97316" />
                </View>
              </TouchableOpacity>
            )}

            {/* Sections */}
            {loadingPanel ? (
              <PanelSkeleton />
            ) : filteredGroups.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="folder-open-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>
                  {searchQuery ? "No results found" : "No sub-categories yet"}
                </Text>
              </View>
            ) : (
              filteredGroups.map((group, idx) => (
                <Section
                  key={group.id}
                  group={group}
                  isLast={idx === filteredGroups.length - 1}
                  onTilePress={handleLeafPress}
                  onViewAll={handleViewAll}
                />
              ))
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a", letterSpacing: -0.5 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#f8fafc",
    alignItems: "center", justifyContent: "center",
  },

  searchContainer: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f8fafc", paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a", padding: 0 },
  filterBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: "#f8fafc",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },

  body: { flex: 1, flexDirection: "row" },

  sidebar: {
    width: SW, backgroundColor: "#f8fafc",
    borderRightWidth: 1, borderRightColor: "#e2e8f0",
  },
  sideItem: {
    alignItems: "center", paddingVertical: 16, paddingHorizontal: 8, position: "relative",
  },
  sideItemActive: { backgroundColor: "#fff" },
  sideIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  sideIconWrapActive: { backgroundColor: "#fff7ed" },
  sideLabel: { fontSize: 11, color: "#64748b", textAlign: "center", fontWeight: "500", lineHeight: 14 },
  sideLabelActive: { color: "#f97316", fontWeight: "700" },
  sideActiveBar: {
    position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
    backgroundColor: "#f97316", borderTopRightRadius: 3, borderBottomRightRadius: 3,
  },

  panel: { flex: 1, backgroundColor: "#fff" },

  featuredBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#667eea",
    marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    padding: 20, borderRadius: 20, overflow: "hidden",
  },
  featuredContent: { flex: 1, gap: 6 },
  featuredTag: { fontSize: 11, fontWeight: "800", color: "#ffd700", letterSpacing: 1 },
  featuredTitle: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  featuredSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.9)" },
  featuredBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, alignSelf: "flex-start",
  },
  featuredBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  seeAllRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  seeAllLabel: { fontSize: 16, fontWeight: "700", color: "#0f172a", letterSpacing: -0.3 },
  seeAllArrow: { flexDirection: "row", alignItems: "center", gap: 6 },
  seeAllText: { fontSize: 13, fontWeight: "600", color: "#f97316" },

  section: { paddingVertical: 4 },
  sectionDivider: { borderBottomWidth: 8, borderBottomColor: "#f8fafc", marginBottom: 4 },
  secHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  secTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  secTitleBar: { width: 3, height: 16, backgroundColor: "#f97316", borderRadius: 2 },
  secTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", letterSpacing: -0.3 },
  secViewAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  secViewAllText: { fontSize: 12, fontWeight: "600", color: "#f97316" },

  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  tile: { width: TILE, alignItems: "center" },
  tileImgWrap: {
    width: TILE - 12, height: TILE - 12, borderRadius: 16, overflow: "hidden",
    backgroundColor: "#f8fafc", marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tileImg: { width: "100%", height: "100%" },
  tileOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  tilePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff7ed" },
  tileName: { fontSize: 11, color: "#334155", textAlign: "center", lineHeight: 15, fontWeight: "500", paddingHorizontal: 4 },

  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 14, color: "#64748b", textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#f97316", borderRadius: 12 },
  retryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: "#94a3b8" },
});

const sk = StyleSheet.create({
  sideItem: { alignItems: "center", paddingVertical: 16, gap: 8 },
  sideIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#e2e8f0" },
  sideLabel: { width: 52, height: 10, borderRadius: 4, backgroundColor: "#e2e8f0" },
  tileImg: { width: TILE - 12, height: TILE - 12, borderRadius: 16, backgroundColor: "#e2e8f0", marginBottom: 8 },
  tileName: { width: TILE - 20, height: 10, borderRadius: 4, backgroundColor: "#e2e8f0" },
  secTitle: { width: 120, height: 14, borderRadius: 4, backgroundColor: "#e2e8f0", marginBottom: 4, marginLeft: 16 },
});
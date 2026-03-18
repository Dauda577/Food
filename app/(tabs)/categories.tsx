import React, { useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, TextInput, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const SW = 72;           // sidebar width — locked
const PW = width - SW;   // panel width
const TILE = (PW - 32) / 3; // 3 tiles per row with padding

// ── Data ──────────────────────────────────────────────────────────────────────

const MAINS = [
  { id: "grocery",     label: "Grocery" },
  { id: "phones",      label: "Phones &\nTablets" },
  { id: "health",      label: "Health &\nBeauty" },
  { id: "home",        label: "Home &\nLiving" },
  { id: "electronics", label: "Electronics" },
  { id: "computing",   label: "Computing" },
  { id: "fashion",     label: "Fashion" },
  { id: "sports",      label: "Sports &\nFitness" },
  { id: "baby",        label: "Baby &\nKids" },
  { id: "gaming",      label: "Gaming" },
  { id: "auto",        label: "Auto &\nMotors" },
  { id: "books",       label: "Books &\nMedia" },
];

type Sub  = { id: string; name: string; image: string };
type Sec  = { title: string; items: Sub[] };

const DATA: Record<string, Sec[]> = {
  grocery: [
    { title: "Food Cupboard", items: [
      { id: "g1",  name: "Cooking\nIngredients", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300" },
      { id: "g2",  name: "Snacks &\nCrackers",   image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300" },
      { id: "g3",  name: "Pasta &\nNoodles",     image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300" },
      { id: "g4",  name: "Canned\nGoods",        image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300" },
      { id: "g5",  name: "Crisps &\nChips",      image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300" },
      { id: "g6",  name: "Grains &\nRice",       image: "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef1d?w=300" },
    ]},
    { title: "Cooking & Baking", items: [
      { id: "g7",  name: "Flours &\nMeals",      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300" },
      { id: "g8",  name: "Sugars &\nSyrups",     image: "https://images.unsplash.com/photo-1601390284862-06ec24fa4090?w=300" },
      { id: "g9",  name: "Cooking\nOils",        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300" },
    ]},
    { title: "Morning Favourites", items: [
      { id: "g10", name: "Dairy &\nEggs",        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300" },
      { id: "g11", name: "Cereals &\nOats",      image: "https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=300" },
      { id: "g12", name: "Jams &\nSpreads",      image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300" },
    ]},
    { title: "Beverages", items: [
      { id: "g13", name: "Juices &\nDrinks",     image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300" },
      { id: "g14", name: "Tea &\nCoffee",        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300" },
      { id: "g15", name: "Soft\nDrinks",         image: "https://images.unsplash.com/photo-1561758033-48d52648ae8b?w=300" },
    ]},
  ],
  phones: [
    { title: "Smartphones", items: [
      { id: "p1",  name: "Apple\niPhone",        image: "https://images.unsplash.com/photo-1697565975749-4d4948a3b37e?w=300" },
      { id: "p2",  name: "Samsung\nGalaxy",      image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300" },
      { id: "p3",  name: "Budget\nPhones",       image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300" },
      { id: "p4",  name: "Flagship\nModels",     image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300" },
      { id: "p5",  name: "Refurbished\nPhones",  image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300" },
      { id: "p6",  name: "Other\nBrands",        image: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=300" },
    ]},
    { title: "Tablets", items: [
      { id: "p7",  name: "iPad\nSeries",         image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300" },
      { id: "p8",  name: "Android\nTablets",     image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=300" },
      { id: "p9",  name: "Kids\nTablets",        image: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=300" },
    ]},
    { title: "Phone Accessories", items: [
      { id: "p10", name: "Phone\nCases",         image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300" },
      { id: "p11", name: "Chargers &\nCables",   image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300" },
      { id: "p12", name: "Screen\nGuards",       image: "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=300" },
    ]},
  ],
  health: [
    { title: "Skincare", items: [
      { id: "h1",  name: "Face\nWash",           image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300" },
      { id: "h2",  name: "Moisturisers",         image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300" },
      { id: "h3",  name: "Serums &\nOils",       image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300" },
      { id: "h4",  name: "Sun\nProtection",      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300" },
      { id: "h5",  name: "Body\nLotions",        image: "https://images.unsplash.com/photo-1570194065650-d99fb4ee8108?w=300" },
      { id: "h6",  name: "Lip Care",             image: "https://images.unsplash.com/photo-1586495777744-4e6232bf2373?w=300" },
    ]},
    { title: "Hair Care", items: [
      { id: "h7",  name: "Shampoo &\nConditioner",image:"https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=300" },
      { id: "h8",  name: "Hair\nStyling",        image: "https://images.unsplash.com/photo-1522337394405-2f45c0d3c4cd?w=300" },
      { id: "h9",  name: "Hair\nExtensions",     image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300" },
    ]},
    { title: "Wellness", items: [
      { id: "h10", name: "Vitamins &\nMinerals", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
      { id: "h11", name: "Protein &\nNutrition", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300" },
      { id: "h12", name: "Feminine\nCare",       image: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=300" },
    ]},
  ],
  home: [
    { title: "Furniture", items: [
      { id: "hm1", name: "Sofas &\nLounges",     image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300" },
      { id: "hm2", name: "Beds &\nMattresses",   image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=300" },
      { id: "hm3", name: "Dining\nSets",         image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=300" },
      { id: "hm4", name: "Storage &\nShelving",  image: "https://images.unsplash.com/photo-1597072689227-8882273e8f6a?w=300" },
      { id: "hm5", name: "Office\nChairs",       image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300" },
      { id: "hm6", name: "Kids\nFurniture",      image: "https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?w=300" },
    ]},
    { title: "Kitchen", items: [
      { id: "hm7", name: "Pots &\nPans",         image: "https://images.unsplash.com/photo-1584990347449-39ce96c41339?w=300" },
      { id: "hm8", name: "Kitchen\nAppliances",  image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300" },
      { id: "hm9", name: "Cutlery\nSets",        image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300" },
    ]},
    { title: "Decor & Lighting", items: [
      { id: "hm10",name: "Wall Art &\nFrames",   image: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=300" },
      { id: "hm11",name: "Lighting &\nLamps",    image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=300" },
      { id: "hm12",name: "Rugs &\nCarpets",      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300" },
    ]},
  ],
  electronics: [
    { title: "TV & Audio", items: [
      { id: "e1",  name: "Smart\nTVs",           image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=300" },
      { id: "e2",  name: "Soundbars &\nSpeakers",image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300" },
      { id: "e3",  name: "Headphones &\nEarbuds",image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300" },
      { id: "e4",  name: "Projectors",           image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=300" },
      { id: "e5",  name: "Home\nCinema",         image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300" },
      { id: "e6",  name: "Streaming\nDevices",   image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300" },
    ]},
    { title: "Cameras", items: [
      { id: "e7",  name: "DSLR\nCameras",        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300" },
      { id: "e8",  name: "Action\nCameras",      image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300" },
      { id: "e9",  name: "Tripods &\nMounts",    image: "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=300" },
    ]},
  ],
  computing: [
    { title: "Laptops & Desktops", items: [
      { id: "c1",  name: "MacBooks",             image: "https://images.unsplash.com/photo-1611186871525-11c1f3f92614?w=300" },
      { id: "c2",  name: "Windows\nLaptops",     image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300" },
      { id: "c3",  name: "Gaming\nLaptops",      image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300" },
      { id: "c4",  name: "Desktop\nPCs",         image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300" },
      { id: "c5",  name: "Chromebooks",          image: "https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=300" },
      { id: "c6",  name: "Laptop\nBags",         image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300" },
    ]},
    { title: "Peripherals", items: [
      { id: "c7",  name: "Keyboards &\nMice",    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300" },
      { id: "c8",  name: "Monitors",             image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300" },
      { id: "c9",  name: "USB Hubs &\nDrives",   image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=300" },
    ]},
  ],
  fashion: [
    { title: "Women's Style", items: [
      { id: "f1",  name: "Dresses",              image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300" },
      { id: "f2",  name: "Tops &\nBlouses",      image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=300" },
      { id: "f3",  name: "Trousers &\nJeans",    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300" },
      { id: "f4",  name: "Heels &\nFlats",       image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300" },
      { id: "f5",  name: "Handbags &\nClutches", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300" },
      { id: "f6",  name: "Jewellery",            image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300" },
    ]},
    { title: "Men's Style", items: [
      { id: "f7",  name: "Shirts &\nPolos",      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300" },
      { id: "f8",  name: "Trousers &\nChinos",   image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300" },
      { id: "f9",  name: "Trainers &\nSneakers", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300" },
      { id: "f10", name: "Watches",              image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300" },
    ]},
  ],
  sports: [
    { title: "Gym & Fitness", items: [
      { id: "s1",  name: "Gym\nEquipment",       image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300" },
      { id: "s2",  name: "Yoga &\nPilates",      image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=300" },
      { id: "s3",  name: "Supplements",          image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300" },
      { id: "s4",  name: "Training\nShoes",      image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=300" },
      { id: "s5",  name: "Activewear",           image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=300" },
      { id: "s6",  name: "Water\nBottles",       image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300" },
    ]},
    { title: "Outdoor Sports", items: [
      { id: "s7",  name: "Football\nGear",       image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=300" },
      { id: "s8",  name: "Basketball",           image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300" },
      { id: "s9",  name: "Cycling\nGear",        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300" },
    ]},
  ],
  baby: [
    { title: "Baby Essentials", items: [
      { id: "b1",  name: "Nappies &\nWipes",     image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300" },
      { id: "b2",  name: "Feeding\nSets",        image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300" },
      { id: "b3",  name: "Baby\nBath",           image: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=300" },
      { id: "b4",  name: "Baby\nClothing",       image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300" },
      { id: "b5",  name: "Prams &\nCarriers",    image: "https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?w=300" },
      { id: "b6",  name: "Toys &\nRattles",      image: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=300" },
    ]},
  ],
  gaming: [
    { title: "Consoles & Games", items: [
      { id: "gm1", name: "PlayStation\n5",       image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=300" },
      { id: "gm2", name: "Xbox\nSeries",         image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=300" },
      { id: "gm3", name: "Nintendo\nSwitch",     image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=300" },
      { id: "gm4", name: "PC\nGaming",           image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300" },
      { id: "gm5", name: "Controllers\n& Gear",  image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=300" },
      { id: "gm6", name: "Gaming\nHeadsets",     image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300" },
    ]},
  ],
  auto: [
    { title: "Car Accessories", items: [
      { id: "a1",  name: "Seat\nCovers",         image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=300" },
      { id: "a2",  name: "Dash\nCameras",        image: "https://images.unsplash.com/photo-1565843589221-1a6fd9ae45c7?w=300" },
      { id: "a3",  name: "Tyres &\nRims",        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300" },
      { id: "a4",  name: "Engine\nOils",         image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300" },
      { id: "a5",  name: "Car\nAudio",           image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=300" },
      { id: "a6",  name: "Car\nChargers",        image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=300" },
    ]},
  ],
  books: [
    { title: "Books & Learning", items: [
      { id: "bk1", name: "Fiction &\nThrillers", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300" },
      { id: "bk2", name: "Business &\nFinance",  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300" },
      { id: "bk3", name: "Children's\nBooks",    image: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=300" },
      { id: "bk4", name: "Self\nImprovement",    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300" },
      { id: "bk5", name: "School\nTextbooks",    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300" },
      { id: "bk6", name: "Comics &\nGraphic",    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300" },
    ]},
  ],
};

// ── Tile — small square image + name below (Jumia style) ─────────────────────
const Tile = ({ item }: { item: Sub }) => (
  <TouchableOpacity style={styles.tile} activeOpacity={0.8}>
    <View style={styles.tileImgWrap}>
      <Image source={{ uri: item.image }} style={styles.tileImg} resizeMode="cover" />
    </View>
    <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
  </TouchableOpacity>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export default function CategoriesScreen() {
  const [selected, setSelected] = useState("grocery");
  const panelRef = useRef<ScrollView>(null);
  const sections = DATA[selected] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Search */}
      <View style={styles.search}>
        <Text style={{ fontSize: 14 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#adb5bd"
        />
      </View>

      <View style={styles.body}>

        {/* ── Sidebar ── */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {MAINS.map(cat => {
              const active = selected === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.sideItem, active && styles.sideItemActive]}
                  onPress={() => {
                    setSelected(cat.id);
                    panelRef.current?.scrollTo({ y: 0, animated: false });
                  }}
                  activeOpacity={0.7}
                >
                  {active && <View style={styles.bar} />}
                  <Text style={[styles.sideLabel, active && styles.sideLabelActive]} numberOfLines={3}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Right panel ── */}
        <ScrollView
          ref={panelRef}
          style={styles.panel}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* See all row */}
          <TouchableOpacity style={styles.seeAll}>
            <Text style={styles.seeAllLabel}>SEE ALL PRODUCTS</Text>
            <Text style={styles.seeAllArrow}>›</Text>
          </TouchableOpacity>

          {/* Sections */}
          {sections.map((sec, si) => (
            <View
              key={sec.title}
              style={[styles.section, si < sections.length - 1 && styles.sectionDivider]}
            >
              {/* Section header */}
              <View style={styles.secHeader}>
                <Text style={styles.secTitle}>{sec.title.toUpperCase()}</Text>
                <TouchableOpacity>
                  <Text style={styles.secSeeAll}>SEE ALL</Text>
                </TouchableOpacity>
              </View>

              {/* 3-column grid */}
              <View style={styles.grid}>
                {sec.items.map(item => <Tile key={item.id} item={item} />)}
              </View>
            </View>
          ))}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  search: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f1f3f5",
    marginHorizontal: 12, marginTop: 10, marginBottom: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#212529", padding: 0 },

  body: { flex: 1, flexDirection: "row" },

  // ── Sidebar (fully locked width) ──
  sidebar: {
    width: SW,
    maxWidth: SW,
    minWidth: SW,
    backgroundColor: "#f8f9fa",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#dee2e6",
  },
  sideItem: {
    width: SW,
    maxWidth: SW,
    paddingVertical: 14,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e9ecef",
    position: "relative",
  },
  sideItemActive: { backgroundColor: "#fff" },
  bar: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: "#f97316",
  },
  sideLabel: {
    fontSize: 10, color: "#868e96",
    textAlign: "center", lineHeight: 14,
    fontWeight: "500", paddingHorizontal: 4,
  },
  sideLabelActive: { color: "#111827", fontWeight: "700" },

  // ── Panel ──
  panel: { flex: 1 },

  seeAll: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e9ecef",
  },
  seeAllLabel: { fontSize: 13, fontWeight: "800", color: "#111827", letterSpacing: 0.3 },
  seeAllArrow: { fontSize: 22, color: "#868e96" },

  section: { paddingBottom: 4 },
  sectionDivider: { borderBottomWidth: 6, borderBottomColor: "#f1f3f5", marginBottom: 2 },

  secHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingTop: 14, paddingBottom: 8,
  },
  secTitle: {
    fontSize: 11.5, fontWeight: "800", color: "#111827",
    letterSpacing: 0.5, flex: 1,
  },
  secSeeAll: { fontSize: 11, fontWeight: "700", color: "#f97316" },

  // ── 3-column tile grid ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  tile: {
    width: TILE,
    alignItems: "center",
    paddingVertical: 4,
  },
  tileImgWrap: {
    width: TILE - 8,
    height: TILE - 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f1f3f5",
    marginBottom: 6,
  },
  tileImg: { width: "100%", height: "100%" },
  tileName: {
    fontSize: 10.5,
    color: "#374151",
    textAlign: "center",
    lineHeight: 14,
    fontWeight: "500",
    paddingHorizontal: 2,
  },
});
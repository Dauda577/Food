import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

export default function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Meqiuue</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
});

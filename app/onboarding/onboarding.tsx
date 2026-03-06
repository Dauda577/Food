import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, Button, Dimensions } from "react-native";
import Swiper from "react-native-swiper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();

  // Check if user has already seen onboarding
  useEffect(() => {
    AsyncStorage.getItem("hasOnboarded").then((value) => {
      if (value === "true") {
        router.replace("/index"); // skip onboarding
      }
    });
  }, []);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem("hasOnboarded", "false");
    router.replace("/index"); // go to home
  };

  return (
    <Swiper
      loop={false}
      activeDotColor="orange"
      showsButtons={false}
      style={{ flex: 1 }}
    >
      <View style={styles.slide}>
        <Image source={require("../../assets/image1.jpg")} style={styles.image} />
        <Text style={styles.title}>Welcome to FoodApp</Text>
        <Text style={styles.text}>Order your favorite food in seconds!</Text>
      </View>

      <View style={styles.slide}>
        <Image source={require("../../assets/image1.jpg")} style={styles.image} />
        <Text style={styles.title}>Fast Delivery</Text>
        <Text style={styles.text}>We deliver your food hot and fresh, right to your door.</Text>
      </View>

      <View style={styles.slide}>
        <Image source={require("../../assets/image1.jpg")} style={styles.image} />
        <Text style={styles.title}>Get Started</Text>
        <Text style={styles.text}>Sign up or login to start ordering!</Text>
        <Button title="Get Started" onPress={finishOnboarding} color="orange" />
      </View>
    </Swiper>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.7,
    height: height * 0.4,
    resizeMode: "contain",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
});
import { useState, useEffect, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRIC_KEY = "biometric_enabled";

export function useBiometrics() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face" | "none">("none");

  // Check device support on mount
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const saved = await AsyncStorage.getItem(BIOMETRIC_KEY);
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsSupported(compatible);
      setIsEnrolled(enrolled);
      setIsEnabled(saved === "true");

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("face");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("fingerprint");
      }
    })();
  }, []);

  // Toggle biometric on/off and persist
  const toggleBiometric = useCallback(async (value: boolean) => {
    if (value && !isEnrolled) {
      return {
        success: false,
        error: "No biometrics enrolled on this device. Please set up Face ID or fingerprint in your device settings.",
      };
    }

    if (value) {
      // Verify once before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm your identity to enable biometric login",
        fallbackLabel: "Use passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return { success: false, error: "Authentication failed. Biometric login not enabled." };
      }
    }

    await AsyncStorage.setItem(BIOMETRIC_KEY, String(value));
    setIsEnabled(value);
    return { success: true };
  }, [isEnrolled]);

  // Call this on app launch / login screen to authenticate
  const authenticate = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupported || !isEnrolled) {
      return { success: false, error: "Biometrics not available." };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to ShopApp",
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }, [isSupported, isEnrolled]);

  return {
    isSupported,
    isEnrolled,
    isEnabled,
    biometricType,
    toggleBiometric,
    authenticate,
  };
}
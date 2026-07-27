import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, KeyboardAvoidingView, ScrollView,
  Platform, Animated, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { useBiometrics } from "../../hooks/useBiometrics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

type Tab = "login" | "signup";
type Method = "email" | "phone";

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TabBar = ({ active, onSwitch }: { active: Tab; onSwitch: (t: Tab) => void }) => {
  const slide = useRef(new Animated.Value(active === "login" ? 0 : 1)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: active === "login" ? 0 : 1, tension: 80, friction: 12, useNativeDriver: true }).start();
  }, [active]);
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [0, (width - 48) / 2] });
  return (
    <View style={styles.tabBar}>
      <Animated.View style={[styles.tabIndicator, { transform: [{ translateX }] }]} />
      {(["login", "signup"] as Tab[]).map(t => (
        <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => onSwitch(t)} activeOpacity={0.8}>
          <Text style={[styles.tabText, active === t && styles.tabTextActive]}>
            {t === "login" ? "Sign In" : "Sign Up"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ── Input field ───────────────────────────────────────────────────────────────
const Field = ({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, maxLength }: {
  label: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any; maxLength?: number;
}) => {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, focused && styles.fieldBoxFocused]}>
        <TextInput
          style={styles.fieldInput}
          placeholder={placeholder} placeholderTextColor="#9ca3af"
          value={value} onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !show}
          keyboardType={keyboardType ?? "default"}
          autoCapitalize={autoCapitalize ?? "none"}
          maxLength={maxLength}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShow(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.eyeIcon}>{show ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ── OTP boxes ─────────────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(6, " ").split("");
  return (
    <View style={styles.otpWrap}>
      <TextInput ref={inputRef} value={value} onChangeText={v => onChange(v.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" maxLength={6} style={styles.otpHidden} caretHidden />
      {digits.map((d, i) => (
        <TouchableOpacity key={i} style={[styles.otpBox, d !== " " && styles.otpBoxFilled, value.length === i && styles.otpBoxActive]} onPress={() => inputRef.current?.focus()} activeOpacity={1}>
          <Text style={styles.otpDigit}>{d === " " ? "" : d}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, user, continueAsGuest } = useAuth();
  const { isEnabled, authenticate, saveCredentials } = useBiometrics();

  const [tab, setTab] = useState<Tab>("login");
  const [method, setMethod] = useState<Method>("email");
  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(true);

  // Email fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  // Phone fields
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ── Auto-biometric login on mount ────────────────────────────────────────
  useEffect(() => {
    const checkBiometricLogin = async () => {
      try {
        // If user is already authenticated, skip biometric prompt
        if (user) {
          setBiometricChecking(false);
          return;
        }

        const biometricEnabled = await AsyncStorage.getItem("biometric_enabled");
        if (biometricEnabled === "true") {
          const result = await authenticate();
          if (result.success) {
            // Check if Supabase session still exists
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              // User is logged in via persistent session, navigate to app
              router.replace("/(tabs)");
            } else {
              // Session expired, clear biometric flag
              await AsyncStorage.removeItem("biometric_enabled");
              Alert.alert("Session Expired", "Please sign in again.");
            }
          }
        }
      } catch (error) {
        console.error("Biometric check error:", error);
      } finally {
        setBiometricChecking(false);
      }
    };

    checkBiometricLogin();
  }, []);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  const switchTab = (t: Tab) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTab(t); setMethod("email"); setOtpStep(false); setOtp("");
  };

  // ── Email login ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginEmail || !loginPass) { Alert.alert("Missing fields", "Please fill in all fields."); return; }
    setLoading(true);
    const { error } = await signInWithEmail(loginEmail.trim(), loginPass);

    if (error) {
      setLoading(false);
      Alert.alert("Sign in failed", error);
      return;
    }

    // Save credentials for biometric login
    await saveCredentials(loginEmail.trim(), loginPass);

    setLoading(false);
    router.replace("/(tabs)");
  };

  // ── Email signup ─────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupPass) { Alert.alert("Missing fields", "Please fill in all fields."); return; }
    if (signupPass !== signupConfirm) { Alert.alert("Passwords don't match"); return; }
    if (signupPass.length < 8) { Alert.alert("Weak password", "Password must be at least 8 characters."); return; }
    setLoading(true);
    const { error } = await signUpWithEmail(signupEmail.trim(), signupPass, signupName.trim());
    setLoading(false);
    if (error) { Alert.alert("Sign up failed", error); return; }
    Alert.alert("Check your email", "We sent you a confirmation link. Confirm it then sign in.", [
      { text: "OK", onPress: () => switchTab("login") },
    ]);
  };

  // ── Phone OTP ────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!phone || phone.length < 9) { Alert.alert("Invalid number", "Please enter a valid phone number."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.replace(/\s/g, "") });
    setLoading(false);
    if (error) { Alert.alert("Failed to send OTP", error.message); return; }
    setOtpStep(true); setOtpTimer(60);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { Alert.alert("Invalid OTP", "Enter the 6-digit code."); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: phone.replace(/\s/g, ""), token: otp, type: "sms" });

    if (error) {
      setLoading(false);
      Alert.alert("Verification failed", error.message);
      return;
    }

    // Save phone for biometric (phone login doesn't store password, so we'll just enable biometric flag)
    await AsyncStorage.setItem("biometric_enabled", "true");

    setLoading(false);
    router.replace("/(tabs)");
  };

  // ── Google ───────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) Alert.alert("Google sign in failed", error.message);
  };

  // ── Guest ────────────────────────────────────────────────────────────────
  const handleGuest = () => {
    continueAsGuest();
    router.replace("/(tabs)");
  };

  // Show loading screen while checking biometrics
  if (biometricChecking) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle="light-content" />
        <Text style={{ color: "#fff", fontSize: 16 }}>Checking biometrics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroLogo}>
          <Text style={styles.heroEmoji}>🛍️</Text>
        </View>
        <Text style={styles.heroTitle}>ShopApp</Text>
        <Text style={styles.heroSub}>Your one-stop shop for everything</Text>
      </View>

      {/* Sheet */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>

          <TabBar active={tab} onSwitch={switchTab} />

          <Animated.View style={{ opacity: fadeAnim }}>

            {/* Method toggle */}
            <View style={styles.methodRow}>
              {(["email", "phone"] as Method[]).map(m => (
                <TouchableOpacity key={m} style={[styles.methodBtn, method === m && styles.methodBtnActive]} onPress={() => { setMethod(m); setOtpStep(false); setOtp(""); }}>
                  <Text style={styles.methodIcon}>{m === "email" ? "✉️" : "📱"}</Text>
                  <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m === "email" ? "Email" : "Phone"}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email login */}
            {tab === "login" && method === "email" && (
              <View style={styles.form}>
                <Field label="Email" placeholder="you@example.com" value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" />
                <Field label="Password" placeholder="Your password" value={loginPass} onChangeText={setLoginPass} secureTextEntry />
                <TouchableOpacity style={styles.forgotBtn} onPress={() => Alert.alert("Reset password", "Enter your email and we'll send a reset link.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Send", onPress: async () => {
                      if (!loginEmail) { Alert.alert("Enter your email first"); return; }
                      await supabase.auth.resetPasswordForEmail(loginEmail.trim());
                      Alert.alert("Sent!", "Check your inbox for a password reset link.");
                    }
                  },
                ])}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>{loading ? "Signing in..." : "Sign In"}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Email signup */}
            {tab === "signup" && method === "email" && (
              <View style={styles.form}>
                <Field label="Full Name" placeholder="Kwame Asante" value={signupName} onChangeText={setSignupName} autoCapitalize="words" />
                <Field label="Email" placeholder="you@example.com" value={signupEmail} onChangeText={setSignupEmail} keyboardType="email-address" />
                <Field label="Password" placeholder="Min. 8 characters" value={signupPass} onChangeText={setSignupPass} secureTextEntry />
                <Field label="Confirm Password" placeholder="Repeat your password" value={signupConfirm} onChangeText={setSignupConfirm} secureTextEntry />
                <Text style={styles.termsText}>
                  By signing up you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.
                </Text>
                <TouchableOpacity style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} onPress={handleSignup} disabled={loading} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>{loading ? "Creating account..." : "Create Account"}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Phone OTP */}
            {method === "phone" && (
              <View style={styles.form}>
                {!otpStep ? (
                  <>
                    <Field label="Phone Number" placeholder="+233 24 000 0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    <TouchableOpacity style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} onPress={handleSendOTP} disabled={loading} activeOpacity={0.88}>
                      <Text style={styles.primaryBtnText}>{loading ? "Sending..." : "Send OTP Code"}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.otpHint}>A 6-digit code was sent to{"\n"}<Text style={{ fontWeight: "700", color: "#111827" }}>{phone}</Text></Text>
                    <OTPInput value={otp} onChange={setOtp} />
                    <View style={styles.resendRow}>
                      {otpTimer > 0
                        ? <Text style={styles.resendTimer}>Resend in {otpTimer}s</Text>
                        : <TouchableOpacity onPress={() => { setOtpTimer(60); setOtp(""); handleSendOTP(); }}><Text style={styles.resendBtn}>Resend code</Text></TouchableOpacity>
                      }
                      <TouchableOpacity onPress={() => { setOtpStep(false); setOtp(""); }}>
                        <Text style={styles.changeNumber}>Change number</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[styles.primaryBtn, (otp.length < 6 || loading) && styles.primaryBtnDisabled]} onPress={handleVerifyOTP} disabled={otp.length < 6 || loading} activeOpacity={0.88}>
                      <Text style={styles.primaryBtnText}>{loading ? "Verifying..." : "Verify & Continue"}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogle} activeOpacity={0.85}>
              <Text style={styles.socialIcon}>🔵</Text>
              <Text style={styles.socialText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Guest */}
            <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} activeOpacity={0.8}>
              <Text style={styles.guestText}>Continue as Guest</Text>
              <Text style={styles.guestArrow}>→</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111827" },
  hero: { alignItems: "center", justifyContent: "center", paddingTop: 70, paddingBottom: 36, gap: 8 },
  heroLogo: { width: 72, height: 72, borderRadius: 22, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", marginBottom: 8, shadowColor: "#f97316", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  heroEmoji: { fontSize: 34 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.5)" },
  sheet: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 28, overflow: "hidden" },
  tabBar: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 14, padding: 4, marginBottom: 24, position: "relative" },
  tabIndicator: { position: "absolute", top: 4, left: 4, width: (width - 48 - 8) / 2, height: "100%", backgroundColor: "#fff", borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 10, zIndex: 1 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  tabTextActive: { color: "#111827" },
  methodRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  methodBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  methodBtnActive: { borderColor: "#f97316", backgroundColor: "#fff7ed" },
  methodIcon: { fontSize: 16 },
  methodText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  methodTextActive: { color: "#f97316" },
  form: { gap: 4, marginBottom: 8 },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 6 },
  fieldBox: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: "#f9fafb" },
  fieldBoxFocused: { borderColor: "#f97316", backgroundColor: "#fff" },
  fieldInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  eyeIcon: { fontSize: 16, marginLeft: 8 },
  forgotBtn: { alignSelf: "flex-end", marginTop: -4, marginBottom: 8 },
  forgotText: { fontSize: 13, fontWeight: "600", color: "#f97316" },
  primaryBtn: { backgroundColor: "#111827", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  termsText: { fontSize: 12, color: "#9ca3af", lineHeight: 18, textAlign: "center", marginVertical: 6 },
  termsLink: { color: "#f97316", fontWeight: "600" },
  otpHint: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  otpWrap: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 16 },
  otpHidden: { position: "absolute", opacity: 0, width: 0, height: 0 },
  otpBox: { width: 44, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#f9fafb", alignItems: "center", justifyContent: "center" },
  otpBoxFilled: { borderColor: "#111827", backgroundColor: "#fff" },
  otpBoxActive: { borderColor: "#f97316", borderWidth: 2 },
  otpDigit: { fontSize: 20, fontWeight: "700", color: "#111827" },
  resendRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  resendTimer: { fontSize: 13, color: "#9ca3af" },
  resendBtn: { fontSize: 13, fontWeight: "600", color: "#f97316" },
  changeNumber: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#e5e7eb" },
  dividerText: { fontSize: 13, color: "#9ca3af", fontWeight: "500" },
  socialBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 16, paddingVertical: 14, backgroundColor: "#fff" },
  socialIcon: { fontSize: 20 },
  socialText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  guestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, marginTop: 10 },
  guestText: { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  guestArrow: { fontSize: 14, color: "#9ca3af" },
});
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
return (
  <>
    <ThemeProvider value={undefined}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Add other screens here if needed */}
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  </>
);
}
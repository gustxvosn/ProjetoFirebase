import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { COLORS } from "@/constants/theme";

export const unstable_settings = {
  anchor: "login",
};

const CustomDarkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.accent,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={CustomDarkTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="recuperar-senha" />
        <Stack.Screen name="nova-senha" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="home" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="produtos" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="gerar-qr" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>

      <StatusBar style="light" />
    </ThemeProvider>
  );
}

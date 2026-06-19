import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth } from "../services/firebase";
import { isAdminCredentials, startDemoAdminSession } from "../services/demoAuth";

const COLORS = {
  background: "#F8F6F0",
  blue: "#1E88E5",
  blueDark: "#0F5EA8",
  ink: "#172033",
  muted: "#657080",
  line: "#E4DED2",
  white: "#FFFFFF",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atencao", "Informe e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);

      if (isAdminCredentials(email, senha)) {
        startDemoAdminSession();
        router.replace("/home");
        return;
      }

      await signInWithEmailAndPassword(auth, email.trim(), senha);
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Erro ao entrar", error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroLayer}>
            <View style={styles.heroBlue} />
            <View style={styles.heroWash} />
            <View style={styles.heroBubbleLarge} />
            <View style={styles.heroBubbleSmall} />
          </View>

          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons color={COLORS.white} name="washing-machine" size={28} />
            </View>
            <Text style={styles.eyebrow}>Laundry Monitor</Text>
            <Text style={styles.title}>Controle limpo, rapido e visual.</Text>
            <Text style={styles.subtitle}>
              Acesse o painel para acompanhar maquinas, ciclos e alertas de conclusao.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Entrar</Text>
              <View style={styles.secureBadge}>
                <Ionicons color={COLORS.blue} name="shield-checkmark" size={15} />
                <Text style={styles.secureText}>Seguro</Text>
              </View>
            </View>

            <View style={styles.demoAccess}>
              <Ionicons color={COLORS.blue} name="key-outline" size={18} />
              <Text style={styles.demoAccessText}>Admin: usuario admin, senha 1234</Text>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons color={COLORS.muted} name="mail-outline" size={20} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="E-mail"
                placeholderTextColor="#8A93A0"
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons color={COLORS.muted} name="lock-closed-outline" size={20} />
              <TextInput
                onChangeText={setSenha}
                placeholder="Senha"
                placeholderTextColor="#8A93A0"
                secureTextEntry
                style={styles.input}
                value={senha}
              />
            </View>

            <Pressable
              disabled={carregando}
              onPress={entrar}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !carregando && styles.primaryButtonPressed,
                carregando && styles.disabledButton,
              ]}
            >
              {carregando ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Entrar no painel</Text>
                  <Ionicons color={COLORS.white} name="arrow-forward" size={20} />
                </>
              )}
            </Pressable>

            <Pressable onPress={() => router.push("/cadastro")} style={styles.linkButton}>
              <Text style={styles.linkText}>Criar uma conta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  heroLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  heroBlue: {
    backgroundColor: COLORS.blue,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    height: 382,
    left: -28,
    opacity: 0.96,
    position: "absolute",
    right: -28,
    top: -92,
  },
  heroWash: {
    backgroundColor: "#D9ECFA",
    borderRadius: 140,
    height: 280,
    position: "absolute",
    right: -96,
    top: 54,
    width: 280,
  },
  heroBubbleLarge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 48,
    height: 96,
    left: 22,
    position: "absolute",
    top: 48,
    width: 96,
  },
  heroBubbleSmall: {
    backgroundColor: "rgba(255,255,255,0.38)",
    borderRadius: 20,
    height: 40,
    position: "absolute",
    right: 52,
    top: 30,
    width: 40,
  },
  brandBlock: {
    marginBottom: 34,
    marginTop: 24,
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: COLORS.blueDark,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 22,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    marginBottom: 18,
    width: 54,
  },
  eyebrow: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 36,
    maxWidth: 310,
  },
  subtitle: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 14,
    color: COLORS.blueDark,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 340,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderColor: "rgba(30,136,229,0.12)",
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#1E3551",
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: 26,
    fontWeight: "900",
  },
  secureBadge: {
    alignItems: "center",
    backgroundColor: "#EEF7FF",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  secureText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "800",
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "#FBFAF7",
    borderColor: COLORS.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    minHeight: 56,
    paddingHorizontal: 14,
  },
  demoAccess: {
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    borderColor: "#BBDDF6",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  demoAccessText: {
    color: COLORS.blueDark,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    color: COLORS.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 54,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.blue,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 56,
    padding: 15,
    shadowColor: COLORS.blue,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 5,
  },
  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: COLORS.blue,
    fontSize: 15,
    fontWeight: "800",
  },
});

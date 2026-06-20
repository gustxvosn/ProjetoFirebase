import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
import { auth, db } from "../services/firebase";
import { isDemoCredentials, startDemoSession } from "../services/demoAuth";
import { COLORS } from "@/constants/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [perfil, setPerfil] = useState<"gestor" | "funcionario" | "cliente">("cliente");
  
  const [emailFocused, setEmailFocused] = useState(false);
  const [senhaFocused, setSenhaFocused] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Informe e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);

      if (isDemoCredentials(email, senha)) {
        startDemoSession(perfil);
        router.replace("/home");
        return;
      }

      const credencial = await signInWithEmailAndPassword(auth, email.trim(), senha);
      await credencial.user.reload();

      if (!credencial.user.emailVerified) {
        try {
          await sendEmailVerification(credencial.user);
        } catch {
          // O Firebase pode limitar reenvios. O bloqueio de acesso continua valendo.
        }

        await signOut(auth);
        Alert.alert(
          "Confirme seu e-mail",
          "Enviamos um link de confirmação para o seu e-mail. Confirme antes de acessar o painel."
        );
        return;
      }

      await setDoc(
        doc(db, "usuarios", credencial.user.uid),
        {
          emailVerificado: true,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      router.replace("/home");
    } catch {
      Alert.alert("Dados inválidos", "Verifique o e-mail e a senha informados.");
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
          {/* Back button */}
          <View style={styles.topHeader}>
            <Pressable onPress={() => router.replace("/")} style={styles.backButton}>
              <Ionicons color={COLORS.text} name="arrow-back" size={24} />
            </Pressable>
          </View>

          {/* Brand/Header block */}
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons color={COLORS.white} name="washing-machine" size={28} />
            </View>
            <Text style={styles.eyebrow}>Smart Wash</Text>
            <Text style={styles.title}>Controle sanitário inteligente.</Text>
            <Text style={styles.subtitle}>
              Acesse o painel para monitorar ciclos de higienização de equipamentos em tempo real.
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Entrar</Text>
              <View style={styles.secureBadge}>
                <Ionicons color={COLORS.accentLight} name="shield-checkmark" size={15} />
                <Text style={styles.secureText}>Seguro</Text>
              </View>
            </View>

            {/* Role Selector */}
            <Text style={styles.label}>Selecione seu perfil:</Text>
            <View style={styles.roleSelector}>
              <Pressable 
                style={[styles.roleButton, perfil === "cliente" && styles.roleButtonActive]}
                onPress={() => setPerfil("cliente")}
              >
                <Ionicons name="person-outline" size={16} color={perfil === "cliente" ? COLORS.white : COLORS.textMuted} />
                <Text style={[styles.roleText, perfil === "cliente" && styles.roleTextActive]}>Cliente</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.roleButton, perfil === "funcionario" && styles.roleButtonActive]}
                onPress={() => setPerfil("funcionario")}
              >
                <Ionicons name="briefcase-outline" size={16} color={perfil === "funcionario" ? COLORS.white : COLORS.textMuted} />
                <Text style={[styles.roleText, perfil === "funcionario" && styles.roleTextActive]}>Funcionário</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.roleButton, perfil === "gestor" && styles.roleButtonActive]}
                onPress={() => setPerfil("gestor")}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color={perfil === "gestor" ? COLORS.white : COLORS.textMuted} />
                <Text style={[styles.roleText, perfil === "gestor" && styles.roleTextActive]}>Gestor</Text>
              </Pressable>
            </View>

            {/* Email input */}
            <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
              <Ionicons color={emailFocused ? COLORS.accent : COLORS.textMuted} name="mail-outline" size={20} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="E-mail"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                value={email}
              />
            </View>

            {/* Password input */}
            <View style={[styles.inputWrap, senhaFocused && styles.inputWrapFocused]}>
              <Ionicons color={senhaFocused ? COLORS.accent : COLORS.textMuted} name="lock-closed-outline" size={20} />
              <TextInput
                onChangeText={setSenha}
                onFocus={() => setSenhaFocused(true)}
                onBlur={() => setSenhaFocused(false)}
                placeholder="Senha"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                style={styles.input}
                value={senha}
              />
            </View>

            <Pressable
              onPress={() => router.push("/recuperar-senha")}
              style={({ pressed }) => [styles.forgotButton, pressed && styles.primaryButtonPressed]}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </Pressable>

            {/* Submit button */}
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
                  <Text style={styles.primaryButtonText}>Acessar painel</Text>
                  <Ionicons color={COLORS.white} name="arrow-forward" size={20} />
                </>
              )}
            </Pressable>

            {/* Register link */}
            <Pressable onPress={() => router.push("/cadastro")} style={styles.linkButton}>
              <Text style={styles.linkText}>Solicitar cadastro / Criar conta</Text>
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
  brandBlock: {
    marginBottom: 30,
    marginTop: 10,
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    marginBottom: 16,
    width: 52,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  eyebrow: {
    color: COLORS.accentLight,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },
  secureBadge: {
    alignItems: "center",
    backgroundColor: "#24183D",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  secureText: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: "700",
  },
  demoAccess: {
    alignItems: "center",
    backgroundColor: "#171225",
    borderColor: "#5B3EA6",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  demoAccessText: {
    color: COLORS.accentLight,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputWrapFocused: {
    borderColor: COLORS.accent,
    borderWidth: 2,
    backgroundColor: `${COLORS.accent}05`,
  },
  input: {
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 52,
    padding: 14,
    shadowColor: COLORS.accent,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
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
    fontWeight: "700",
  },
  forgotButton: {
    alignItems: "flex-end",
    marginBottom: 8,
    paddingVertical: 6,
  },
  forgotText: {
    color: COLORS.accentLight,
    fontSize: 14,
    fontWeight: "800",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: COLORS.accentLight,
    fontSize: 14,
    fontWeight: "700",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 10,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  roleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  roleTextActive: {
    color: COLORS.white,
  },
});

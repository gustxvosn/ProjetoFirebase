import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { COLORS } from "@/constants/theme";
import { auth } from "../services/firebase";

export default function NovaSenha() {
  const params = useLocalSearchParams<{ mode?: string; oobCode?: string }>();
  const oobCode = useMemo(
    () => (Array.isArray(params.oobCode) ? params.oobCode[0] : params.oobCode) || "",
    [params.oobCode]
  );
  const mode = useMemo(
    () => (Array.isArray(params.mode) ? params.mode[0] : params.mode) || "",
    [params.mode]
  );

  const [email, setEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaFocused, setSenhaFocused] = useState(false);
  const [confirmarFocused, setConfirmarFocused] = useState(false);
  const [validando, setValidando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [senhaAlterada, setSenhaAlterada] = useState(false);

  useEffect(() => {
    async function validarCodigo() {
      if (mode && mode !== "resetPassword") {
        setErro("Este link não é válido para redefinição de senha.");
        setValidando(false);
        return;
      }

      if (!oobCode) {
        setErro("Link inválido ou incompleto. Solicite uma nova redefinição de senha.");
        setValidando(false);
        return;
      }

      try {
        const emailDoCodigo = await verifyPasswordResetCode(auth, oobCode);
        setEmail(emailDoCodigo);
      } catch {
        setErro("Este link expirou ou já foi utilizado. Solicite uma nova redefinição.");
      } finally {
        setValidando(false);
      }
    }

    validarCodigo();
  }, [mode, oobCode]);

  async function alterarSenha() {
    if (!oobCode || erro) return;

    if (novaSenha.length < 6) {
      Alert.alert("Atenção", "A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas informadas não conferem.");
      return;
    }

    try {
      setSalvando(true);
      await confirmPasswordReset(auth, oobCode, novaSenha);
      setSenhaAlterada(true);
    } catch {
      Alert.alert("Erro", "Não foi possível alterar a senha. Solicite um novo link e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons color={COLORS.white} name="lock-reset" size={30} />
            </View>
            <Text style={styles.eyebrow}>Smart Wash</Text>
            <Text style={styles.title}>Criar nova senha</Text>
            <Text style={styles.subtitle}>
              Defina uma nova senha para voltar a acessar sua conta com segurança.
            </Text>
          </View>

          <View style={styles.card}>
            {validando ? (
              <View style={styles.centerBlock}>
                <ActivityIndicator color={COLORS.accent} size="large" />
                <Text style={styles.loadingText}>Validando link de recuperação...</Text>
              </View>
            ) : erro ? (
              <View style={styles.centerBlock}>
                <Ionicons color={COLORS.danger} name="alert-circle" size={34} />
                <Text style={styles.cardTitle}>Link inválido</Text>
                <Text style={styles.helperText}>{erro}</Text>
                <Pressable onPress={() => router.replace("/recuperar-senha")} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Solicitar novo link</Text>
                </Pressable>
              </View>
            ) : senhaAlterada ? (
              <View style={styles.centerBlock}>
                <Ionicons color={COLORS.success} name="checkmark-circle" size={38} />
                <Text style={styles.cardTitle}>Senha alterada</Text>
                <Text style={styles.helperText}>Sua senha foi atualizada com sucesso.</Text>
                <Pressable onPress={() => router.replace("/login")} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Voltar para o login</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.cardTitle}>Nova senha</Text>
                <View style={styles.emailBadge}>
                  <Ionicons color={COLORS.accentLight} name="mail-outline" size={17} />
                  <Text style={styles.emailBadgeText}>{email}</Text>
                </View>

                <View style={[styles.inputWrap, senhaFocused && styles.inputWrapFocused]}>
                  <Ionicons color={senhaFocused ? COLORS.accent : COLORS.textMuted} name="lock-closed-outline" size={20} />
                  <TextInput
                    onBlur={() => setSenhaFocused(false)}
                    onChangeText={setNovaSenha}
                    onFocus={() => setSenhaFocused(true)}
                    placeholder="Nova senha"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    style={styles.input}
                    value={novaSenha}
                  />
                </View>

                <View style={[styles.inputWrap, confirmarFocused && styles.inputWrapFocused]}>
                  <Ionicons color={confirmarFocused ? COLORS.accent : COLORS.textMuted} name="shield-checkmark-outline" size={20} />
                  <TextInput
                    onBlur={() => setConfirmarFocused(false)}
                    onChangeText={setConfirmarSenha}
                    onFocus={() => setConfirmarFocused(true)}
                    placeholder="Confirmar nova senha"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    style={styles.input}
                    value={confirmarSenha}
                  />
                </View>

                <Pressable
                  disabled={salvando}
                  onPress={alterarSenha}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && !salvando && styles.primaryButtonPressed,
                    salvando && styles.disabledButton,
                  ]}
                >
                  {salvando ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Alterar senha</Text>
                      <Ionicons color={COLORS.white} name="checkmark" size={20} />
                    </>
                  )}
                </Pressable>
              </>
            )}
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
    marginBottom: 28,
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
    marginBottom: 16,
    width: 54,
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
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
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
  },
  centerBlock: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    textAlign: "center",
  },
  emailBadge: {
    alignItems: "center",
    backgroundColor: "#171225",
    borderColor: "#5B3EA6",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emailBadgeText: {
    color: COLORS.accentLight,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
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
    backgroundColor: `${COLORS.accent}05`,
    borderColor: COLORS.accent,
    borderWidth: 2,
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
    width: "100%",
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
    fontWeight: "800",
  },
});

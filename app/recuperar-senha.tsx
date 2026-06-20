import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { sendPasswordResetEmail } from "firebase/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    titulo: string;
    texto: string;
  } | null>(null);

  async function resetarSenha() {
    if (!email.trim()) {
      setMensagem({
        tipo: "erro",
        titulo: "Informe o e-mail",
        texto: "Digite o e-mail cadastrado antes de solicitar o link de redefinição.",
      });
      return;
    }

    try {
      setEnviando(true);
      await sendPasswordResetEmail(auth, email.trim());
      setMensagem({
        tipo: "sucesso",
        titulo: "E-mail enviado",
        texto: "Confira sua caixa de entrada e abra o link para alterar a senha com segurança.",
      });
    } catch (error: any) {
      if (error?.code === "auth/invalid-email") {
        setMensagem({
          tipo: "erro",
          titulo: "E-mail inválido",
          texto: "Informe um endereço de e-mail válido para continuar.",
        });
        return;
      }

      const mensagens: Record<string, string> = {
        "auth/user-not-found": "Não existe uma conta cadastrada com este e-mail.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
        "auth/unauthorized-continue-uri": "O domínio do link de recuperação não está autorizado no Firebase.",
      };

      setMensagem({
        tipo: "erro",
        titulo: "E-mail não enviado",
        texto: mensagens[error?.code] || "O Firebase não conseguiu enviar o link. Verifique o e-mail e tente novamente.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topHeader}>
            <Pressable onPress={() => router.replace("/login")} style={styles.backButton}>
              <Ionicons color={COLORS.text} name="arrow-back" size={24} />
            </Pressable>
          </View>

          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons color={COLORS.white} name="lock-reset" size={30} />
            </View>
            <Text style={styles.eyebrow}>Smart Wash</Text>
            <Text style={styles.title}>Redefinir senha</Text>
            <Text style={styles.subtitle}>
              Informe o e-mail cadastrado para receber um link seguro de alteração de senha.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recuperação de acesso</Text>

            <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
              <Ionicons color={emailFocused ? COLORS.accent : COLORS.textMuted} name="mail-outline" size={20} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={() => setEmailFocused(false)}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                placeholder="Digite seu e-mail"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                value={email}
              />
            </View>

            <Pressable
              disabled={enviando}
              onPress={resetarSenha}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !enviando && styles.primaryButtonPressed,
                enviando && styles.disabledButton,
              ]}
            >
              {enviando ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Resetar senha</Text>
                  <Ionicons color={COLORS.white} name="send" size={18} />
                </>
              )}
            </Pressable>

            {mensagem ? (
              <View
                style={[
                  styles.messageBox,
                  mensagem.tipo === "sucesso" ? styles.messageSuccess : styles.messageError,
                ]}
              >
                <Ionicons
                  color={mensagem.tipo === "sucesso" ? COLORS.success : COLORS.danger}
                  name={mensagem.tipo === "sucesso" ? "checkmark-circle" : "alert-circle"}
                  size={22}
                />
                <View style={styles.messageTextWrap}>
                  <Text style={styles.messageTitle}>{mensagem.titulo}</Text>
                  <Text style={styles.messageText}>{mensagem.texto}</Text>
                </View>
              </View>
            ) : null}

            <Pressable onPress={() => router.replace("/login")} style={styles.linkButton}>
              <Text style={styles.linkText}>Voltar para o login</Text>
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
  topHeader: {
    alignItems: "center",
    flexDirection: "row",
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
  cardTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
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
    minHeight: 52,
    padding: 14,
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
  messageBox: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    padding: 12,
  },
  messageSuccess: {
    backgroundColor: "#102216",
    borderColor: "#256E45",
  },
  messageError: {
    backgroundColor: "#2A111A",
    borderColor: "#7F1D3A",
  },
  messageTextWrap: {
    flex: 1,
  },
  messageTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  messageText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
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
});

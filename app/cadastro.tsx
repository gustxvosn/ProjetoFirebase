import { Ionicons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../services/firebase";
import { COLORS } from "@/constants/theme";

function mensagemErroFirebase(error: any) {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado.";
    case "auth/invalid-email":
      return "Informe um e-mail válido.";
    case "auth/operation-not-allowed":
      return "Ative o provedor E-mail/senha no Firebase Authentication.";
    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 caracteres.";
    case "permission-denied":
    case "firestore/permission-denied":
      return "A conta foi criada, mas o Firestore bloqueou o salvamento do perfil. Verifique as regras do banco.";
    default:
      return error?.message || "Não foi possível concluir o cadastro.";
  }
}

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [diagnostico, setDiagnostico] = useState("");
  const [chaveAcesso, setChaveAcesso] = useState("");

  const [chaveFocused, setChaveFocused] = useState(false);
  const [nomeFocused, setNomeFocused] = useState(false);
  const [telefoneFocused, setTelefoneFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [senhaFocused, setSenhaFocused] = useState(false);

  async function cadastrar() {
    setDiagnostico("Botão CADASTRAR acionado.");
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setDiagnostico("Preencha nome, e-mail e senha para continuar.");
      Alert.alert("Atenção", "Preencha nome, e-mail e senha.");
      return;
    }

    if (senha.length < 6) {
      setDiagnostico("A senha precisa ter pelo menos 6 caracteres.");
      Alert.alert("Atenção", "A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (!chaveAcesso.trim()) {
      setDiagnostico("Chave de acesso não informada.");
      Alert.alert("Atenção", "Informe a chave de acesso fornecida pelo gestor.");
      return;
    }

    try {
      setCarregando(true);

      // Validate Access Key first
      setDiagnostico("Validando chave de acesso...");
      const chaveRef = doc(db, "chaves_cadastro", chaveAcesso.trim().toUpperCase());
      const chaveSnap = await getDoc(chaveRef);

      if (!chaveSnap.exists()) {
        setDiagnostico("Chave inválida ou não encontrada.");
        Alert.alert("Erro", "Chave de acesso inválida.");
        setCarregando(false);
        return;
      }

      const chaveData = chaveSnap.data();
      if (chaveData.usada) {
        setDiagnostico("Chave já foi utilizada.");
        Alert.alert("Erro", "Esta chave de acesso já foi utilizada por outro usuário.");
        setCarregando(false);
        return;
      }

      const perfilDaChave = chaveData.perfil;

      setDiagnostico("Criando usuário no Firebase Authentication...");
      const credencial = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      setDiagnostico(`Usuário criado no Auth. UID: ${credencial.user.uid}`);

      await updateProfile(credencial.user, {
        displayName: nome.trim(),
      });

      try {
        setDiagnostico("Salvando perfil no Cloud Firestore...");
        await setDoc(doc(db, "usuarios", credencial.user.uid), {
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          perfil: perfilDaChave,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        });

        setDiagnostico("Marcando chave como usada...");
        await updateDoc(chaveRef, {
          usada: true,
          usadaEm: serverTimestamp(),
          usadaPor: credencial.user.uid
        });
      } catch (firestoreError: any) {
        setDiagnostico(`Auth criado, mas Firestore falhou: ${firestoreError?.code || firestoreError?.message}`);
        Alert.alert("Cadastro parcial", mensagemErroFirebase(firestoreError));
        return;
      }

      Alert.alert("Sucesso", "Usuário cadastrado com sucesso!");
      setDiagnostico("Cadastro salvo no Authentication e no Firestore.");
      await signOut(auth);
      router.replace("/login");
    } catch (error: any) {
      setDiagnostico(`Falha no cadastro: ${error?.code || error?.message}`);
      Alert.alert("Erro ao cadastrar", mensagemErroFirebase(error));
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
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Back button */}
          <View style={styles.topHeader}>
            <Pressable onPress={() => router.replace("/login")} style={styles.backButton}>
              <Ionicons color={COLORS.text} name="arrow-back" size={24} />
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.titulo}>Criar Conta</Text>
            <Text style={styles.subtitulo}>Crie suas credenciais para gerenciar higienizações.</Text>

            <View style={[styles.inputWrap, chaveFocused && styles.inputWrapFocused]}>
              <TextInput
                autoCapitalize="characters"
                onChangeText={setChaveAcesso}
                onFocus={() => setChaveFocused(true)}
                onBlur={() => setChaveFocused(false)}
                placeholder="Chave de Acesso (ex: X7B9K2)"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                value={chaveAcesso}
              />
            </View>

            <View style={[styles.inputWrap, nomeFocused && styles.inputWrapFocused]}>
              <TextInput
                onChangeText={setNome}
                onFocus={() => setNomeFocused(true)}
                onBlur={() => setNomeFocused(false)}
                placeholder="Nome completo"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                value={nome}
              />
            </View>

            <View style={[styles.inputWrap, telefoneFocused && styles.inputWrapFocused]}>
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setTelefone}
                onFocus={() => setTelefoneFocused(true)}
                onBlur={() => setTelefoneFocused(false)}
                placeholder="Telefone"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                value={telefone}
              />
            </View>

            <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="E-mail corporativo"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                value={email}
              />
            </View>

            <View style={[styles.inputWrap, senhaFocused && styles.inputWrapFocused]}>
              <TextInput
                onChangeText={setSenha}
                onFocus={() => setSenhaFocused(true)}
                onBlur={() => setSenhaFocused(false)}
                placeholder="Senha (mín. 6 caracteres)"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                style={styles.input}
                value={senha}
              />
            </View>

            <Pressable
              disabled={carregando}
              onPress={cadastrar}
              style={({ pressed }) => [
                styles.botao,
                pressed && !carregando && styles.botaoPressed,
                carregando && styles.botaoDesabilitado,
              ]}
            >
              {carregando ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.textoBotao}>SOLICITAR CADASTRO</Text>
              )}
            </Pressable>

            <TouchableOpacity onPress={() => router.replace("/login")} style={styles.linkArea}>
              <Text style={styles.link}>Já possui uma conta? Entrar</Text>
            </TouchableOpacity>

            {diagnostico ? (
              <View style={styles.diagnosticoBox}>
                <Text style={styles.diagnosticoTitle}>Log de Status:</Text>
                <Text style={styles.diagnostico}>{diagnostico}</Text>
              </View>
            ) : null}
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
  conteudo: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  titulo: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitulo: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    marginTop: 8,
    textAlign: "center",
  },
  inputWrap: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    justifyContent: "center",
  },
  inputWrapFocused: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}05`,
  },
  input: {
    color: COLORS.text,
    fontSize: 15,
    minHeight: 50,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
  },
  botao: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    minHeight: 52,
    justifyContent: "center",
    padding: 14,
    marginTop: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  botaoPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  textoBotao: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  linkArea: {
    alignItems: "center",
    marginTop: 18,
    padding: 8,
  },
  link: {
    color: COLORS.accentLight,
    fontSize: 14,
    fontWeight: "700",
  },
  diagnosticoBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    padding: 12,
  },
  diagnosticoTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  diagnostico: {
    color: COLORS.accentLight,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    lineHeight: 16,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
});

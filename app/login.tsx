import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../services/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Informe e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Erro ao entrar", error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.titulo}>Autenticação</Text>
        <Text style={styles.subtitulo}>Entre para acessar as telas do sistema.</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor="#6B7280"
          style={styles.input}
          value={email}
        />

        <TextInput
          onChangeText={setSenha}
          placeholder="Senha"
          placeholderTextColor="#6B7280"
          secureTextEntry
          style={styles.input}
          value={senha}
        />

        <TouchableOpacity
          disabled={carregando}
          onPress={entrar}
          style={[styles.botao, carregando && styles.botaoDesabilitado]}
        >
          {carregando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.textoBotao}>ENTRAR</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/cadastro")} style={styles.linkArea}>
          <Text style={styles.link}>Criar uma conta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  titulo: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitulo: {
    color: "#4B5563",
    fontSize: 15,
    marginBottom: 24,
    marginTop: 8,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    marginBottom: 14,
    padding: 14,
  },
  botao: {
    alignItems: "center",
    backgroundColor: "#0F766E",
    borderRadius: 8,
    marginTop: 4,
    minHeight: 50,
    justifyContent: "center",
    padding: 14,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  linkArea: {
    alignItems: "center",
    marginTop: 18,
  },
  link: {
    color: "#0F766E",
    fontSize: 15,
    fontWeight: "600",
  },
});

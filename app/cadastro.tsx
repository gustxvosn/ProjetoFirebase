import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../services/firebase";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Preencha nome, e-mail e senha.");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setCarregando(true);
      const credencial = await createUserWithEmailAndPassword(auth, email.trim(), senha);

      await updateProfile(credencial.user, {
        displayName: nome.trim(),
      });

      await setDoc(doc(db, "usuarios", credencial.user.uid), {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      Alert.alert("Sucesso", "Usuário cadastrado com sucesso!");
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Erro ao cadastrar", error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.titulo}>Cadastro de Usuário</Text>
          <Text style={styles.subtitulo}>Crie sua conta para acessar o sistema.</Text>

          <TextInput
            onChangeText={setNome}
            placeholder="Nome completo"
            placeholderTextColor="#6B7280"
            style={styles.input}
            value={nome}
          />

          <TextInput
            keyboardType="phone-pad"
            onChangeText={setTelefone}
            placeholder="Telefone"
            placeholderTextColor="#6B7280"
            style={styles.input}
            value={telefone}
          />

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
            onPress={cadastrar}
            style={[styles.botao, carregando && styles.botaoDesabilitado]}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBotao}>CADASTRAR</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/login")} style={styles.linkArea}>
            <Text style={styles.link}>Já tenho uma conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  conteudo: {
    flexGrow: 1,
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
    fontSize: 27,
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
    backgroundColor: "#2563EB",
    borderRadius: 8,
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
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});

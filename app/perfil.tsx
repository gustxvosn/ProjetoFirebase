import { deleteUser, onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../services/firebase";

export default function Perfil() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setUsuario(user);
      setEmail(user.email || "");
      setNome(user.displayName || "");

      const perfilRef = doc(db, "usuarios", user.uid);
      const perfilSnap = await getDoc(perfilRef);

      if (perfilSnap.exists()) {
        const dados = perfilSnap.data();
        setNome(String(dados.nome || user.displayName || ""));
        setTelefone(String(dados.telefone || ""));
        setEmail(String(dados.email || user.email || ""));
      }

      setCarregando(false);
    });

    return unsubscribe;
  }, []);

  async function salvarPerfil() {
    if (!usuario) return;

    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe o nome do usuário.");
      return;
    }

    try {
      setSalvando(true);
      await updateProfile(usuario, { displayName: nome.trim() });

      await setDoc(
        doc(db, "usuarios", usuario.uid),
        {
          nome: nome.trim(),
          telefone: telefone.trim(),
          email,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro ao atualizar", error.message);
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    Alert.alert(
      "Excluir perfil",
      "Deseja excluir os dados do perfil e a conta de autenticação?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: excluirPerfil },
      ]
    );
  }

  async function excluirPerfil() {
    if (!usuario) return;

    try {
      await deleteDoc(doc(db, "usuarios", usuario.uid));
      await deleteUser(usuario);
      Alert.alert("Sucesso", "Perfil excluído com sucesso.");
      router.replace("/login");
    } catch (error: any) {
      Alert.alert(
        "Erro ao excluir",
        error.code === "auth/requires-recent-login"
          ? "Por segurança, faça login novamente antes de excluir a conta."
          : error.message
      );
    }
  }

  if (carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Perfil do Usuário</Text>
        <Text style={styles.subtitulo}>Consulte, altere ou exclua seus dados cadastrados.</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput onChangeText={setNome} style={styles.input} value={nome} />

        <Text style={styles.label}>Telefone</Text>
        <TextInput
          keyboardType="phone-pad"
          onChangeText={setTelefone}
          style={styles.input}
          value={telefone}
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput editable={false} style={[styles.input, styles.inputDesabilitado]} value={email} />

        <TouchableOpacity
          disabled={salvando}
          onPress={salvarPerfil}
          style={[styles.botaoPrimario, salvando && styles.botaoDesabilitado]}
        >
          <Text style={styles.textoBotao}>{salvando ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={confirmarExclusao} style={styles.botaoPerigo}>
          <Text style={styles.textoBotao}>EXCLUIR PERFIL</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.botaoSecundario}>
          <Text style={styles.textoSecundario}>VOLTAR</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  carregando: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    flex: 1,
    justifyContent: "center",
  },
  conteudo: {
    padding: 20,
  },
  titulo: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
  },
  subtitulo: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 22,
    marginTop: 6,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
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
  inputDesabilitado: {
    backgroundColor: "#E5E7EB",
    color: "#475569",
  },
  botaoPrimario: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    marginTop: 8,
    padding: 15,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoPerigo: {
    alignItems: "center",
    backgroundColor: "#B91C1C",
    borderRadius: 8,
    marginTop: 12,
    padding: 15,
  },
  botaoSecundario: {
    alignItems: "center",
    borderColor: "#94A3B8",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 15,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  textoSecundario: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
  },
});

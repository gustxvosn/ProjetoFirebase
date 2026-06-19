import { Ionicons } from "@expo/vector-icons";
import {
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updateProfile,
  User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
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
import { COLORS } from "@/constants/theme";

export default function Perfil() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setUsuario(user);
      setEmail(user.email || "");
      setNome(user.displayName || "");

      try {
        const perfilSnap = await getDoc(doc(db, "usuarios", user.uid));

        if (perfilSnap.exists()) {
          const dados = perfilSnap.data();
          setNome(String(dados.nome || user.displayName || ""));
          setTelefone(String(dados.telefone || ""));
          setEmail(String(dados.email || user.email || ""));
        }
      } catch (error: any) {
        Alert.alert("Erro ao carregar perfil", error.message);
      } finally {
        setCarregando(false);
      }
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
    if (!senhaConfirmacao.trim()) {
      Alert.alert("Atenção", "Digite sua senha para confirmar a exclusão da conta.");
      return;
    }

    Alert.alert("Excluir conta", "Essa ação apagará perfil, insumos e sua conta de acesso permanentemente.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: excluirPerfil },
    ]);
  }

  async function excluirPerfil() {
    const user = auth.currentUser;

    if (!user || !user.email) {
      router.replace("/login");
      return;
    }

    try {
      setExcluindo(true);

      const credencial = EmailAuthProvider.credential(user.email, senhaConfirmacao);
      await reauthenticateWithCredential(user, credencial);

      const produtosSnap = await getDocs(
        query(collection(db, "produtos"), where("usuarioId", "==", user.uid))
      );

      await Promise.all(produtosSnap.docs.map((produto) => deleteDoc(produto.ref)));
      await deleteDoc(doc(db, "usuarios", user.uid));
      await deleteUser(user);

      Alert.alert("Sucesso", "Conta excluída com sucesso.");
      router.replace("/login");
    } catch (error: any) {
      const mensagem =
        error.code === "auth/invalid-credential" || error.code === "auth/wrong-password"
          ? "Senha incorreta. Digite a senha usada no login."
          : error.message;

      Alert.alert("Erro ao excluir", mensagem);
    } finally {
      setExcluindo(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={COLORS.text} name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações de Perfil</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitulo}>Gerencie as informações cadastrais da sua conta operacional.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Nome Completo</Text>
          <View style={styles.inputWrap}>
            <TextInput onChangeText={setNome} style={styles.input} value={nome} placeholderTextColor={COLORS.textMuted} />
          </View>

          <Text style={styles.label}>Telefone</Text>
          <View style={styles.inputWrap}>
            <TextInput
              keyboardType="phone-pad"
              onChangeText={setTelefone}
              style={styles.input}
              value={telefone}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Text style={styles.label}>E-mail (Não editável)</Text>
          <View style={[styles.inputWrap, styles.inputWrapDesabilitado]}>
            <TextInput editable={false} style={[styles.input, styles.inputDesabilitado]} value={email} />
          </View>

          <TouchableOpacity
            disabled={salvando}
            onPress={salvarPerfil}
            style={[styles.botaoPrimario, salvando && styles.botaoDesabilitado]}
          >
            <Text style={styles.textoBotao}>{salvando ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}</Text>
          </TouchableOpacity>
        </View>

        {/* Danger zone / Delete Account */}
        <View style={[styles.card, styles.cardPerigo]}>
          <Text style={styles.tituloPerigo}>Zona Crítica</Text>
          <Text style={styles.subtituloPerigo}>Excluir sua conta removerá permanentemente todos os registros de produtos e insumos cadastrados.</Text>

          <Text style={styles.label}>Senha para Confirmação</Text>
          <View style={styles.inputWrap}>
            <TextInput
              onChangeText={setSenhaConfirmacao}
              placeholder="Digite sua senha de acesso"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              style={styles.input}
              value={senhaConfirmacao}
            />
          </View>

          <TouchableOpacity
            disabled={excluindo}
            onPress={confirmarExclusao}
            style={[styles.botaoPerigo, excluindo && styles.botaoDesabilitado]}
          >
            <Text style={styles.textoBotao}>{excluindo ? "EXCLUINDO..." : "EXCLUIR MINHA CONTA"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.botaoSecundario}>
          <Text style={styles.textoSecundario}>VOLTAR AO PAINEL</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  carregando: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
  },
  conteudo: {
    padding: 20,
    paddingBottom: 40,
  },
  titulo: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
  },
  subtitulo: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputWrap: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  inputWrapDesabilitado: {
    backgroundColor: "rgba(36, 40, 54, 0.5)",
    borderColor: COLORS.border,
  },
  input: {
    color: COLORS.text,
    fontSize: 15,
    minHeight: 46,
  },
  inputDesabilitado: {
    color: COLORS.textMuted,
  },
  botaoPrimario: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    marginTop: 8,
    padding: 14,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  cardPerigo: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
    backgroundColor: "rgba(225, 112, 85, 0.05)",
  },
  tituloPerigo: {
    color: COLORS.danger,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtituloPerigo: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  botaoPerigo: {
    alignItems: "center",
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    padding: 14,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  botaoSecundario: {
    alignItems: "center",
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  textoBotao: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  textoSecundario: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
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
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
});

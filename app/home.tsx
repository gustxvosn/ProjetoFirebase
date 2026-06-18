import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../services/firebase";

export default function Home() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);

      if (!user) {
        router.replace("/login");
      }
    });

    return unsubscribe;
  }, []);

  async function sair() {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Erro ao sair", error.message);
    }
  }

  if (carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator color="#0F766E" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Área do Usuário</Text>
        <Text style={styles.subtitulo}>
          Olá, {usuario?.displayName || usuario?.email}. Escolha uma tela para gerenciar.
        </Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity onPress={() => router.push("/perfil" as any)} style={styles.card}>
          <Text style={styles.cardTitulo}>Perfil do usuário</Text>
          <Text style={styles.cardTexto}>Visualizar, atualizar e excluir os dados da conta.</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/produtos" as any)} style={styles.card}>
          <Text style={styles.cardTitulo}>Cadastro de produtos</Text>
          <Text style={styles.cardTexto}>Cadastrar, listar, editar e remover produtos.</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={sair} style={styles.botaoSair}>
        <Text style={styles.textoSair}>SAIR</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  carregando: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    flex: 1,
    justifyContent: "center",
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
  },
  titulo: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
  },
  subtitulo: {
    color: "#4B5563",
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
  },
  menu: {
    gap: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  cardTitulo: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "700",
  },
  cardTexto: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },
  botaoSair: {
    alignItems: "center",
    backgroundColor: "#991B1B",
    borderRadius: 8,
    marginTop: "auto",
    padding: 15,
  },
  textoSair: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

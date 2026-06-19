import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../services/firebase";
import { COLORS } from "@/constants/theme";

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  quantidade: number;
};

export default function Produtos() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const tituloFormulario = useMemo(
    () => (produtoEditandoId ? "Editar Insumo" : "Novo Insumo/Produto"),
    [produtoEditandoId]
  );

  async function carregarProdutos(userId = usuario?.uid) {
    if (!userId) return;

    const produtosSnap = await getDocs(
      query(collection(db, "produtos"), where("usuarioId", "==", userId))
    );

    const lista = produtosSnap.docs
      .map((item) => {
        const dados = item.data();

        return {
          id: item.id,
          nome: String(dados.nome || ""),
          categoria: String(dados.categoria || ""),
          preco: Number(dados.preco || 0),
          quantidade: Number(dados.quantidade || 0),
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));

    setProdutos(lista);
  }

  useEffect(() => {
    let unsubscribeProdutos: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setUsuario(user);
      setCarregando(true);

      const produtosRef = collection(db, "produtos");
      const produtosQuery = query(produtosRef, where("usuarioId", "==", user.uid));

      unsubscribeProdutos = onSnapshot(
        produtosQuery,
        (snapshot) => {
          const lista = snapshot.docs
            .map((item) => {
              const dados = item.data();

              return {
                id: item.id,
                nome: String(dados.nome || ""),
                categoria: String(dados.categoria || ""),
                preco: Number(dados.preco || 0),
                quantidade: Number(dados.quantidade || 0),
              };
            })
            .sort((a, b) => a.nome.localeCompare(b.nome));

          setProdutos(lista);
          setCarregando(false);
        },
        (error) => {
          Alert.alert("Erro ao carregar produtos", error.message);
          setCarregando(false);
        }
      );
    });

    return () => {
      unsubscribeProdutos?.();
      unsubscribeAuth();
    };
  }, []);

  function limparFormulario() {
    setNome("");
    setCategoria("");
    setPreco("");
    setQuantidade("");
    setProdutoEditandoId(null);
  }

  function validarFormulario() {
    if (!nome.trim() || !categoria.trim() || !preco.trim() || !quantidade.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return false;
    }

    if (Number.isNaN(Number(preco)) || Number.isNaN(Number(quantidade))) {
      Alert.alert("Atenção", "Preço e quantidade devem ser números.");
      return false;
    }

    return true;
  }

  async function salvarProduto() {
    if (!usuario || !validarFormulario()) return;

    const dadosProduto = {
      nome: nome.trim(),
      categoria: categoria.trim(),
      preco: Number(preco),
      quantidade: Number(quantidade),
      usuarioId: usuario.uid,
      atualizadoEm: serverTimestamp(),
    };

    try {
      setSalvando(true);

      if (produtoEditandoId) {
        await updateDoc(doc(db, "produtos", produtoEditandoId), dadosProduto);
        setProdutos((listaAtual) =>
          listaAtual
            .map((produto) =>
              produto.id === produtoEditandoId
                ? {
                    id: produto.id,
                    nome: dadosProduto.nome,
                    categoria: dadosProduto.categoria,
                    preco: dadosProduto.preco,
                    quantidade: dadosProduto.quantidade,
                  }
                : produto
            )
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
        Alert.alert("Sucesso", "Item atualizado com sucesso.");
      } else {
        const produtoRef = await addDoc(collection(db, "produtos"), {
          ...dadosProduto,
          criadoEm: serverTimestamp(),
        });
        setProdutos((listaAtual) =>
          [
            ...listaAtual,
            {
              id: produtoRef.id,
              nome: dadosProduto.nome,
              categoria: dadosProduto.categoria,
              preco: dadosProduto.preco,
              quantidade: dadosProduto.quantidade,
            },
          ].sort((a, b) => a.nome.localeCompare(b.nome))
        );
        Alert.alert("Sucesso", "Item cadastrado com sucesso.");
      }

      await carregarProdutos(usuario.uid);
      limparFormulario();
    } catch (error: any) {
      Alert.alert("Erro ao salvar", error.message);
    } finally {
      setSalvando(false);
    }
  }

  function editarProduto(produto: Produto) {
    setProdutoEditandoId(produto.id);
    setNome(produto.nome);
    setCategoria(produto.categoria);
    setPreco(String(produto.preco));
    setQuantidade(String(produto.quantidade));
  }

  function confirmarExclusao(produto: Produto) {
    Alert.alert("Excluir Item", `Deseja excluir "${produto.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => excluirProduto(produto.id) },
    ]);
  }

  async function excluirProduto(id: string) {
    try {
      await deleteDoc(doc(db, "produtos", id));
      if (produtoEditandoId === id) limparFormulario();
      Alert.alert("Sucesso", "Item excluído com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro ao excluir", error.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={COLORS.text} name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insumos & Produtos</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        ListHeaderComponent={
          <View>
            <Text style={styles.subtitulo}>Controle de estoque de produtos químicos e higienizadores.</Text>

            <View style={styles.formulario}>
              <Text style={styles.formTitulo}>{tituloFormulario}</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  onChangeText={setNome}
                  placeholder="Nome do insumo/produto"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  value={nome}
                />
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  onChangeText={setCategoria}
                  placeholder="Categoria (ex: Detergentes, Desinfetantes)"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  value={categoria}
                />
              </View>

              <View style={styles.linha}>
                <View style={[styles.inputWrap, styles.inputLinha]}>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setPreco}
                    placeholder="Preço (R$)"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.input}
                    value={preco}
                  />
                </View>

                <View style={[styles.inputWrap, styles.inputLinha]}>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={setQuantidade}
                    placeholder="Quantidade"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.input}
                    value={quantidade}
                  />
                </View>
              </View>

              <TouchableOpacity
                disabled={salvando}
                onPress={salvarProduto}
                style={[styles.botaoPrimario, salvando && styles.botaoDesabilitado]}
              >
                <Text style={styles.textoBotao}>
                  {salvando ? "SALVANDO..." : produtoEditandoId ? "ATUALIZAR ITEM" : "CADASTRAR ITEM"}
                </Text>
              </TouchableOpacity>

              {produtoEditandoId ? (
                <TouchableOpacity onPress={limparFormulario} style={styles.botaoSecundario}>
                  <Text style={styles.textoSecundario}>CANCELAR EDIÇÃO</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.listaTitulo}>Itens Cadastrados</Text>
            {carregando ? <ActivityIndicator color={COLORS.accent} style={styles.loading} /> : null}
          </View>
        }
        contentContainerStyle={styles.conteudo}
        data={produtos}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !carregando ? <Text style={styles.vazio}>Nenhum insumo cadastrado.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.produtoCard}>
            <View style={styles.produtoInfo}>
              <Text style={styles.produtoNome}>{item.nome}</Text>
              <Text style={styles.produtoDetalhe}>
                {item.categoria}  •  R$ {item.preco.toFixed(2)}  •  Estoque: {item.quantidade}
              </Text>
            </View>

            <View style={styles.acoes}>
              <TouchableOpacity onPress={() => editarProduto(item)} style={styles.botaoEditar}>
                <Text style={styles.textoAcao}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => confirmarExclusao(item)} style={styles.botaoExcluir}>
                <Text style={styles.textoAcao}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  formulario: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  formTitulo: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },
  inputWrap: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  input: {
    color: COLORS.text,
    fontSize: 15,
    minHeight: 46,
  },
  linha: {
    flexDirection: "row",
    gap: 10,
  },
  inputLinha: {
    flex: 1,
  },
  botaoPrimario: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoSecundario: {
    alignItems: "center",
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
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
  listaTitulo: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  loading: {
    marginVertical: 16,
  },
  vazio: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
  },
  produtoCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  produtoInfo: {
    marginBottom: 12,
  },
  produtoNome: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  produtoDetalhe: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  acoes: {
    flexDirection: "row",
    gap: 10,
  },
  botaoEditar: {
    alignItems: "center",
    backgroundColor: "rgba(108, 92, 231, 0.12)",
    borderColor: "rgba(108, 92, 231, 0.3)",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  botaoExcluir: {
    alignItems: "center",
    backgroundColor: "rgba(225, 112, 85, 0.08)",
    borderColor: "rgba(225, 112, 85, 0.2)",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  textoAcao: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 13,
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

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
    () => (produtoEditandoId ? "Editar produto" : "Novo produto"),
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
      Alert.alert("Atenção", "Preencha todos os campos do produto.");
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
        Alert.alert("Sucesso", "Produto atualizado com sucesso.");
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
        Alert.alert("Sucesso", "Produto cadastrado com sucesso.");
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
    Alert.alert("Excluir produto", `Deseja excluir "${produto.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => excluirProduto(produto.id) },
    ]);
  }

  async function excluirProduto(id: string) {
    try {
      await deleteDoc(doc(db, "produtos", id));
      if (produtoEditandoId === id) limparFormulario();
      Alert.alert("Sucesso", "Produto excluído com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro ao excluir", error.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <View>
            <Text style={styles.titulo}>Cadastro de Produtos</Text>
            <Text style={styles.subtitulo}>Cadastre, consulte, edite e exclua produtos.</Text>

            <View style={styles.formulario}>
              <Text style={styles.formTitulo}>{tituloFormulario}</Text>

              <TextInput
                onChangeText={setNome}
                placeholder="Nome do produto"
                placeholderTextColor="#6B7280"
                style={styles.input}
                value={nome}
              />

              <TextInput
                onChangeText={setCategoria}
                placeholder="Categoria"
                placeholderTextColor="#6B7280"
                style={styles.input}
                value={categoria}
              />

              <View style={styles.linha}>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setPreco}
                  placeholder="Preço"
                  placeholderTextColor="#6B7280"
                  style={[styles.input, styles.inputLinha]}
                  value={preco}
                />

                <TextInput
                  keyboardType="number-pad"
                  onChangeText={setQuantidade}
                  placeholder="Qtd."
                  placeholderTextColor="#6B7280"
                  style={[styles.input, styles.inputLinha]}
                  value={quantidade}
                />
              </View>

              <TouchableOpacity
                disabled={salvando}
                onPress={salvarProduto}
                style={[styles.botaoPrimario, salvando && styles.botaoDesabilitado]}
              >
                <Text style={styles.textoBotao}>
                  {salvando ? "SALVANDO..." : produtoEditandoId ? "ATUALIZAR" : "CADASTRAR"}
                </Text>
              </TouchableOpacity>

              {produtoEditandoId ? (
                <TouchableOpacity onPress={limparFormulario} style={styles.botaoSecundario}>
                  <Text style={styles.textoSecundario}>CANCELAR EDIÇÃO</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.listaTitulo}>Produtos cadastrados</Text>
            {carregando ? <ActivityIndicator color="#0F766E" style={styles.loading} /> : null}
          </View>
        }
        contentContainerStyle={styles.conteudo}
        data={produtos}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !carregando ? <Text style={styles.vazio}>Nenhum produto cadastrado.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.produtoCard}>
            <View style={styles.produtoInfo}>
              <Text style={styles.produtoNome}>{item.nome}</Text>
              <Text style={styles.produtoDetalhe}>
                {item.categoria} | R$ {item.preco.toFixed(2)} | Qtd: {item.quantidade}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  conteudo: {
    padding: 20,
    paddingBottom: 34,
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
    marginBottom: 18,
    marginTop: 6,
  },
  formulario: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 22,
    padding: 16,
  },
  formTitulo: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    marginBottom: 12,
    padding: 13,
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
    backgroundColor: "#0F766E",
    borderRadius: 8,
    padding: 14,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoSecundario: {
    alignItems: "center",
    borderColor: "#94A3B8",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 13,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  textoSecundario: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  listaTitulo: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  loading: {
    marginVertical: 16,
  },
  vazio: {
    color: "#64748B",
    fontSize: 15,
    textAlign: "center",
  },
  produtoCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  produtoInfo: {
    marginBottom: 12,
  },
  produtoNome: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
  produtoDetalhe: {
    color: "#475569",
    fontSize: 14,
    marginTop: 4,
  },
  acoes: {
    flexDirection: "row",
    gap: 10,
  },
  botaoEditar: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    flex: 1,
    padding: 11,
  },
  botaoExcluir: {
    alignItems: "center",
    backgroundColor: "#B91C1C",
    borderRadius: 8,
    flex: 1,
    padding: 11,
  },
  textoAcao: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

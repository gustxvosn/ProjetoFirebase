import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../services/firebase";
import {
  clearDemoSession,
  getDemoName,
  isDemoActive,
  getDemoRole,
} from "../services/demoAuth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { COLORS } from "@/constants/theme";

type StatusMaquina = "Limpo" | "Sujo" | "Lavando";

type Maquina = {
  id: string;
  nome: string;
  qr: string;
  status: StatusMaquina;
  tempo: string;
  ultimoCiclo: string;
  gestorId?: string;
  gestorEmail?: string;
};

const EMAIL_GESTOR_EXEMPLO = "enricomachado1@hotmail.com";
const USUARIO_VISUALIZADOR_EXEMPLO = "Will Will";

const QRCODES_EXEMPLO = [
  { nome: "Lavadora Industrial 01", qr: "SW-ENR-001", status: "Limpo" as StatusMaquina, tempo: "Pronta" },
  { nome: "Secadora Profissional 02", qr: "SW-ENR-002", status: "Lavando" as StatusMaquina, tempo: "18 min" },
  { nome: "Autoclave Central", qr: "SW-ENR-003", status: "Sujo" as StatusMaquina, tempo: "Pendente" },
];

function criarCodigoChave() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";

  for (let index = 0; index < 8; index += 1) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }

  return codigo;
}

function statusConfig(status: StatusMaquina) {
  if (status === "Limpo") {
    return {
      color: COLORS.success,
      icon: "checkmark-circle" as const,
      label: "Higienizado",
      description: "Equipamento pronto para uso",
    };
  }

  if (status === "Sujo") {
    return {
      color: COLORS.danger,
      icon: "alert-circle" as const,
      label: "Pendente",
      description: "Necessita de higienização",
    };
  }

  return {
    color: COLORS.accent,
    icon: "sync" as const,
    label: "Em Processo",
    description: "Ciclo de higienização ativo",
  };
}

async function semearQrcodesExemplo(user: User, gestorId: string, gestorEmail: string) {
  if (user.email?.toLowerCase() !== EMAIL_GESTOR_EXEMPLO) return;
  if (gestorId !== user.uid) return;

  const existentes = await getDocs(
    query(collection(db, "qrcodes"), where("gestorId", "==", gestorId))
  );

  if (!existentes.empty) return;

  await Promise.all(
    QRCODES_EXEMPLO.map((item) =>
      addDoc(collection(db, "qrcodes"), {
        nome: item.nome,
        codigo: item.qr,
        status: item.status,
        tempo: item.tempo,
        ultimoEvento: "QR code inicial criado para demonstração",
        gestorId,
        gestorEmail,
        criadoPor: user.uid,
        criadoPorEmail: user.email,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      })
    )
  );
}

export default function Home() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfilUsuario, setPerfilUsuario] = useState<string>("cliente");
  const [nomeExibicao, setNomeExibicao] = useState<string>("");
  const [equipeId, setEquipeId] = useState("");
  const [equipeEmail, setEquipeEmail] = useState("");
  const [adminSession, setAdminSession] = useState(false);
  const [visualizacaoSomente, setVisualizacaoSomente] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [codigoBusca, setCodigoBusca] = useState("");
  const [buscandoCodigo, setBuscandoCodigo] = useState(false);
  const [codigoFocused, setCodigoFocused] = useState(false);
  const [listaQrsAberta, setListaQrsAberta] = useState(false);
  const [statusSalvando, setStatusSalvando] = useState<StatusMaquina | null>(null);
  
  // States para Geração de Chave (Gestor)
  const [novaChavePerfil, setNovaChavePerfil] = useState<string>("cliente");
  const [chaveGerada, setChaveGerada] = useState<string | null>(null);
  const [gerandoChave, setGerandoChave] = useState(false);

  const bubble = useRef(new Animated.Value(0)).current;

  const selecionada = useMemo(
    () => maquinas.find((maquina) => maquina.id === selecionadaId) || maquinas[0],
    [maquinas, selecionadaId]
  );

  const resumo = useMemo(
    () => ({
      limpas: maquinas.filter((maquina) => maquina.status === "Limpo").length,
      sujas: maquinas.filter((maquina) => maquina.status === "Sujo").length,
      lavando: maquinas.filter((maquina) => maquina.status === "Lavando").length,
    }),
    [maquinas]
  );
  const podeVisualizarQrs = perfilUsuario === "gestor" || perfilUsuario === "funcionario" || visualizacaoSomente;
  const podeAlterarQrs = !visualizacaoSomente && (perfilUsuario === "gestor" || perfilUsuario === "funcionario");

  useEffect(() => {
    let unsubscribeQrcodes: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const demoIsActive = isDemoActive();
      setAdminSession(demoIsActive);

      if (!user && !demoIsActive) {
        setCarregando(false);
        router.replace("/login");
        return;
      }

      setUsuario(user);

      if (demoIsActive) {
        setPerfilUsuario(getDemoRole() || "cliente");
        setNomeExibicao(getDemoName());
      } else if (user) {
        try {
          const userDoc = await getDoc(doc(db, "usuarios", user.uid));
          let gestorDaEquipe = user.uid;
          let emailDaEquipe = user.email || "";

          if (userDoc.exists()) {
            const dados = userDoc.data();
            const perfil = dados?.perfil || "cliente";
            const nomeUsuario = String(dados?.nome || user.email || "");
            const usuarioVisualizador = nomeUsuario.trim().toLowerCase() === USUARIO_VISUALIZADOR_EXEMPLO.toLowerCase();
            gestorDaEquipe = usuarioVisualizador ? "" : dados?.gestorId || user.uid;
            emailDaEquipe = usuarioVisualizador ? EMAIL_GESTOR_EXEMPLO : dados?.gestorEmail || user.email || "";
            setPerfilUsuario(perfil);
            setNomeExibicao(nomeUsuario);
            setVisualizacaoSomente(usuarioVisualizador);
          } else {
            setPerfilUsuario("cliente");
            setNomeExibicao(user.email || "Usuário");
            setVisualizacaoSomente(false);
          }

          setEquipeId(gestorDaEquipe);
          setEquipeEmail(emailDaEquipe);
          await semearQrcodesExemplo(user, gestorDaEquipe, emailDaEquipe);

          unsubscribeQrcodes?.();
          const qrcodesQuery = gestorDaEquipe
            ? query(collection(db, "qrcodes"), where("gestorId", "==", gestorDaEquipe))
            : query(collection(db, "qrcodes"), where("gestorEmail", "==", emailDaEquipe));

          unsubscribeQrcodes = onSnapshot(
            qrcodesQuery,
            (snapshot) => {
              const lista = snapshot.docs
                .map((item) => {
                  const dados = item.data();
                  return {
                    id: item.id,
                    nome: String(dados.nome || ""),
                    qr: String(dados.codigo || ""),
                    status: (dados.status || "Sujo") as StatusMaquina,
                    tempo: String(dados.tempo || "Pendente"),
                    ultimoCiclo: String(dados.ultimoEvento || "Sem histórico"),
                    gestorId: String(dados.gestorId || ""),
                    gestorEmail: String(dados.gestorEmail || ""),
                  };
                })
                .sort((a, b) => a.nome.localeCompare(b.nome));

              setMaquinas(lista);
              setSelecionadaId((atual) => (atual && lista.some((item) => item.id === atual) ? atual : lista[0]?.id || null));
            },
            (error) => {
              Alert.alert("Erro ao carregar QR codes", error.message);
            }
          );
        } catch (error) {
          console.error("Erro ao buscar perfil", error);
        }
      }
      setCarregando(false);
    });

    return () => {
      unsubscribeQrcodes?.();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bubble, {
          duration: 1800,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(bubble, {
          duration: 0,
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [bubble]);

  async function sair() {
    try {
      clearDemoSession();
      setAdminSession(false);
      if (auth.currentUser) {
        await signOut(auth);
      }
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Erro ao sair", error.message);
    }
  }

  async function atualizarStatus(status: StatusMaquina) {
    if (!selecionada) return;

    const statusLabels = {
      Limpo: "Higienizado",
      Sujo: "Pendente",
      Lavando: "Em Processo"
    };

    try {
      setStatusSalvando(status);
      await updateDoc(doc(db, "qrcodes", selecionada.id), {
        status,
        tempo: status === "Lavando" ? "18 min" : status === "Limpo" ? "Pronta" : "Pendente",
        ultimoEvento: `Status alterado para ${statusLabels[status]}`,
        atualizadoEm: serverTimestamp(),
      });
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível atualizar o QR code.");
    } finally {
      setStatusSalvando(null);
    }
  }

  function simularLeituraQr() {
    router.push("/camera");
  }

  function gerarQrCode() {
    router.push("/gerar-qr");
  }

  async function buscarQrPorCodigo() {
    const codigo = codigoBusca.trim().toUpperCase();

    if (!codigo) {
      Alert.alert("Atenção", "Digite o código do QR code.");
      return;
    }

    if (!equipeId && !equipeEmail) {
      Alert.alert("Atenção", "Não foi possível identificar sua equipe.");
      return;
    }

    try {
      setBuscandoCodigo(true);
      const filtroEquipe = equipeId ? where("gestorId", "==", equipeId) : where("gestorEmail", "==", equipeEmail);
      const snapshot = await getDocs(query(collection(db, "qrcodes"), where("codigo", "==", codigo), filtroEquipe));

      if (snapshot.empty) {
        Alert.alert("QR code não encontrado", "Nenhum QR code desta equipe foi encontrado com esse código.");
        return;
      }

      setSelecionadaId(snapshot.docs[0].id);
      Alert.alert("QR code encontrado", "O equipamento foi carregado no painel.");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível buscar o QR code.");
    } finally {
      setBuscandoCodigo(false);
    }
  }

  function selecionarQrPorLista(maquina: Maquina) {
    setSelecionadaId(maquina.id);
    setCodigoBusca(maquina.qr);
    setListaQrsAberta(false);
  }

  async function gerarChaveAcesso() {
    if (!usuario || !equipeId) {
      Alert.alert("Atenção", "Entre com um usuário do Firebase para gerar chaves.");
      return;
    }

    if (novaChavePerfil === "gestor" && !adminSession) {
      Alert.alert("Acesso restrito", "Apenas o admin pode gerar chaves para gestores.");
      return;
    }

    try {
      setGerandoChave(true);
      let chave = criarCodigoChave();
      let docRef = doc(collection(db, "chaves_cadastro"), chave);

      while ((await getDoc(docRef)).exists()) {
        chave = criarCodigoChave();
        docRef = doc(collection(db, "chaves_cadastro"), chave);
      }
      
      await setDoc(docRef, {
        chave: chave,
        perfil: novaChavePerfil,
        gestorId: novaChavePerfil === "gestor" ? null : equipeId,
        gestorEmail: novaChavePerfil === "gestor" ? null : equipeEmail,
        criadoPor: usuario.uid,
        criadoPorEmail: usuario.email,
        usada: false,
        criadoEm: serverTimestamp()
      });
      
      setChaveGerada(chave);
    } catch (e: any) {
      const mensagem =
        e?.code === "permission-denied" || e?.code === "firestore/permission-denied"
          ? "O Firestore bloqueou a geração. Publique as regras atualizadas e tente novamente."
          : "Não foi possível gerar a chave de acesso.";

      Alert.alert("Erro", mensagem);
      console.error(e);
    } finally {
      setGerandoChave(false);
    }
  }

  function onRefresh() {
    setAtualizando(true);
    setTimeout(() => setAtualizando(false), 650);
  }

  if (carregando) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  const status = statusConfig(selecionada?.status || "Sujo");
  const bubbleTranslate = bubble.interpolate({
    inputRange: [0, 1],
    outputRange: [14, -14],
  });
  const bubbleOpacity = bubble.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [0.2, 0.7, 0.15],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[COLORS.accent]}
            onRefresh={onRefresh}
            refreshing={atualizando}
            tintColor={COLORS.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.eyebrow}>Smart Wash</Text>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Olá, {nomeExibicao}.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push("/produtos")} style={styles.headerActionButton}>
              <Ionicons color={COLORS.accentLight} name="cube-outline" size={20} />
            </Pressable>
            <Pressable onPress={() => router.push("/perfil")} style={styles.headerActionButton}>
              <Ionicons color={COLORS.accentLight} name="person-outline" size={20} />
            </Pressable>
            <Pressable onPress={sair} style={styles.logoutButton}>
              <Ionicons color={COLORS.danger} name="log-out-outline" size={20} />
            </Pressable>
          </View>
        </View>

        {perfilUsuario === "gestor" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gerar Chave de Acesso</Text>
            </View>
            <View style={styles.keyGeneratorCard}>
              <Text style={styles.label}>Perfil para a nova conta:</Text>
              <View style={styles.roleSelector}>
                <Pressable 
                  style={[styles.roleButton, novaChavePerfil === "cliente" && styles.roleButtonActive]}
                  onPress={() => setNovaChavePerfil("cliente")}
                >
                  <Text style={[styles.roleText, novaChavePerfil === "cliente" && styles.roleTextActive]}>Cliente</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.roleButton, novaChavePerfil === "funcionario" && styles.roleButtonActive]}
                  onPress={() => setNovaChavePerfil("funcionario")}
                >
                  <Text style={[styles.roleText, novaChavePerfil === "funcionario" && styles.roleTextActive]}>Funcionário</Text>
                </Pressable>
                
                {adminSession ? (
                  <Pressable
                    style={[styles.roleButton, novaChavePerfil === "gestor" && styles.roleButtonActive]}
                    onPress={() => setNovaChavePerfil("gestor")}
                  >
                    <Text style={[styles.roleText, novaChavePerfil === "gestor" && styles.roleTextActive]}>Gestor</Text>
                  </Pressable>
                ) : null}
              </View>

              <Pressable 
                style={[styles.generateButton, gerandoChave && styles.pressed]} 
                onPress={gerarChaveAcesso}
                disabled={gerandoChave}
              >
                {gerandoChave ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.generateButtonText}>Gerar Chave</Text>
                )}
              </Pressable>

              {chaveGerada && (
                <View style={styles.generatedKeyBox}>
                  <Text style={styles.generatedKeyLabel}>Sua chave gerada:</Text>
                  <Text style={styles.generatedKeyValue} selectable>{chaveGerada}</Text>
                  <Text style={styles.generatedKeyHelp}>Copie e envie para o novo usuário.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {podeVisualizarQrs && (
          <>
            {/* Summary Counter Grid */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons color={COLORS.success} name="checkmark-circle" size={20} />
                <Text style={styles.summaryValue}>{resumo.limpas}</Text>
                <Text style={styles.summaryLabel}>Higienizadas</Text>
              </View>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons color={COLORS.accent} name="cached" size={20} />
                <Text style={styles.summaryValue}>{resumo.lavando}</Text>
                <Text style={styles.summaryLabel}>Processando</Text>
              </View>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons color={COLORS.danger} name="alert-decagram" size={20} />
                <Text style={styles.summaryValue}>{resumo.sujas}</Text>
                <Text style={styles.summaryLabel}>Pendentes</Text>
              </View>
            </View>

            <View style={styles.actionGrid}>
              {!visualizacaoSomente ? (
                <Pressable onPress={simularLeituraQr} style={({ pressed }) => [styles.actionGridCard, pressed && styles.pressed]}>
                  <View style={styles.qrMark}>
                    <MaterialCommunityIcons color={COLORS.white} name="qrcode-scan" size={24} />
                  </View>
                  <Text style={styles.actionGridTitle}>Escanear QR</Text>
                </Pressable>
              ) : null}

              {perfilUsuario === "gestor" && !visualizacaoSomente ? (
                <Pressable onPress={gerarQrCode} style={({ pressed }) => [styles.actionGridCard, pressed && styles.pressed]}>
                  <View style={[styles.qrMark, { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border }]}>
                    <MaterialCommunityIcons color={COLORS.accent} name="qrcode-plus" size={24} />
                  </View>
                  <Text style={[styles.actionGridTitle, { color: COLORS.accent }]}>Gerar QR</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.searchCard}>
              <Text style={styles.searchTitle}>Buscar QR por código</Text>
              <Text style={styles.searchSubtitle}>Digite o código impresso na etiqueta para carregar o equipamento.</Text>
              <View style={[styles.searchInputWrap, codigoFocused && styles.searchInputFocused]}>
                <Ionicons color={codigoFocused ? COLORS.accent : COLORS.textMuted} name="search" size={19} />
                <TextInput
                  autoCapitalize="characters"
                  onBlur={() => setCodigoFocused(false)}
                  onChangeText={setCodigoBusca}
                  onFocus={() => setCodigoFocused(true)}
                  placeholder="Ex: SW-ENR-001"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.searchInput}
                  value={codigoBusca}
                />
              </View>
              <Pressable
                disabled={buscandoCodigo}
                onPress={() => setListaQrsAberta((aberta) => !aberta)}
                style={({ pressed }) => [styles.searchButton, pressed && !buscandoCodigo && styles.pressed]}
              >
                {buscandoCodigo ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons color={COLORS.white} name={listaQrsAberta ? "chevron-up" : "list"} size={18} />
                    <Text style={styles.searchButtonText}>Puxar QR code</Text>
                  </>
                )}
              </Pressable>

              {codigoBusca.trim() ? (
                <Pressable
                  disabled={buscandoCodigo}
                  onPress={buscarQrPorCodigo}
                  style={({ pressed }) => [styles.searchSecondaryButton, pressed && !buscandoCodigo && styles.pressed]}
                >
                  <Ionicons color={COLORS.accentLight} name="search" size={17} />
                  <Text style={styles.searchSecondaryText}>Buscar código digitado</Text>
                </Pressable>
              ) : null}

              {listaQrsAberta ? (
                <View style={styles.qrListBox}>
                  {maquinas.length ? (
                    maquinas.map((maquina) => (
                      <Pressable
                        key={maquina.id}
                        onPress={() => selecionarQrPorLista(maquina)}
                        style={({ pressed }) => [
                          styles.qrListItem,
                          maquina.id === selecionadaId && styles.qrListItemActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={styles.qrListIcon}>
                          <MaterialCommunityIcons color={COLORS.accentLight} name="qrcode" size={20} />
                        </View>
                        <View style={styles.qrListCopy}>
                          <Text style={styles.qrListName}>{maquina.nome}</Text>
                          <Text style={styles.qrListCode}>{maquina.qr}</Text>
                        </View>
                        <Ionicons color={COLORS.textMuted} name="chevron-forward" size={18} />
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.qrListEmpty}>Nenhum QR code gerado para esta equipe.</Text>
                  )}
                </View>
              ) : null}
            </View>
          </>
        )}

        {!selecionada ? (
          <View style={styles.machineCard}>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons color={COLORS.accentLight} name="qrcode-scan" size={42} />
              <Text style={styles.emptyTitle}>Nenhum QR code cadastrado</Text>
              <Text style={styles.emptyText}>
                Gere o primeiro QR code para começar a acompanhar os equipamentos desta equipe.
              </Text>
               {perfilUsuario === "gestor" && !visualizacaoSomente ? (
                <Pressable onPress={gerarQrCode} style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Gerar QR code</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : (
        <View style={styles.machineCard}>
          <View style={styles.machineTop}>
            <View>
              <Text style={styles.machineId}>{selecionada.qr}</Text>
              <Text style={styles.machineName}>{selecionada.nome}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${status.color}15`, borderColor: status.color }]}>
              <Ionicons color={status.color} name={status.icon} size={15} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.statusStage}>
            <View style={[styles.statusIconWrap, { borderColor: `${status.color}30` }]}>
              {selecionada.status === "Lavando" ? (
                <MaterialCommunityIcons color={status.color} name="cached" size={54} />
              ) : (
                <Ionicons color={status.color} name={status.icon} size={54} />
              )}
              {selecionada.status === "Lavando" ? (
                <>
                  <Animated.View
                    style={[
                      styles.bubble,
                      styles.bubbleOne,
                      { opacity: bubbleOpacity, transform: [{ translateY: bubbleTranslate }] },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.bubble,
                      styles.bubbleTwo,
                      { opacity: bubbleOpacity, transform: [{ translateY: bubbleTranslate }] },
                    ]}
                  />
                </>
              ) : null}
            </View>
            <Text style={styles.statusDescription}>{status.description}</Text>
            <View style={styles.timerRow}>
              <Ionicons color={COLORS.accentLight} name="time-outline" size={16} />
              <Text style={styles.timerText}>{selecionada.tempo}</Text>
            </View>
          </View>

          {/* Action Row to change Status - Only for gestor and funcionario */}
          {podeAlterarQrs ? (
            <View style={styles.actionRow}>
              {(["Limpo", "Sujo", "Lavando"] as StatusMaquina[]).map((item) => {
                const itemConfig = statusConfig(item);
                const active = item === selecionada.status;

                return (
                  <Pressable
                    disabled={statusSalvando !== null}
                    key={item}
                    onPress={() => atualizarStatus(item)}
                    style={({ pressed }) => [
                      styles.actionButton,
                      active && { backgroundColor: `${itemConfig.color}15`, borderColor: itemConfig.color },
                      statusSalvando === item && styles.actionButtonSaving,
                      pressed && styles.pressed,
                    ]}
                  >
                    {statusSalvando === item ? (
                      <ActivityIndicator color={itemConfig.color} size="small" />
                    ) : item === "Lavando" ? (
                      <MaterialCommunityIcons color={itemConfig.color} name="cached" size={18} />
                    ) : (
                      <Ionicons color={itemConfig.color} name={itemConfig.icon} size={18} />
                    )}
                    <Text style={[styles.actionText, active && { color: itemConfig.color }]}>
                      {statusSalvando === item ? "Salvando..." : item === "Limpo" ? "Limpo" : item === "Sujo" ? "Sujo" : "Processar"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.readOnlyBox}>
              <Ionicons color={COLORS.accentLight} name="eye-outline" size={18} />
              <Text style={styles.readOnlyText}>Visualização apenas: este usuário acompanha os QR codes, sem alterar estados.</Text>
            </View>
          )}
        </View>
        )}

        {/* Notification card - All users */}
        <View style={styles.section}>
          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <Ionicons color={COLORS.accent} name="notifications" size={20} />
            </View>
            <View style={styles.notificationCopy}>
              <Text style={styles.notificationTitle}>Alertas Push Ativos</Text>
              <Text style={styles.notificationText}>
                Você receberá um aviso operacional assim que um ciclo de equipamento for concluído.
              </Text>
            </View>
          </View>
        </View>

        {selecionada ? <Text style={styles.lastUpdate}>Última atualização: {selecionada.ultimoCiclo}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  loadingScreen: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.accentLight,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  headerActionButton: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#2A111A",
    borderColor: "#7F1D3A",
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minHeight: 88,
    justifyContent: "center",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  scanCard: {
    alignItems: "center",
    backgroundColor: "#171225",
    borderColor: "#5B3EA6",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
    padding: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  qrMark: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanTextBlock: {
    flex: 1,
  },
  scanTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  scanSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  machineCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 18,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  machineTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  machineId: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  machineName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusStage: {
    alignItems: "center",
    paddingVertical: 20,
  },
  statusIconWrap: {
    alignItems: "center",
    borderRadius: 50,
    borderWidth: 2,
    height: 96,
    justifyContent: "center",
    marginBottom: 12,
    width: 96,
  },
  bubble: {
    backgroundColor: "#3B2A66",
    position: "absolute",
  },
  bubbleOne: {
    borderRadius: 8,
    height: 16,
    right: 12,
    top: 10,
    width: 16,
  },
  bubbleTwo: {
    borderRadius: 5,
    height: 10,
    left: 14,
    top: 24,
    width: 10,
  },
  statusDescription: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  timerRow: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  timerText: {
    color: COLORS.accentLight,
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minHeight: 64,
    justifyContent: "center",
    padding: 8,
  },
  actionButtonSaving: {
    opacity: 0.75,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  readOnlyBox: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    padding: 12,
  },
  readOnlyText: {
    color: COLORS.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  sectionMeta: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: "700",
  },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 10,
    height: 90,
    marginTop: 4,
  },
  chartColumn: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  chartBar: {
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    maxHeight: 80,
    minHeight: 20,
    opacity: 0.85,
    width: "100%",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  notificationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  notificationIcon: {
    alignItems: "center",
    backgroundColor: "#24183D",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  notificationText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  lastUpdate: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionGridCard: {
    alignItems: "center",
    backgroundColor: "#171225",
    borderColor: "#5B3EA6",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    paddingVertical: 16,
  },
  actionGridTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  searchCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  searchTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  searchSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  searchInputWrap: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  searchInputFocused: {
    backgroundColor: `${COLORS.accent}05`,
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  searchInput: {
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  searchSecondaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 44,
  },
  searchSecondaryText: {
    color: COLORS.accentLight,
    fontSize: 13,
    fontWeight: "800",
  },
  qrListBox: {
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
    padding: 10,
  },
  qrListItem: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  qrListItemActive: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  qrListIcon: {
    alignItems: "center",
    backgroundColor: "#171225",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  qrListCopy: {
    flex: 1,
  },
  qrListName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  qrListCode: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  qrListEmpty: {
    color: COLORS.textMuted,
    fontSize: 13,
    padding: 10,
    textAlign: "center",
  },
  financeCard: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  financeItem: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  financeLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  financeValuePositive: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  financeValueNegative: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  financeValueNeutral: {
    color: COLORS.accentLight,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  keyGeneratorCard: {
    marginTop: 4,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  roleButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  roleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  roleTextActive: {
    color: COLORS.white,
  },
  generateButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.success,
    borderRadius: 12,
    height: 48,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  generatedKeyBox: {
    marginTop: 16,
    backgroundColor: "#24183D",
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  generatedKeyLabel: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: "bold",
  },
  generatedKeyValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  generatedKeyHelp: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});

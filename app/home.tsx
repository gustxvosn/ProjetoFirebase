import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { auth } from "../services/firebase";
import {
  clearDemoSession,
  getDemoName,
  isDemoActive,
  getDemoRole,
} from "../services/demoAuth";
import { doc, getDoc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { db } from "../services/firebase";
import { COLORS } from "@/constants/theme";

type StatusMaquina = "Limpo" | "Sujo" | "Lavando";

type Maquina = {
  id: string;
  nome: string;
  qr: string;
  status: StatusMaquina;
  tempo: string;
  ultimoCiclo: string;
};

const HISTORICO = [42, 64, 48, 76, 58, 86, 69];

const MAQUINAS_INICIAIS: Maquina[] = [
  {
    id: "M-01",
    nome: "Autoclave L-01",
    qr: "QR-HYG-001",
    status: "Lavando",
    tempo: "18 min",
    ultimoCiclo: "Hoje, 13:42",
  },
  {
    id: "M-02",
    nome: "Lavadora L-02",
    qr: "QR-HYG-002",
    status: "Limpo",
    tempo: "Pronta",
    ultimoCiclo: "Hoje, 12:10",
  },
  {
    id: "M-03",
    nome: "Secadora S-01",
    qr: "QR-HYG-003",
    status: "Sujo",
    tempo: "Pendente",
    ultimoCiclo: "Ontem, 18:05",
  },
];

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

export default function Home() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [demoActive, setDemoActive] = useState(false);
  const [perfilUsuario, setPerfilUsuario] = useState<string>("cliente");
  const [nomeExibicao, setNomeExibicao] = useState<string>("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [maquinas, setMaquinas] = useState(MAQUINAS_INICIAIS);
  const [selecionadaId, setSelecionadaId] = useState(MAQUINAS_INICIAIS[0].id);
  
  // States para Geração de Chave (Gestor)
  const [novaChavePerfil, setNovaChavePerfil] = useState<string>("cliente");
  const [senhaGestor, setSenhaGestor] = useState("");
  const [senhaGestorFocused, setSenhaGestorFocused] = useState(false);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const demoIsActive = isDemoActive();
      setDemoActive(demoIsActive);

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
          if (userDoc.exists()) {
            setPerfilUsuario(userDoc.data()?.perfil || "cliente");
            setNomeExibicao(userDoc.data()?.nome || user.email);
          } else {
            setPerfilUsuario("cliente");
            setNomeExibicao(user.email || "Usuário");
          }
        } catch (error) {
          console.error("Erro ao buscar perfil", error);
        }
      }
      setCarregando(false);
    });

    return unsubscribe;
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
      if (auth.currentUser) {
        await signOut(auth);
      }
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Erro ao sair", error.message);
    }
  }

  function atualizarStatus(status: StatusMaquina) {
    const statusLabels = {
      Limpo: "Higienizado",
      Sujo: "Pendente",
      Lavando: "Em Processo"
    };
    Alert.alert("Alterar Status", `Marcar ${selecionada.nome} como ${statusLabels[status]}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: () => {
          setMaquinas((lista) =>
            lista.map((maquina) =>
              maquina.id === selecionada.id
                ? {
                    ...maquina,
                    status,
                    tempo: status === "Lavando" ? "18 min" : status === "Limpo" ? "Pronta" : "Pendente",
                    ultimoCiclo: "Agora",
                  }
                : maquina
              )
          );
        },
      },
    ]);
  }

  function simularLeituraQr() {
    router.push("/camera");
  }

  function gerarQrCode() {
    router.push("/gerar-qr");
  }

  async function gerarChaveAcesso() {
    if (senhaGestor !== "1234") {
      Alert.alert("Erro de Segurança", "Senha de administrador incorreta.");
      return;
    }
    
    try {
      setGerandoChave(true);
      const chave = Math.random().toString(36).substring(2, 8).toUpperCase();
      const docRef = doc(collection(db, "chaves_cadastro"), chave);
      
      await setDoc(docRef, {
        chave: chave,
        perfil: novaChavePerfil,
        usada: false,
        criadoEm: serverTimestamp()
      });
      
      setChaveGerada(chave);
      setSenhaGestor("");
    } catch (e: any) {
      Alert.alert("Erro", "Não foi possível gerar a chave de acesso.");
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

  const status = statusConfig(selecionada.status);
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
            <Text style={styles.eyebrow}>HygienicPro</Text>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Olá, {nomeExibicao}. Perfil: {perfilUsuario}
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
                
                <Pressable 
                  style={[styles.roleButton, novaChavePerfil === "gestor" && styles.roleButtonActive]}
                  onPress={() => setNovaChavePerfil("gestor")}
                >
                  <Text style={[styles.roleText, novaChavePerfil === "gestor" && styles.roleTextActive]}>Gestor</Text>
                </Pressable>
              </View>

              <TextInput
                style={[styles.inputGestor, senhaGestorFocused && styles.inputGestorFocused]}
                placeholder="Senha do Gestor (1234)"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={senhaGestor}
                onChangeText={setSenhaGestor}
                onFocus={() => setSenhaGestorFocused(true)}
                onBlur={() => setSenhaGestorFocused(false)}
              />

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

        {perfilUsuario === "gestor" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Controle Financeiro</Text>
            </View>
            <View style={styles.financeCard}>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Receita Diária</Text>
                <Text style={styles.financeValuePositive}>R$ 1.250,00</Text>
              </View>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Despesas</Text>
                <Text style={styles.financeValueNegative}>R$ 430,00</Text>
              </View>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Lucro Líquido</Text>
                <Text style={styles.financeValueNeutral}>R$ 820,00</Text>
              </View>
            </View>
          </View>
        )}

        {(perfilUsuario === "gestor" || perfilUsuario === "funcionario") && (
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
              <Pressable onPress={simularLeituraQr} style={({ pressed }) => [styles.actionGridCard, pressed && styles.pressed]}>
                <View style={styles.qrMark}>
                  <MaterialCommunityIcons color={COLORS.white} name="qrcode-scan" size={24} />
                </View>
                <Text style={styles.actionGridTitle}>Escanear QR</Text>
              </Pressable>

              <Pressable onPress={gerarQrCode} style={({ pressed }) => [styles.actionGridCard, pressed && styles.pressed]}>
                <View style={[styles.qrMark, { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border }]}>
                  <MaterialCommunityIcons color={COLORS.accent} name="qrcode-plus" size={24} />
                </View>
                <Text style={[styles.actionGridTitle, { color: COLORS.accent }]}>Gerar QR</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Selected Machine Detail Card */}
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
          {(perfilUsuario === "gestor" || perfilUsuario === "funcionario") && (
            <View style={styles.actionRow}>
              {(["Limpo", "Sujo", "Lavando"] as StatusMaquina[]).map((item) => {
                const itemConfig = statusConfig(item);
                const active = item === selecionada.status;

                return (
                  <Pressable
                    key={item}
                    onPress={() => atualizarStatus(item)}
                    style={({ pressed }) => [
                      styles.actionButton,
                      active && { backgroundColor: `${itemConfig.color}15`, borderColor: itemConfig.color },
                      pressed && styles.pressed,
                    ]}
                  >
                    {item === "Lavando" ? (
                      <MaterialCommunityIcons color={itemConfig.color} name="cached" size={18} />
                    ) : (
                      <Ionicons color={itemConfig.color} name={itemConfig.icon} size={18} />
                    )}
                    <Text style={[styles.actionText, active && { color: itemConfig.color }]}>
                      {item === "Limpo" ? "Limpo" : item === "Sujo" ? "Sujo" : "Processar"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Analytics Section - Only Gestor */}
        {perfilUsuario === "gestor" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Histórico de Ciclos</Text>
              <Text style={styles.sectionMeta}>Últimos 7 dias</Text>
            </View>
            <View style={styles.chart}>
              {HISTORICO.map((valor, index) => (
                <View key={`${valor}-${index}`} style={styles.chartColumn}>
                  <View style={[styles.chartBar, { height: valor }]} />
                </View>
              ))}
            </View>
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
                Você receberá um aviso operacional assim que o ciclo de {selecionada.nome} for concluído.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.lastUpdate}>Última atualização: {selecionada.ultimoCiclo}</Text>
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
    backgroundColor: "rgba(225, 112, 85, 0.08)",
    borderColor: "rgba(225, 112, 85, 0.2)",
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
    backgroundColor: "rgba(108, 92, 231, 0.1)",
    borderColor: "rgba(108, 92, 231, 0.2)",
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
    backgroundColor: "rgba(108, 92, 231, 0.2)",
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
  actionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
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
    backgroundColor: "rgba(108, 92, 231, 0.1)",
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
    backgroundColor: "rgba(108, 92, 231, 0.1)",
    borderColor: "rgba(108, 92, 231, 0.2)",
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
  inputGestor: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
  },
  inputGestorFocused: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}05`,
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
    backgroundColor: "rgba(108, 92, 231, 0.1)",
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

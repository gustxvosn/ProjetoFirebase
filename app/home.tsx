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
  View,
} from "react-native";
import { auth } from "../services/firebase";
import {
  clearDemoAdminSession,
  getDemoAdminName,
  isDemoAdminActive,
} from "../services/demoAuth";

type StatusMaquina = "Limpo" | "Sujo" | "Lavando";

type Maquina = {
  id: string;
  nome: string;
  qr: string;
  status: StatusMaquina;
  tempo: string;
  ultimoCiclo: string;
};

const COLORS = {
  background: "#F8F6F0",
  blue: "#1E88E5",
  blueDark: "#1167B8",
  ink: "#172033",
  muted: "#657080",
  card: "#FFFFFF",
  line: "#E7E0D3",
  clean: "#16A34A",
  dirty: "#F97316",
  wash: "#2BA8F8",
  danger: "#C2410C",
};

const HISTORICO = [42, 64, 48, 76, 58, 86, 69];

const MAQUINAS_INICIAIS: Maquina[] = [
  {
    id: "M-01",
    nome: "Lavadora 01",
    qr: "QR-LAV-001",
    status: "Lavando",
    tempo: "18 min",
    ultimoCiclo: "Hoje, 13:42",
  },
  {
    id: "M-02",
    nome: "Lavadora 02",
    qr: "QR-LAV-002",
    status: "Limpo",
    tempo: "Pronta",
    ultimoCiclo: "Hoje, 12:10",
  },
  {
    id: "M-03",
    nome: "Secadora 01",
    qr: "QR-SEC-003",
    status: "Sujo",
    tempo: "Aguardando",
    ultimoCiclo: "Ontem, 18:05",
  },
];

function statusConfig(status: StatusMaquina) {
  if (status === "Limpo") {
    return {
      color: COLORS.clean,
      icon: "checkmark-circle" as const,
      label: "Limpo",
      description: "Pronto para o proximo uso",
    };
  }

  if (status === "Sujo") {
    return {
      color: COLORS.dirty,
      icon: "alert-circle" as const,
      label: "Sujo",
      description: "Precisa de higienizacao",
    };
  }

  return {
    color: COLORS.wash,
    icon: "water" as const,
    label: "Lavando",
    description: "Ciclo em andamento",
  };
}

export default function Home() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [demoAdmin, setDemoAdmin] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [maquinas, setMaquinas] = useState(MAQUINAS_INICIAIS);
  const [selecionadaId, setSelecionadaId] = useState(MAQUINAS_INICIAIS[0].id);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const adminAtivo = isDemoAdminActive();
      setUsuario(user);
      setDemoAdmin(adminAtivo);
      setCarregando(false);

      if (!user && !adminAtivo) {
        router.replace("/login");
      }
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
      clearDemoAdminSession();
      if (auth.currentUser) {
        await signOut(auth);
      }
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Erro ao sair", error.message);
    }
  }

  function atualizarStatus(status: StatusMaquina) {
    Alert.alert("Alterar status", `Marcar ${selecionada.nome} como ${status}?`, [
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
                    tempo: status === "Lavando" ? "18 min" : status === "Limpo" ? "Pronta" : "Aguardando",
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
    const indiceAtual = maquinas.findIndex((maquina) => maquina.id === selecionada.id);
    const proxima = maquinas[(indiceAtual + 1) % maquinas.length];
    setSelecionadaId(proxima.id);
    Alert.alert("QR Code lido", `${proxima.qr} identificado como ${proxima.nome}.`);
  }

  function onRefresh() {
    setAtualizando(true);
    setTimeout(() => setAtualizando(false), 650);
  }

  if (carregando) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={COLORS.blue} size="large" />
      </View>
    );
  }

  const status = statusConfig(selecionada.status);
  const nomeUsuario = demoAdmin ? getDemoAdminName() : usuario?.displayName || usuario?.email;
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
            colors={[COLORS.blue]}
            onRefresh={onRefresh}
            refreshing={atualizando}
            tintColor={COLORS.blue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Painel digital</Text>
            <Text style={styles.title}>Lavanderia</Text>
            <Text style={styles.subtitle}>
              Ola, {nomeUsuario}. Monitore maquinas por QR Code.
            </Text>
          </View>

          <Pressable onPress={sair} style={styles.logoutButton}>
            <Ionicons color={COLORS.danger} name="log-out-outline" size={20} />
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons color={COLORS.clean} name="checkmark-circle" size={20} />
            <Text style={styles.summaryValue}>{resumo.limpas}</Text>
            <Text style={styles.summaryLabel}>Limpas</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons color={COLORS.wash} name="waves" size={20} />
            <Text style={styles.summaryValue}>{resumo.lavando}</Text>
            <Text style={styles.summaryLabel}>Lavando</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons color={COLORS.dirty} name="alert-decagram" size={20} />
            <Text style={styles.summaryValue}>{resumo.sujas}</Text>
            <Text style={styles.summaryLabel}>Sujas</Text>
          </View>
        </View>

        <Pressable onPress={simularLeituraQr} style={({ pressed }) => [styles.scanCard, pressed && styles.pressed]}>
          <View style={styles.qrMark}>
            <MaterialCommunityIcons color={COLORS.blue} name="qrcode-scan" size={34} />
          </View>
          <View style={styles.scanTextBlock}>
            <Text style={styles.scanTitle}>Escanear QR Code</Text>
            <Text style={styles.scanSubtitle}>Toque para identificar a proxima maquina.</Text>
          </View>
          <Ionicons color={COLORS.blue} name="chevron-forward" size={22} />
        </Pressable>

        <View style={styles.machineCard}>
          <View style={styles.machineTop}>
            <View>
              <Text style={styles.machineId}>{selecionada.qr}</Text>
              <Text style={styles.machineName}>{selecionada.nome}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${status.color}18` }]}>
              <Ionicons color={status.color} name={status.icon} size={17} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.statusStage}>
            <View style={[styles.statusIconWrap, { borderColor: `${status.color}55` }]}>
              <Ionicons color={status.color} name={status.icon} size={54} />
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
              <Ionicons color={COLORS.blueDark} name="time-outline" size={18} />
              <Text style={styles.timerText}>{selecionada.tempo}</Text>
            </View>
          </View>

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
                    active && { backgroundColor: `${itemConfig.color}18`, borderColor: itemConfig.color },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons color={itemConfig.color} name={itemConfig.icon} size={19} />
                  <Text style={[styles.actionText, active && { color: itemConfig.color }]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historico de ciclos</Text>
            <Text style={styles.sectionMeta}>7 dias</Text>
          </View>
          <View style={styles.chart}>
            {HISTORICO.map((valor, index) => (
              <View key={`${valor}-${index}`} style={styles.chartColumn}>
                <View style={[styles.chartBar, { height: valor }]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <Ionicons color={COLORS.blue} name="notifications" size={20} />
            </View>
            <View style={styles.notificationCopy}>
              <Text style={styles.notificationTitle}>Push de conclusao ativo</Text>
              <Text style={styles.notificationText}>
                Alerta previsto quando {selecionada.nome} finalizar o ciclo.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.lastUpdate}>Ultimo ciclo: {selecionada.ultimoCiclo}</Text>
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
    paddingBottom: 36,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 18,
    marginTop: 10,
  },
  eyebrow: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.ink,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 39,
    marginTop: 4,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 310,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#FFF2EA",
    borderColor: "#FFD8C2",
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  summaryItem: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.line,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minHeight: 92,
    justifyContent: "center",
    padding: 10,
    shadowColor: "#2B3C4D",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  summaryValue: {
    color: COLORS.ink,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 4,
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 1,
  },
  scanCard: {
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    borderColor: "rgba(30,136,229,0.18)",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
    padding: 16,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  qrMark: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  scanTextBlock: {
    flex: 1,
  },
  scanTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  scanSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  machineCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.line,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#1E3551",
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 5,
  },
  machineTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  machineId: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  machineName: {
    color: COLORS.ink,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 2,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "900",
  },
  statusStage: {
    alignItems: "center",
    paddingVertical: 24,
  },
  statusIconWrap: {
    alignItems: "center",
    borderRadius: 46,
    borderWidth: 2,
    height: 92,
    justifyContent: "center",
    marginBottom: 10,
    width: 92,
  },
  bubble: {
    backgroundColor: "#A7DAFF",
    position: "absolute",
  },
  bubbleOne: {
    borderRadius: 9,
    height: 18,
    right: 12,
    top: 10,
    width: 18,
  },
  bubbleTwo: {
    borderRadius: 6,
    height: 12,
    left: 14,
    top: 24,
    width: 12,
  },
  statusDescription: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  timerRow: {
    alignItems: "center",
    backgroundColor: "#F2F8FD",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  timerText: {
    color: COLORS.blueDark,
    fontSize: 14,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#FBFAF7",
    borderColor: COLORS.line,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minHeight: 70,
    justifyContent: "center",
    padding: 8,
  },
  actionText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: "900",
  },
  section: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.line,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionMeta: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 10,
    height: 100,
  },
  chartColumn: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  chartBar: {
    backgroundColor: COLORS.blue,
    borderRadius: 999,
    maxHeight: 88,
    minHeight: 24,
    opacity: 0.86,
    width: "100%",
  },
  notificationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  notificationIcon: {
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  notificationText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  lastUpdate: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 14,
    textAlign: "center",
  },
});

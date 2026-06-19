import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  background: "#F8F6F0",
  blue: "#1E88E5",
  blueDark: "#0F5EA8",
  ink: "#172033",
  muted: "#657080",
  card: "#FFFFFF",
  line: "#E7E0D3",
  clean: "#16A34A",
  dirty: "#F97316",
  wash: "#2BA8F8",
};

const FEATURES = [
  {
    icon: "qrcode-scan" as const,
    title: "QR Code por maquina",
    text: "Identifique cada lavadora ou secadora com leitura rapida e status individual.",
    color: COLORS.blue,
  },
  {
    icon: "chart-bar" as const,
    title: "Historico de ciclos",
    text: "Acompanhe uso, limpeza e produtividade em graficos simples para decisao diaria.",
    color: COLORS.clean,
  },
  {
    icon: "bell-ring-outline" as const,
    title: "Alertas operacionais",
    text: "Receba aviso de conclusao e reduza tempo parado entre um ciclo e outro.",
    color: COLORS.dirty,
  },
];

export default function Landing() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.logo}>
              <MaterialCommunityIcons color={COLORS.blue} name="washing-machine" size={27} />
            </View>
            <Pressable onPress={() => router.push("/login")} style={styles.navButton}>
              <Text style={styles.navText}>Entrar</Text>
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Laundry Monitor</Text>
              <Text style={styles.title}>Gestao visual para lavanderias inteligentes.</Text>
              <Text style={styles.subtitle}>
                Monitore maquinas por QR Code, acompanhe status em tempo real e organize ciclos
                de limpeza em um painel pensado para celular.
              </Text>

              <View style={styles.ctaRow}>
                <Pressable
                  onPress={() => router.push("/login")}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryText}>Acessar painel</Text>
                  <Ionicons color="#FFFFFF" name="arrow-forward" size={20} />
                </Pressable>
              </View>
            </View>

            <View style={styles.deviceScene}>
              <View style={styles.deviceHeader}>
                <View>
                  <Text style={styles.deviceLabel}>Lavadora 01</Text>
                  <Text style={styles.deviceTitle}>Lavando</Text>
                </View>
                <MaterialCommunityIcons color={COLORS.blue} name="qrcode-scan" size={28} />
              </View>
              <View style={styles.machineVisual}>
                <View style={styles.machineWindow}>
                  <MaterialCommunityIcons color={COLORS.wash} name="waves" size={56} />
                </View>
                <View style={styles.bubbleOne} />
                <View style={styles.bubbleTwo} />
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusChip}>
                  <Ionicons color={COLORS.clean} name="checkmark-circle" size={17} />
                  <Text style={styles.statusText}>Limpo</Text>
                </View>
                <View style={styles.statusChip}>
                  <Ionicons color={COLORS.dirty} name="alert-circle" size={17} />
                  <Text style={styles.statusText}>Sujo</Text>
                </View>
                <View style={[styles.statusChip, styles.statusActive]}>
                  <Ionicons color={COLORS.blue} name="water" size={17} />
                  <Text style={[styles.statusText, styles.statusActiveText]}>18 min</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>3</Text>
            <Text style={styles.metricLabel}>status de maquina</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>QR</Text>
            <Text style={styles.metricLabel}>identificacao rapida</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>24h</Text>
            <Text style={styles.metricLabel}>visao operacional</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>O que o site oferece</Text>
          <Text style={styles.sectionSubtitle}>
            Um fluxo simples para equipes que precisam saber o que esta limpo, sujo ou em ciclo.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}18` }]}>
                <MaterialCommunityIcons color={feature.color} name={feature.icon} size={25} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.loginInfo}>
          <Ionicons color={COLORS.blue} name="key" size={22} />
          <View style={styles.loginInfoText}>
            <Text style={styles.loginInfoTitle}>Acesso admin de teste</Text>
            <Text style={styles.loginInfoBody}>Usuario: admin  |  Senha: 1234</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 34,
  },
  hero: {
    backgroundColor: COLORS.blue,
    borderRadius: 30,
    minHeight: 620,
    overflow: "hidden",
    padding: 18,
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  logo: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  navButton: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  heroBody: {
    gap: 22,
  },
  heroCopy: {
    paddingTop: 4,
  },
  eyebrow: {
    color: "#EAF5FF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 43,
    maxWidth: 360,
  },
  subtitle: {
    color: "#EAF5FF",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 420,
  },
  ctaRow: {
    alignItems: "flex-start",
    marginTop: 22,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.ink,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  deviceScene: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 18,
    shadowColor: "#0B3156",
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 26,
    elevation: 8,
  },
  deviceHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deviceLabel: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  deviceTitle: {
    color: COLORS.ink,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  machineVisual: {
    alignItems: "center",
    height: 178,
    justifyContent: "center",
  },
  machineWindow: {
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    borderColor: "#BBDDF6",
    borderRadius: 62,
    borderWidth: 2,
    height: 124,
    justifyContent: "center",
    width: 124,
  },
  bubbleOne: {
    backgroundColor: "#A7DAFF",
    borderRadius: 12,
    height: 24,
    position: "absolute",
    right: 68,
    top: 34,
    width: 24,
  },
  bubbleTwo: {
    backgroundColor: "#D5EEFF",
    borderRadius: 9,
    height: 18,
    left: 78,
    position: "absolute",
    top: 58,
    width: 18,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusChip: {
    alignItems: "center",
    backgroundColor: "#FBFAF7",
    borderColor: COLORS.line,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 42,
  },
  statusActive: {
    backgroundColor: "#EAF5FF",
    borderColor: "#BBDDF6",
  },
  statusText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: "900",
  },
  statusActiveText: {
    color: COLORS.blue,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  metric: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.line,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    minHeight: 94,
    justifyContent: "center",
    padding: 10,
  },
  metricValue: {
    color: COLORS.ink,
    fontSize: 25,
    fontWeight: "900",
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  sectionHeader: {
    marginTop: 26,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 25,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  features: {
    gap: 12,
    marginTop: 16,
  },
  featureCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.line,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  featureIcon: {
    alignItems: "center",
    borderRadius: 17,
    height: 46,
    justifyContent: "center",
    marginBottom: 12,
    width: 46,
  },
  featureTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  featureText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  loginInfo: {
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    borderColor: "#BBDDF6",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    padding: 16,
  },
  loginInfoText: {
    flex: 1,
  },
  loginInfoTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  loginInfoBody: {
    color: COLORS.blueDark,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },
});

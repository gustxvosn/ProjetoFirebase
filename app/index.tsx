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
import { COLORS } from "@/constants/theme";

const FEATURES = [
  {
    icon: "qrcode-scan" as const,
    title: "Leitura de QR Code",
    text: "Identifique lavadoras, secadoras e autoclaves instantaneamente por QR Code.",
    color: COLORS.accent,
  },
  {
    icon: "shield-check-outline" as const,
    title: "Histórico de Higienização",
    text: "Acompanhe ciclos de limpeza e conformidade com relatórios operacionais dinâmicos.",
    color: COLORS.success,
  },
  {
    icon: "bell-badge-outline" as const,
    title: "Alertas Inteligentes",
    text: "Notificações push imediatas ao concluir ciclos, minimizando o tempo de ociosidade.",
    color: COLORS.warning,
  },
];

export default function Landing() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.logoBlock}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons color={COLORS.white} name="shield-check" size={26} />
            </View>
            <Text style={styles.logoText}>Hygienic<Text style={{ color: COLORS.accent }}>Pro</Text></Text>
          </View>
          <Pressable onPress={() => router.push("/login")} style={styles.navButton}>
            <Text style={styles.navText}>Entrar</Text>
          </Pressable>
        </View>

        {/* Hero Banner */}
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Monitoramento Industrial</Text>
            <Text style={styles.title}>Eficiência e controle sanitário na palma da mão.</Text>
            <Text style={styles.subtitle}>
              Gerencie ciclos de higienização de lavanderias profissionais por QR Code. Acompanhe o status das máquinas em tempo real.
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

          {/* Interactive UI Mockup */}
          <View style={styles.deviceScene}>
            <View style={styles.deviceHeader}>
              <View>
                <Text style={styles.deviceLabel}>Equipamento L-01</Text>
                <Text style={styles.deviceTitle}>Higienizando</Text>
              </View>
              <View style={styles.qrIconWrap}>
                <MaterialCommunityIcons color={COLORS.accent} name="qrcode-scan" size={24} />
              </View>
            </View>
            <View style={styles.machineVisual}>
              <View style={styles.machineWindow}>
                <MaterialCommunityIcons color={COLORS.accent} name="cached" size={50} style={styles.spinIcon} />
              </View>
              <View style={styles.bubbleOne} />
              <View style={styles.bubbleTwo} />
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusChip}>
                <Ionicons color={COLORS.success} name="checkmark-circle" size={16} />
                <Text style={styles.statusText}>Limpo</Text>
              </View>
              <View style={styles.statusChip}>
                <Ionicons color={COLORS.danger} name="alert-circle" size={16} />
                <Text style={styles.statusText}>Pendente</Text>
              </View>
              <View style={[styles.statusChip, styles.statusActive]}>
                <Ionicons color={COLORS.accent} name="time" size={16} />
                <Text style={[styles.statusText, styles.statusActiveText]}>18 min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>3</Text>
            <Text style={styles.metricLabel}>Status em tempo real</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>QR</Text>
            <Text style={styles.metricLabel}>Acesso instantâneo</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>100%</Text>
            <Text style={styles.metricLabel}>Visão operacional</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recursos HygienicPro</Text>
          <Text style={styles.sectionSubtitle}>
            Um fluxo simplificado desenvolvido para equipes que exigem padrões rigorosos de controle.
          </Text>
        </View>

        {/* Features list */}
        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                <MaterialCommunityIcons color={feature.color} name={feature.icon} size={24} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Demo Credentials Box */}
        <View style={styles.loginInfo}>
          <Ionicons color={COLORS.accent} name="key-sharp" size={24} />
          <View style={styles.loginInfoText}>
            <Text style={styles.loginInfoTitle}>Acesso para Demonstração</Text>
            <Text style={styles.loginInfoBody}>E-mail: admin  |  Senha: 1234</Text>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 10,
  },
  logoBlock: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  navButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  hero: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    gap: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  heroCopy: {
    paddingTop: 4,
  },
  eyebrow: {
    color: COLORS.accentLight,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  ctaRow: {
    alignItems: "flex-start",
    marginTop: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 24,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  deviceScene: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  deviceHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deviceLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  deviceTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  qrIconWrap: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  machineVisual: {
    alignItems: "center",
    height: 160,
    justifyContent: "center",
  },
  machineWindow: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 60,
    borderWidth: 2,
    height: 110,
    justifyContent: "center",
    width: 110,
  },
  spinIcon: {
    opacity: 0.85,
  },
  bubbleOne: {
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    borderRadius: 10,
    height: 20,
    position: "absolute",
    right: 80,
    top: 30,
    width: 20,
  },
  bubbleTwo: {
    backgroundColor: "rgba(108, 92, 231, 0.1)",
    borderRadius: 7,
    height: 14,
    left: 90,
    position: "absolute",
    top: 50,
    width: 14,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  statusChip: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 38,
  },
  statusActive: {
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    borderColor: COLORS.accent,
  },
  statusText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  statusActiveText: {
    color: COLORS.accentLight,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minHeight: 88,
    justifyContent: "center",
    padding: 8,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  features: {
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 16,
    gap: 14,
    alignItems: "center",
  },
  featureIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  featureText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  loginInfo: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  loginInfoText: {
    flex: 1,
  },
  loginInfoTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  loginInfoBody: {
    color: COLORS.accentLight,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },
});

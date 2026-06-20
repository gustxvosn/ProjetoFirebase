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
    title: "Rastreio por QR Code",
    text: "Identifique equipamentos, abra registros e acompanhe cada ciclo sem planilhas paralelas.",
  },
  {
    icon: "clipboard-check-outline" as const,
    title: "Rotina padronizada",
    text: "Controle status, responsáveis e histórico para manter a operação pronta para auditoria.",
  },
  {
    icon: "chart-line" as const,
    title: "Visão gerencial",
    text: "Indicadores de estoque, ciclos e pendências ajudam a equipe a agir com rapidez.",
  },
];

const STATS = [
  { value: "24/7", label: "monitoramento" },
  { value: "QR", label: "acesso rápido" },
];

export default function Landing() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoBlock}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons color={COLORS.white} name="washing-machine" size={25} />
            </View>
            <Text style={styles.logoText}>Smart Wash</Text>
          </View>
          <Pressable onPress={() => router.push("/login")} style={styles.navButton}>
            <Text style={styles.navText}>Entrar</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Gestão sanitária conectada</Text>
            <Text style={styles.title}>Controle profissional de higienização, usuários e insumos.</Text>
            <Text style={styles.subtitle}>
              Uma experiência integrada para autenticar equipes, gerenciar perfis, cadastrar insumos e
              acompanhar equipamentos com persistência remota no Firebase.
            </Text>

            <View style={styles.ctaRow}>
              <Pressable
                onPress={() => router.push("/login")}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>Acessar painel</Text>
                <Ionicons color={COLORS.white} name="arrow-forward" size={19} />
              </Pressable>

              <Pressable
                onPress={() => router.push("/cadastro")}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryText}>Criar conta</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.dashboardPreview}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewKicker}>Painel operacional</Text>
                <Text style={styles.previewTitle}>Autoclave L-01</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>Em ciclo</Text>
              </View>
            </View>

            <View style={styles.machineBox}>
              <View style={styles.machineRing}>
                <MaterialCommunityIcons color={COLORS.accent} name="cached" size={46} />
              </View>
              <View style={styles.machineMeta}>
                <Text style={styles.machineMetaLabel}>Tempo restante</Text>
                <Text style={styles.machineMetaValue}>18 min</Text>
              </View>
            </View>

            <View style={styles.previewGrid}>
              <View style={styles.previewTile}>
                <Ionicons color={COLORS.success} name="checkmark-circle" size={19} />
                <Text style={styles.previewTileValue}>12</Text>
                <Text style={styles.previewTileLabel}>Concluídos</Text>
              </View>
              <View style={styles.previewTile}>
                <Ionicons color={COLORS.warning} name="time" size={19} />
                <Text style={styles.previewTileValue}>3</Text>
                <Text style={styles.previewTileLabel}>Pendentes</Text>
              </View>
              <View style={styles.previewTile}>
                <MaterialCommunityIcons color={COLORS.accent} name="flask-outline" size={19} />
                <Text style={styles.previewTileValue}>28</Text>
                <Text style={styles.previewTileLabel}>Insumos</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {STATS.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Operação mais clara, rápida e segura.</Text>
          <Text style={styles.sectionSubtitle}>
            Centralize dados da equipe, insumos e equipamentos em uma experiência simples de usar.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons color={COLORS.accent} name={feature.icon} size={23} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            </View>
          ))}
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
    paddingBottom: 44,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
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
    borderRadius: 13,
    height: 42,
    justifyContent: "center",
    width: 42,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  logoText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  navButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  navText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  hero: {
    backgroundColor: "#171225",
    borderColor: "#3B2A66",
    borderRadius: 28,
    borderWidth: 1,
    gap: 22,
    marginBottom: 18,
    overflow: "hidden",
    padding: 20,
  },
  heroCopy: {
    paddingTop: 4,
  },
  eyebrow: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 20,
  },
  primaryText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  dashboardPreview: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  previewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewKicker: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  previewTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 2,
  },
  statusBadge: {
    alignItems: "center",
    backgroundColor: "#13251C",
    borderColor: "#256E45",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: {
    backgroundColor: COLORS.success,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusBadgeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "800",
  },
  machineBox: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 18,
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
    padding: 14,
  },
  machineRing: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: "#5B3EA6",
    borderRadius: 42,
    borderWidth: 2,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  machineMeta: {
    flex: 1,
  },
  machineMetaLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  machineMetaValue: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 2,
  },
  previewGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  previewTile: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  previewTileValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  previewTileLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 82,
    padding: 8,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  features: {
    gap: 12,
    marginBottom: 22,
  },
  featureCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  featureIcon: {
    alignItems: "center",
    backgroundColor: "#24183D",
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
    fontWeight: "900",
  },
  featureText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
});

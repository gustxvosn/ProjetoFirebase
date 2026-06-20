import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { router } from "expo-router";
import * as Print from "expo-print";
import { COLORS } from "@/constants/theme";
import { auth, db } from "../services/firebase";

type QrHistorico = {
  id: string;
  nome: string;
  codigo: string;
  status: string;
  ultimoEvento: string;
};

const STATUS_ORDEM = ["Sujo", "Lavando", "Limpo"];

function statusVisual(status: string) {
  if (status === "Limpo") {
    return { label: "Limpos", color: COLORS.success, icon: "checkmark-circle" as const };
  }

  if (status === "Lavando") {
    return { label: "Em processo", color: COLORS.accent, icon: "sync" as const };
  }

  return { label: "Pendentes", color: COLORS.danger, icon: "alert-circle" as const };
}

function criarCodigoQr() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "SW-";

  for (let index = 0; index < 8; index += 1) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }

  return codigo;
}

function montarHtmlEtiqueta(nome: string, codigo: string) {
  const qrData = encodeURIComponent(`SMARTWASH:${codigo}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            background: #08070D;
            color: #F8FAFC;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            text-align: center;
          }
          .card {
            background: #12101A;
            border: 2px solid #8B5CF6;
            border-radius: 24px;
            padding: 34px;
            width: 360px;
          }
          .brand {
            color: #C4B5FD;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 2px;
            margin-bottom: 18px;
            text-transform: uppercase;
          }
          img {
            background: #FFFFFF;
            border-radius: 18px;
            height: 240px;
            padding: 12px;
            width: 240px;
          }
          h1 {
            font-size: 24px;
            margin: 22px 0 8px;
          }
          p {
            color: #C4B5FD;
            font-size: 17px;
            font-weight: 800;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="brand">Smart Wash</div>
          <img src="${qrUrl}" alt="QR Code" />
          <h1>${nome}</h1>
          <p>${codigo}</p>
        </div>
      </body>
    </html>
  `;
}

export default function GerarQrScreen() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [gestorId, setGestorId] = useState("");
  const [gestorEmail, setGestorEmail] = useState("");
  const [nomeEquipamento, setNomeEquipamento] = useState("");
  const [historico, setHistorico] = useState<QrHistorico[]>([]);
  const [qrGerado, setQrGerado] = useState<QrHistorico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [nomeFocused, setNomeFocused] = useState(false);

  const qrGeradoUrl = qrGerado
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`SMARTWASH:${qrGerado.codigo}`)}`
    : "";
  const historicoPorStatus =
      STATUS_ORDEM.map((status) => ({
        title: status,
        data: historico.filter((item) => item.status === status),
      })).filter((section) => section.data.length > 0);

  useEffect(() => {
    let unsubscribeQrcodes: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setUsuario(user);
      const perfilSnap = await getDoc(doc(db, "usuarios", user.uid));
      const perfil = perfilSnap.data();

      if (perfil?.perfil !== "gestor") {
        Alert.alert("Acesso restrito", "Apenas gestores podem gerar QR codes.");
        router.replace("/home");
        return;
      }

      const equipeId = perfil?.gestorId || user.uid;
      const equipeEmail = perfil?.gestorEmail || user.email || "";
      setGestorId(equipeId);
      setGestorEmail(equipeEmail);

      unsubscribeQrcodes?.();
      unsubscribeQrcodes = onSnapshot(
        query(collection(db, "qrcodes"), where("gestorId", "==", equipeId)),
        (snapshot) => {
          const lista = snapshot.docs
            .map((item) => {
              const dados = item.data();
              return {
                id: item.id,
                nome: String(dados.nome || ""),
                codigo: String(dados.codigo || ""),
                status: String(dados.status || "Sujo"),
                ultimoEvento: String(dados.ultimoEvento || "QR code criado"),
              };
            })
            .sort((a, b) => a.nome.localeCompare(b.nome));

          setHistorico(lista);
          setCarregando(false);
        },
        (error) => {
          Alert.alert("Erro ao carregar histórico", error.message);
          setCarregando(false);
        }
      );
    });

    return () => {
      unsubscribeQrcodes?.();
      unsubscribeAuth();
    };
  }, []);

  async function gerarQrCode() {
    if (!usuario || !gestorId) {
      Alert.alert("Atenção", "Entre com um gestor do Firebase para gerar QR codes.");
      return;
    }

    if (!nomeEquipamento.trim()) {
      Alert.alert("Atenção", "Informe o nome do equipamento.");
      return;
    }

    try {
      setSalvando(true);
      const codigo = criarCodigoQr();
      const docRef = await addDoc(collection(db, "qrcodes"), {
        nome: nomeEquipamento.trim(),
        codigo,
        status: "Sujo",
        tempo: "Pendente",
        ultimoEvento: "QR code criado",
        gestorId,
        gestorEmail,
        criadoPor: usuario.uid,
        criadoPorEmail: usuario.email,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      setQrGerado({
        id: docRef.id,
        nome: nomeEquipamento.trim(),
        codigo,
        status: "Sujo",
        ultimoEvento: "QR code criado",
      });
      setNomeEquipamento("");
      Alert.alert("Sucesso", "QR code gerado e salvo no Firebase.");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar o QR code.");
    } finally {
      setSalvando(false);
    }
  }

  async function imprimirQrGerado() {
    if (!qrGerado) return;

    try {
      await Print.printAsync({
        html: montarHtmlEtiqueta(qrGerado.nome, qrGerado.codigo),
      });
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível imprimir o QR code.");
    }
  }

  function confirmarExclusao(item: QrHistorico) {
    Alert.alert("Excluir QR code", `Deseja excluir "${item.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => excluirQrCode(item.id) },
    ]);
  }

  async function excluirQrCode(id: string) {
    try {
      setExcluindoId(id);
      await deleteDoc(doc(db, "qrcodes", id));
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível excluir o QR code.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>QR Codes</Text>
        <View style={{ width: 40 }} />
      </View>

      <SectionList
        ListHeaderComponent={
          <View>
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name="qr-code-outline" size={48} color={COLORS.accent} />
              </View>
              <Text style={styles.title}>Novo QR Code</Text>
              <Text style={styles.subtitle}>
                Informe um título e gere um QR code real vinculado ao Firebase.
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                  onBlur={() => setNomeFocused(false)}
                  onChangeText={setNomeEquipamento}
                  onFocus={() => setNomeFocused(true)}
                  placeholder="Ex: Lavadora Industrial 01"
                  placeholderTextColor={COLORS.textMuted}
                  style={[styles.input, nomeFocused && styles.inputFocused]}
                  value={nomeEquipamento}
                />
              </View>

              <Pressable
                disabled={salvando}
                onPress={gerarQrCode}
                style={[styles.button, salvando && styles.buttonDisabled]}
              >
                {salvando ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="qr-code-outline" size={20} color={COLORS.white} />
                    <Text style={styles.buttonText}>Gerar QR Code</Text>
                  </>
                )}
              </Pressable>

              {qrGerado ? (
                <View style={styles.generatedQrBox}>
                  <Text style={styles.generatedTitle}>{qrGerado.nome}</Text>
                  <View style={styles.qrImageWrap}>
                    <Image source={{ uri: qrGeradoUrl }} style={styles.qrImage} />
                  </View>
                  <Text style={styles.generatedCode}>{qrGerado.codigo}</Text>
                  <Pressable onPress={imprimirQrGerado} style={styles.printButton}>
                    <Ionicons name="print-outline" size={19} color={COLORS.white} />
                    <Text style={styles.printButtonText}>Imprimir somente o QR Code</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Text style={styles.historyTitle}>Histórico de QR Codes</Text>
            {carregando ? <ActivityIndicator color={COLORS.accent} style={styles.loading} /> : null}
          </View>
        }
        contentContainerStyle={styles.content}
        sections={historicoPorStatus}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !carregando ? <Text style={styles.emptyText}>Nenhum QR code gerado ainda.</Text> : null
        }
        renderSectionHeader={({ section }) => {
          const visual = statusVisual(section.title);

          return (
            <View style={styles.statusHeader}>
              <Ionicons color={visual.color} name={visual.icon} size={18} />
              <Text style={[styles.statusHeaderText, { color: visual.color }]}>
                {visual.label} ({section.data.length})
              </Text>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <View style={styles.historyIcon}>
              <Ionicons name="qr-code" size={22} color={COLORS.accentLight} />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyName}>{item.nome}</Text>
              <Text style={styles.historyMeta}>{item.codigo} · {item.status}</Text>
              <Text style={styles.historyEvent}>{item.ultimoEvento}</Text>
            </View>
            <Pressable
              disabled={excluindoId === item.id}
              onPress={() => confirmarExclusao(item)}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
            >
              {excluindoId === item.id ? (
                <ActivityIndicator color={COLORS.danger} size="small" />
              ) : (
                <Ionicons color={COLORS.danger} name="trash-outline" size={19} />
              )}
            </Pressable>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
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
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#171225",
    borderRadius: 40,
    height: 80,
    justifyContent: "center",
    marginBottom: 16,
    width: 80,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  inputWrap: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 15,
    height: 54,
    paddingHorizontal: 16,
  },
  inputFocused: {
    backgroundColor: `${COLORS.accent}05`,
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  generatedQrBox: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
    width: "100%",
  },
  generatedTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },
  qrImageWrap: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    justifyContent: "center",
    padding: 12,
  },
  qrImage: {
    height: 220,
    width: 220,
  },
  generatedCode: {
    color: COLORS.accentLight,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 12,
  },
  printButton: {
    alignItems: "center",
    backgroundColor: COLORS.success,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 50,
    paddingHorizontal: 16,
    width: "100%",
  },
  printButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },
  button: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    height: 54,
    justifyContent: "center",
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  historyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    marginTop: 24,
  },
  loading: {
    marginVertical: 16,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginVertical: 18,
    textAlign: "center",
  },
  statusHeader: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    marginTop: 14,
    paddingVertical: 4,
  },
  statusHeaderText: {
    fontSize: 15,
    fontWeight: "900",
  },
  historyCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 14,
  },
  historyIcon: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  historyMeta: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  historyEvent: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#2A111A",
    borderColor: "#7F1D3A",
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  deleteButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

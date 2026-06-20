import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Alert, Button, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { COLORS } from "@/constants/theme";
import { auth, db } from "../services/firebase";

type StatusQr = "Limpo" | "Sujo" | "Lavando";

function extrairCodigoQr(data: string) {
  if (data.startsWith("SMARTWASH:")) return data.replace("SMARTWASH:", "").trim();
  return data.trim();
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos da sua permissão para usar a câmera</Text>
        <Button onPress={requestPermission} title="Conceder permissão" />
      </View>
    );
  }

  async function atualizarStatus(qrId: string, status: StatusQr) {
    try {
      await updateDoc(doc(db, "qrcodes", qrId), {
        status,
        tempo: status === "Lavando" ? "18 min" : status === "Limpo" ? "Pronta" : "Pendente",
        ultimoEvento: `Status alterado por leitura de QR para ${status}`,
        atualizadoEm: serverTimestamp(),
      });

      Alert.alert("Sucesso", "Status atualizado no Firebase.", [
        { text: "Escanear outro", onPress: () => setScanned(false) },
        { text: "Voltar", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível atualizar este QR code.");
      setScanned(false);
    }
  }

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    setScanned(true);
    const codigo = extrairCodigoQr(data);

    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Sessão expirada", "Entre novamente para escanear QR codes.");
        router.replace("/login");
        return;
      }

      const perfilSnap = await getDoc(doc(db, "usuarios", user.uid));
      const gestorId = perfilSnap.data()?.gestorId || user.uid;
      const snapshot = await getDocs(
        query(collection(db, "qrcodes"), where("codigo", "==", codigo), where("gestorId", "==", gestorId))
      );

      if (snapshot.empty) {
        Alert.alert("QR code não encontrado", "Este QR code não pertence à sua equipe ou não está cadastrado.", [
          { text: "Escanear novamente", onPress: () => setScanned(false) },
        ]);
        return;
      }

      const qrDoc = snapshot.docs[0];
      const qrData = qrDoc.data();

      Alert.alert(
        "Equipamento encontrado",
        `${qrData.nome || "Equipamento"}\nCódigo: ${codigo}`,
        [
          { text: "Limpo", onPress: () => atualizarStatus(qrDoc.id, "Limpo") },
          { text: "Sujo", onPress: () => atualizarStatus(qrDoc.id, "Sujo") },
          { text: "Lavando", onPress: () => atualizarStatus(qrDoc.id, "Lavando") },
          { text: "Cancelar", style: "cancel", onPress: () => setScanned(false) },
        ]
      );
    } catch (error: any) {
      Alert.alert("Acesso bloqueado", error.message || "Não foi possível acessar este QR code.");
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.camera}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </Pressable>
            <Text style={styles.title}>Escanear Equipamento</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.targetFrame}>
            <View style={styles.targetSquare} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.instruction}>Alinhe o QR code no centro da tela.</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
  },
  message: {
    color: COLORS.text,
    paddingBottom: 10,
    textAlign: "center",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  targetFrame: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  targetSquare: {
    backgroundColor: "transparent",
    borderColor: COLORS.accent,
    borderRadius: 20,
    borderWidth: 2,
    height: 250,
    width: 250,
  },
  footer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 30,
  },
  instruction: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: "center",
  },
});

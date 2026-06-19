import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos da sua permissão para usar a câmera</Text>
        <Button onPress={requestPermission} title="Conceder permissão" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Alert.alert(
      "QR Code Escaneado",
      `Código: ${data}`,
      [
        {
          text: "Escanear Novamente",
          onPress: () => setScanned(false),
        },
        {
          text: "Voltar",
          onPress: () => router.back(),
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
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
            <Text style={styles.instruction}>
              Alinhe o QR code no centro da tela.
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: COLORS.text,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  targetFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetSquare: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  footer: {
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  instruction: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
  },
});

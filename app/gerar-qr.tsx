import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Print from 'expo-print';
import { COLORS } from '@/constants/theme';

export default function GerarQrScreen() {
  const [nomeEquipamento, setNomeEquipamento] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  
  const [nomeFocused, setNomeFocused] = useState(false);
  const [identificadorFocused, setIdentificadorFocused] = useState(false);

  const gerarEImprimir = async () => {
    if (!nomeEquipamento.trim() || !identificador.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    try {
      setIsPrinting(true);
      
      const qrData = encodeURIComponent(`ID:${identificador}|NOME:${nomeEquipamento}`);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                text-align: center;
              }
              .card {
                border: 2px dashed #000;
                padding: 40px;
                border-radius: 20px;
                max-width: 400px;
              }
              h1 {
                font-size: 24px;
                color: #333;
                margin-bottom: 10px;
              }
              p {
                font-size: 18px;
                color: #666;
                margin-bottom: 30px;
              }
              img {
                width: 250px;
                height: 250px;
                margin-bottom: 20px;
              }
              .footer {
                margin-top: 40px;
                font-size: 14px;
                color: #999;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <img src="${qrUrl}" alt="QR Code" />
              <h1>${nomeEquipamento}</h1>
              <p>ID: ${identificador}</p>
            </div>
            <div class="footer">
              HygienicPro - Controle Sanitário
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({
        html,
      });
      
      setNomeEquipamento('');
      setIdentificador('');

    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível imprimir o QR Code.");
      console.error(error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Gerar QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="qr-code-outline" size={48} color={COLORS.accent} />
          </View>
          <Text style={styles.title}>Novo Equipamento</Text>
          <Text style={styles.subtitle}>
            Preencha os dados abaixo para gerar e imprimir a etiqueta QR Code.
          </Text>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Nome do Equipamento</Text>
            <TextInput
              style={[styles.input, nomeFocused && styles.inputFocused]}
              placeholder="Ex: Autoclave L-01"
              placeholderTextColor={COLORS.textMuted}
              value={nomeEquipamento}
              onChangeText={setNomeEquipamento}
              onFocus={() => setNomeFocused(true)}
              onBlur={() => setNomeFocused(false)}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Identificador (ID/Série)</Text>
            <TextInput
              style={[styles.input, identificadorFocused && styles.inputFocused]}
              placeholder="Ex: QR-HYG-001"
              placeholderTextColor={COLORS.textMuted}
              value={identificador}
              onChangeText={setIdentificador}
              autoCapitalize="characters"
              onFocus={() => setIdentificadorFocused(true)}
              onBlur={() => setIdentificadorFocused(false)}
            />
          </View>

          <Pressable 
            style={[styles.button, isPrinting && styles.buttonDisabled]} 
            onPress={gerarEImprimir}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="print-outline" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>Gerar e Imprimir</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputWrap: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 15,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}05`,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    width: '100%',
    height: 54,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

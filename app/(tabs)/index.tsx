import { router } from "expo-router";
import { Button, View } from "react-native";

export default function Home() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button
        title="Ir para Cadastro"
        onPress={() => router.push("/cadastro")}
      />
    </View>
  );
}
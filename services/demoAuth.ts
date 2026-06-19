const DEMO_ROLE_KEY = "hygienic-pro-demo-role";

let demoRoleActive: string | null = null;

function browserStorage() {
  const runtime = globalThis as typeof globalThis & {
    localStorage?: {
      getItem: (key: string) => string | null;
      removeItem: (key: string) => void;
      setItem: (key: string, value: string) => void;
    };
  };

  return runtime.localStorage;
}

export function isDemoCredentials(email: string, password: string, role: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail === "demo" && password === "1234";
}

export function startDemoSession(role: string) {
  demoRoleActive = role;
  browserStorage()?.setItem(DEMO_ROLE_KEY, role);
}

export function clearDemoSession() {
  demoRoleActive = null;
  browserStorage()?.removeItem(DEMO_ROLE_KEY);
}

export function getDemoRole() {
  return demoRoleActive || browserStorage()?.getItem(DEMO_ROLE_KEY);
}

export function isDemoActive() {
  return getDemoRole() !== null;
}

export function getDemoName() {
  const role = getDemoRole();
  if (role === "gestor") return "Gestor (Demo)";
  if (role === "funcionario") return "Funcionário (Demo)";
  if (role === "cliente") return "Cliente (Demo)";
  return "Usuário (Demo)";
}

const DEMO_ROLE_KEY = "hygienic-pro-demo-role";

export const ADMIN_AUTH_EMAIL = "admin@smartwash.local";
export const ADMIN_AUTH_PASSWORD = "SmartWashAdmin1234!";

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

export function isDemoCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail === "admin" && password === "1234";
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
  return "Enrico";
}

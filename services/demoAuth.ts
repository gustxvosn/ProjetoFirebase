const DEMO_ADMIN_KEY = "laundry-monitor-demo-admin";

let demoAdminActive = false;

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

export function isAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return (normalizedEmail === "admin" || normalizedEmail === "admin@laundry.local") && password === "1234";
}

export function startDemoAdminSession() {
  demoAdminActive = true;
  browserStorage()?.setItem(DEMO_ADMIN_KEY, "true");
}

export function clearDemoAdminSession() {
  demoAdminActive = false;
  browserStorage()?.removeItem(DEMO_ADMIN_KEY);
}

export function isDemoAdminActive() {
  return demoAdminActive || browserStorage()?.getItem(DEMO_ADMIN_KEY) === "true";
}

export function getDemoAdminName() {
  return "Admin";
}

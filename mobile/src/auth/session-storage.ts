import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Retire the previous browser fallback without reading its credential value.
  try { window.localStorage.removeItem('ar-imms-mobile-session'); } catch { /* Private mode may block storage. */ }
}

const memory = new Map<string, string>();
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export const protectedStore = {
  get: async (key: string) => Platform.OS === 'web' ? memory.get(key) ?? null : SecureStore.getItemAsync(key, options),
  set: async (key: string, value: string) => {
    if (Platform.OS === 'web') { memory.set(key, value); return; }
    await SecureStore.setItemAsync(key, value, options);
  },
  remove: async (key: string) => {
    if (Platform.OS === 'web') { memory.delete(key); return; }
    await SecureStore.deleteItemAsync(key, options);
  },
};

import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Set in app/.env. Expo copies EXPO_PUBLIC_* values into the app when it bundles.
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TIMEOUT_MS = 5000;

type ApiState = 'checking' | 'connected' | 'database-down' | 'unreachable' | 'not-configured';

async function checkApi(): Promise<ApiState> {
  if (!API_URL) return 'not-configured';
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.ok) return 'connected';
    return res.status === 503 ? 'database-down' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}

const MESSAGES: Record<ApiState, string> = {
  checking: 'Checking the API…',
  connected: 'API connected',
  'database-down': 'API is up, but the database is down',
  unreachable: 'API not reachable',
  'not-configured': 'EXPO_PUBLIC_API_URL is not set in app/.env',
};

export default function App() {
  const [state, setState] = useState<ApiState>('checking');

  const runCheck = () => {
    setState('checking');
    checkApi().then(setState);
  };

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ganira</Text>
      <Text style={[styles.status, state === 'connected' ? styles.ok : styles.problem]}>
        {MESSAGES[state]}
      </Text>
      <Pressable style={styles.button} onPress={runCheck}>
        <Text style={styles.buttonText}>Check again</Text>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: { fontSize: 32, fontWeight: '700' },
  status: { fontSize: 16 },
  ok: { color: '#1a7f37' },
  problem: { color: '#b42318' },
  button: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#eee' },
  buttonText: { fontSize: 16 },
});

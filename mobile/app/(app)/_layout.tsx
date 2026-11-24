import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../src/auth/auth-context';
import { TechnicianTabBar } from '../../src/components/technician-tab-bar';

export default function AppLayout() {
  const { loading, session } = useAuth();
  if (!session) return loading ? null : <Redirect href="/(auth)/login" />;
  return (
    <Tabs tabBar={(props) => <TechnicianTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="tickets/index" options={{ title: 'Tickets' }} />
      <Tabs.Screen name="activity" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* SDK 58 redirects hidden routes. TechnicianTabBar controls which buttons are shown. */}
      <Tabs.Screen name="tickets/new" />
      <Tabs.Screen name="tickets/[id]" />
      <Tabs.Screen name="incidents/index" />
      <Tabs.Screen name="incidents/[id]" />
      <Tabs.Screen name="ar/scan" />
      <Tabs.Screen name="ar/[nodeId]" />
    </Tabs>
  );
}

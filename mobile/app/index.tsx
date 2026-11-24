import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../src/auth/auth-context';
import { useTheme } from '../src/theme/theme-context';
export default function IndexRoute() { const { loading, session } = useAuth(); const { colors } = useTheme(); if (loading) return <View style={[styles.loading, { backgroundColor: colors.bg }]}><ActivityIndicator color={colors.cyan} /></View>; return <Redirect href={session ? '/(app)' : '/(auth)/login'} />; }
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' } });

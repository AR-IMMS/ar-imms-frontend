import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii, shadow, spacing, typography } from '../theme/tokens';

interface DashboardCardProps extends PropsWithChildren {
  title: string;
  action?: string;
  style?: ViewStyle;
}

export function DashboardCard({ title, action, style, children }: DashboardCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {action ? <Text style={styles.action}>{action}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    ...shadow,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
  },
  action: {
    color: colors.textSubtle,
    fontSize: typography.micro,
    fontWeight: '800',
  },
});

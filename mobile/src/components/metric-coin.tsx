import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';

interface MetricCoinProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: 'blue' | 'purple' | 'amber';
}

export function MetricCoin({ icon: Icon, label, value, tone = 'blue' }: MetricCoinProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, styles[tone]]}>
        <Icon color={colors.text} size={18} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: radii.xl,
  },
  blue: {
    backgroundColor: colors.cyan,
  },
  purple: {
    backgroundColor: colors.purple,
  },
  amber: {
    backgroundColor: colors.amber,
  },
  value: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  label: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
});

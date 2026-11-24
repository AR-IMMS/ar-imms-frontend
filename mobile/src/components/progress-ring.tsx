import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/tokens';

interface ProgressRingProps {
  value: string;
  label: string;
}

export function ProgressRing({ value, label }: ProgressRingProps) {
  return (
    <View style={styles.outer}>
      <View style={styles.segmentA} />
      <View style={styles.segmentB} />
      <View style={styles.segmentC} />
      <View style={styles.inner}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 122,
    height: 122,
    borderRadius: 61,
    borderWidth: 12,
    borderColor: colors.cyan,
    backgroundColor: colors.cardDark,
  },
  segmentA: {
    position: 'absolute',
    top: -12,
    right: 8,
    width: 45,
    height: 18,
    borderRadius: 10,
    backgroundColor: colors.red,
    transform: [{ rotate: '25deg' }],
  },
  segmentB: {
    position: 'absolute',
    bottom: -5,
    left: 8,
    width: 46,
    height: 18,
    borderRadius: 10,
    backgroundColor: colors.teal,
    transform: [{ rotate: '25deg' }],
  },
  segmentC: {
    position: 'absolute',
    left: -8,
    top: 28,
    width: 34,
    height: 16,
    borderRadius: 10,
    backgroundColor: colors.amber,
    transform: [{ rotate: '-55deg' }],
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.panelSoft,
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  label: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
});

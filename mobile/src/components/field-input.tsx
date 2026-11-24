import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { radii, spacing } from '../theme/tokens';

export function FieldInput({ label, style, secureTextEntry, onFocus, onBlur, ...props }: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return <View style={styles.wrap}>
    <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    <View style={[styles.field, { borderColor: focused ? colors.cyan : colors.border, backgroundColor: colors.panelStrong }]}>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.textSubtle} secureTextEntry={secureTextEntry && !visible}
        onFocus={event => { setFocused(true); onFocus?.(event); }}
        onBlur={event => { setFocused(false); onBlur?.(event); }}
        style={[styles.input, { color: colors.text }, style]} {...props} />
      {secureTextEntry ? <Pressable accessibilityRole="button" accessibilityLabel={(visible ? 'Hide ' : 'Show ') + label.toLowerCase()}
        onPress={() => setVisible(value => !value)} style={styles.control}><Icon size={19} color={colors.textMuted} /></Pressable> : null}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  wrap: { gap: 6 }, label: { fontSize: 14, fontWeight: '600' },
  field: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.md, borderWidth: 1 },
  input: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: spacing.md, fontSize: 16 },
  control: { width: 46, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});

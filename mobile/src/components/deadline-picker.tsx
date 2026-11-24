import { FieldInput } from './field-input';
export function DeadlinePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <FieldInput label="Pending until (local)" placeholder="YYYY-MM-DD HH:mm" value={value} onChangeText={onChange} />;
}

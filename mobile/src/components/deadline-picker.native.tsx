import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Text } from 'react-native';
import { ActionButton } from './action-button';
import { useTheme } from '../theme/theme-context';

function format(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}
export function DeadlinePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [candidate, setCandidate] = useState(new Date());
  function open() {
    const initial = new Date(Date.now() + 15 * 60_000);
    if (Platform.OS !== 'android') {
      setCandidate(initial); setVisible(true); return;
    }
    DateTimePickerAndroid.open({ value: initial, mode: 'date', minimumDate: new Date(), onChange: (event, day) => {
      if (event.type !== 'set' || !day) return;
      DateTimePickerAndroid.open({ value: initial, mode: 'time', onChange: (timeEvent, time) => {
        if (timeEvent.type !== 'set' || !time) return;
        day.setHours(time.getHours(), time.getMinutes(), 0, 0);
        onChange(format(day));
      } });
    } });
  }
  return <>
    <Text style={{ color: colors.textMuted }}>{value ? 'Pending until ' + value + ' (local)' : 'Select a deadline in your local time.'}</Text>
    <ActionButton label="Choose date and time" variant="secondary" onPress={open} />
    {visible ? <>
      <DateTimePicker value={candidate} mode="datetime" minimumDate={new Date()} display="spinner"
        onChange={(_, value) => { if (value) setCandidate(value); }} />
      <ActionButton label="Use this deadline" variant="secondary" onPress={() => { onChange(format(candidate)); setVisible(false); }} />
    </> : null}
  </>;
}

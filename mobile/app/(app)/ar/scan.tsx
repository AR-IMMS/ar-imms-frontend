import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ArrowLeft, Camera, RotateCcw, ScanLine } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { openWebArFromQr } from '../../../src/ar/open-webar';
import { useAuth } from '../../../src/auth/auth-context';
import { useTheme } from '../../../src/theme/theme-context';
import { radii, spacing, type ThemeColors } from '../../../src/theme/tokens';

export default function AssetQrScanner() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string>();

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned) return;

    setScanned(true);
    setError(undefined);
    try {
      if (!session) {
        throw new Error('Your session has expired. Sign in again before scanning an asset.');
      }
      await openWebArFromQr(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not read this asset QR.');
    }
  }

  function scanAgain() {
    setError(undefined);
    setScanned(false);
  }

  if (!permission) {
    return <View style={styles.permissionPage} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionPage}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIcon}><Camera color={colors.cyan} size={30} /></View>
          <Text style={styles.permissionTitle}>Camera access required</Text>
          <Text style={styles.permissionCopy}>Allow camera access so AR-IMMS can scan the QR attached to a Rack or Node.</Text>
          <Pressable onPress={() => void requestPermission()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Allow camera</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.page}>
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top', 'bottom']} style={styles.overlay}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Close scanner" onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft color="#FFFFFF" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>AR-IMMS FIELD</Text>
            <Text style={styles.title}>Scan asset QR</Text>
          </View>
          <View style={styles.iconButton}><ScanLine color="#FFFFFF" size={21} /></View>
        </View>

        <View style={styles.scannerArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <ScanLine color="#FFFFFF" size={54} strokeWidth={1.5} />
          </View>
        </View>

        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>{error ? 'QR not recognized' : scanned ? 'Asset QR scanned' : 'Align QR inside the frame'}</Text>
          <Text style={styles.guideCopy}>{error ?? (scanned ? 'WebAR was opened for the identified Rack or Node.' : 'Scan the QR generated from Asset Management. WebAR will open only after the asset is identified.')}</Text>
          {scanned ? (
            <Pressable onPress={scanAgain} style={styles.retryButton}>
              <RotateCcw color="#FFFFFF" size={17} />
              <Text style={styles.retryText}>Scan another asset</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: '#050A13' },
  overlay: { flex: 1, justifyContent: 'space-between', backgroundColor: 'rgba(2, 7, 18, 0.22)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#8DA7FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  iconButton: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(5,10,19,0.58)' },
  scannerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { alignItems: 'center', justifyContent: 'center', width: 254, height: 254, borderRadius: radii.xl, backgroundColor: 'rgba(5,10,19,0.12)' },
  corner: { position: 'absolute', width: 45, height: 45, borderColor: '#6D8CFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 20 },
  bottomRight: { right: 0, bottom: 0, borderRightWidth: 5, borderBottomWidth: 5, borderBottomRightRadius: 20 },
  guideCard: { margin: spacing.lg, gap: spacing.sm, padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(5,10,19,0.84)' },
  guideTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  guideCopy: { color: '#B9C3D7', fontSize: 13, lineHeight: 19 },
  retryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm, minHeight: 46, borderRadius: radii.md, backgroundColor: colors.cyan },
  retryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  permissionPage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  permissionCard: { width: '100%', maxWidth: 420, alignItems: 'center', gap: spacing.md, padding: spacing.xl, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  permissionIcon: { alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 22, backgroundColor: colors.cyanSoft },
  permissionTitle: { color: colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  permissionCopy: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primaryButton: { width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: spacing.sm, borderRadius: radii.md, backgroundColor: colors.cyan },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900' },
  secondaryButton: { padding: spacing.sm },
  secondaryButtonText: { color: colors.textMuted, fontWeight: '800' },
});

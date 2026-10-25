import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

// Bottom sheet: tap outside or the system back button to close.
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(59,47,47,0.45)' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.chipEdge, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
});

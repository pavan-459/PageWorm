import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from './Sheet';
import { Button } from './ui';
import { Icon3D } from './Icon3D';
import { colors, font } from './theme';
import { Book, formatMinutes } from './storage';

export function BookSheet({
  visible,
  book,
  minutesWithBook,
  onSave,
  onFinish,
  onClose,
}: {
  visible: boolean;
  book: Book | null;
  minutesWithBook: number;
  onSave: (title: string) => void;
  onFinish: () => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(!book);
  const [title, setTitle] = useState(book?.title ?? '');

  useEffect(() => {
    if (visible) {
      setEditing(!book);
      setTitle(book?.title ?? '');
    }
  }, [visible, book]);

  const save = () => {
    if (title.trim()) onSave(title.trim());
  };

  return (
    <Sheet visible={visible} title={editing ? (book ? 'Change book' : 'What are you reading?') : 'Currently reading'} onClose={onClose}>
      {editing ? (
        <>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Book title"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={save}
            maxLength={80}
          />
          <Button title="Save book" onPress={save} style={!title.trim() ? { opacity: 0.5 } : undefined} />
          <Button kind="ghost" title="Cancel" onPress={book ? () => setEditing(false) : onClose} />
        </>
      ) : (
        book && (
          <>
            <View style={styles.bookRow}>
              <Icon3D name="closedBook" size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={font.small}>{minutesWithBook > 0 ? `${formatMinutes(minutesWithBook)} read since you started` : 'Just started'}</Text>
              </View>
            </View>
            <Button title="I finished it!" icon={<Icon3D name="party" size={24} />} onPress={onFinish} />
            <Button kind="chip" title="Change book" icon={<Icon3D name="pencil" size={20} />} onPress={() => setEditing(true)} />
          </>
        )
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.chipEdge,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: colors.text,
  },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 4 },
  bookTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
});

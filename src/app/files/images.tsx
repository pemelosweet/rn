
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 始终使用一个受控路径：重复选择会覆盖旧草稿，不会无限堆积文件。
const draftImage = new File(Paths.document, 'day7-image-draft.jpg');
const DRAFT_STORAGE_KEY = '@myapp/day7-image-draft';

type DraftMetadata = {
  uri: string;
  savedAt: string;
  size: number;
};

export default function ImagesScreen() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<DraftMetadata | null>(null);
  const [log, setLog] = useState<string[]>(['正在检查是否有上次保存的图片草稿。']);

  const addLog = useCallback((message: string) => {
    setLog((previous) => [message, ...previous].slice(0, 8));
  }, []);

  const restoreDraft = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (!stored) {
        addLog('没有保存过草稿元数据。');
        return;
      }

      const metadata: DraftMetadata = JSON.parse(stored);
      const storedFile = new File(metadata.uri);
      if (!storedFile.exists) {
        await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraft(null);
        addLog('发现失效记录：文件已不存在，已自动清理元数据。');
        return;
      }

      setDraft(metadata);
      addLog(`恢复成功：${metadata.size} bytes，保存于 ${new Date(metadata.savedAt).toLocaleString()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(`恢复草稿失败：${message}`);
    }
  }, [addLog]);

  useFocusEffect(
    useCallback(() => {
      void restoreDraft();
    }, [restoreDraft])
  );

  async function pickAndSaveImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        addLog('没有相册访问权限：请在系统设置中允许后重试。');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        addLog('用户取消了选图，现有草稿保持不变。');
        return;
      }

      const source = new File(result.assets[0].uri);
      await source.copy(draftImage, { overwrite: true });
      const metadata: DraftMetadata = {
        uri: draftImage.uri,
        savedAt: new Date().toISOString(),
        size: draftImage.size ?? 0,
      };
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(metadata));
      setDraft(metadata);
      addLog(`已保存文件和元数据：${metadata.size} bytes`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(`选图或保存失败：${message}`);
    }
  }

  function confirmDelete() {
    Alert.alert('删除离线图片草稿？', '只删除本页创建的 day7-image-draft.jpg，不会删除相册原图。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          if (!draftImage.exists) {
            addLog('没有可删除的图片草稿。');
            return;
          }

          draftImage.delete();
          void AsyncStorage.removeItem(DRAFT_STORAGE_KEY).catch((error) => {
            addLog(`删除元数据失败：${String(error)}`);
          });
          setDraft(null);
          addLog('已删除文件和元数据；相册原图不受影响。');
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      style={styles.screen}>
      <Text style={styles.eyebrow}>REACT NATIVE · DAY 7</Text>
      <Text style={styles.title}>图片草稿：选、存、预览</Text>
      <Text style={styles.description}>
        相册返回的 URI 不适合当长期业务数据。这里把它复制到 Paths.document，再把 URI 和元数据存进 AsyncStorage，形成可恢复的离线草稿。
      </Text>

      <View style={styles.flowCard}>
        <Text style={styles.flow}>相册原图 → ImagePicker 返回临时 URI → File.copy → Paths.document 草稿</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. 从相册选择并保存</Text>
        <Text style={styles.hint}>首次点击会请求相册权限。裁剪和压缩发生在系统选择器里，原图不会被我们删除或修改。</Text>
        <Button label="选择图片并保存为离线草稿" onPress={() => void pickAndSaveImage()} />
        <Button label="重新校验并恢复草稿" onPress={() => void restoreDraft()} />
        <Button danger label="删除离线草稿" onPress={confirmDelete} />
      </View>

      <Text style={styles.sectionTitle}>2. 用本地 file:// URI 预览</Text>
      {draft ? (
        <View style={styles.previewCard}>
          <Image accessibilityLabel="已保存的离线图片草稿" source={{ uri: draft.uri }} style={styles.preview} />
          <Text style={styles.metadata}>保存时间：{new Date(draft.savedAt).toLocaleString()}</Text>
          <Text style={styles.metadata}>文件大小：{draft.size} bytes</Text>
          <Text numberOfLines={2} style={styles.uri}>{draft.uri}</Text>
        </View>
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.hint}>还没有草稿。选一张图后，这里会直接读取应用私有目录中的文件。</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>你刚学到的边界</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>ImagePicker 负责向系统要一张图片；FileSystem 负责保存和管理文件；AsyncStorage 保存 URI、大小、时间等小型业务元数据。</Text>
        <Text style={styles.hint}>恢复时必须检查文件是否还存在。数据记录和真实文件是两层状态，不能假设它们永远同步。</Text>
      </View>

      <Text style={styles.sectionTitle}>调用日志</Text>
      <View style={styles.logCard}>
        {log.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.logLine}>{line}</Text>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/files/network')} style={styles.nextButton}>
        <Text style={styles.nextButtonText}>进入 Day 9：远端任务列表</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>返回 Day 6</Text>
      </Pressable>
    </ScrollView>
  );
}

function Button({ danger = false, label, onPress }: { danger?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, danger && styles.dangerButton, pressed && styles.buttonPressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { gap: 16, paddingHorizontal: 20 },
  eyebrow: { color: '#2563EB', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#111827', fontSize: 30, fontWeight: '700' },
  description: { color: '#4B5563', fontSize: 16, lineHeight: 24 },
  flowCard: { padding: 16, borderRadius: 16, backgroundColor: '#DBEAFE' },
  flow: { color: '#1E3A8A', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  sectionTitle: { color: '#111827', fontSize: 20, fontWeight: '700' },
  card: { gap: 12, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  hint: { color: '#6B7280', fontSize: 14, lineHeight: 20 },
  button: { alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: 12, borderRadius: 14, backgroundColor: '#2563EB' },
  dangerButton: { backgroundColor: '#DC2626' },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  previewCard: { gap: 10, padding: 12, borderRadius: 16, backgroundColor: '#FFFFFF' },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: '#E5E7EB' },
  metadata: { color: '#374151', fontSize: 13 },
  uri: { color: '#6B7280', fontSize: 12 },
  emptyPreview: { padding: 20, borderRadius: 16, backgroundColor: '#E5E7EB' },
  logCard: { gap: 10, padding: 16, borderRadius: 16, backgroundColor: '#111827' },
  logLine: { color: '#93C5FD', fontSize: 14, lineHeight: 20 },
  nextButton: { alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#DBEAFE' },
  nextButtonText: { color: '#1D4ED8', fontSize: 15, fontWeight: '700' },
  backButton: { alignItems: 'center', padding: 14 },
  backText: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
});

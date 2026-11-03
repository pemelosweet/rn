import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 只操作这一份教学文件；它位于 app 自己的 document 沙盒内，不会碰手机的下载目录或相册。
const demoFile = new File(Paths.document, 'day6-note.txt');

export default function FilesScreen() {
  const insets = useSafeAreaInsets();
  const [log, setLog] = useState<string[]>(['先点「查看文件状态」，认识这份 demo 文件。']);

  function addLog(message: string) {
    setLog((previous) => [message, ...previous].slice(0, 10));
  }

  async function attempt(label: string, task: () => Promise<string>) {
    try {
      addLog(`${label} → ${await task()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(`${label} 失败 → ${message}`);
    }
  }

  function inspectFile() {
    return attempt('查看状态', async () => {
      if (!demoFile.exists) {
        return `文件还不存在\n${demoFile.uri}`;
      }

      const info = demoFile.info();
      const updatedAt = info.modificationTime
        ? new Date(info.modificationTime).toLocaleString()
        : '未知';
      return `存在，${info.size ?? 0} bytes，最后修改：${updatedAt}\n${demoFile.uri}`;
    });
  }

  function writeDemoFile() {
    return attempt('写入文件', async () => {
      if (!demoFile.exists) {
        demoFile.create();
      }

      const content = `Day 6: Expo FileSystem\n写入时间：${new Date().toLocaleString()}\n这份文件只在本 app 的 document 目录里。`;
      await demoFile.write(content);
      return `已写入 ${content.length} 个字符`;
    });
  }

  function readDemoFile() {
    return attempt('读取文件', async () => {
      if (!demoFile.exists) {
        return '文件不存在：请先写入一份 demo 文件。';
      }

      return `读到：\n${await demoFile.text()}`;
    });
  }

  function confirmDelete() {
    Alert.alert('删除 demo 文件？', '只会删除 day6-note.txt，不会影响项目代码或手机里的其他文件。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void attempt('删除文件', async () => {
            if (!demoFile.exists) {
              return '文件本来就不存在。';
            }

            demoFile.delete();
            return '已删除 day6-note.txt';
          });
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      style={styles.screen}>
      <Text style={styles.eyebrow}>REACT NATIVE · DAY 6</Text>
      <Text style={styles.title}>应用私有文件</Text>
      <Text style={styles.description}>
        这一页不操作手机的下载目录，而是在 app 自己的沙盒里创建一份文本文件。先把文件的生命周期跑通，再接图片、下载与离线缓存。
      </Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>SDK 58 的当前写法</Text>
        <Text style={styles.code}>new File(Paths.document, “day6-note.txt”)</Text>
        <Text style={styles.codeLabel}>安装命令</Text>
        <Text style={styles.code}>npx expo install expo-file-system</Text>
      </View>

      <Text style={styles.sectionTitle}>先分清两个目录</Text>
      <View style={styles.card}>
        <Text style={styles.conceptTitle}>Paths.document：需要留下来的文件</Text>
        <Text style={styles.cardHint}>例如离线文章、导出的 PDF、用户主动保存的内容。系统不会因为空间紧张而随意清它。</Text>
        <Text style={styles.conceptTitle}>Paths.cache：可以重新生成的缓存</Text>
        <Text style={styles.cardHint}>例如图片缓存、临时下载。存储紧张时系统可能清掉它，所以不能只靠它保存重要数据。</Text>
      </View>

      <Text style={styles.sectionTitle}>操作一份受控 demo 文件</Text>
      <View style={styles.card}>
        <Text style={styles.cardHint}>
          文件名固定为 day6-note.txt。它是 file:// URI，属于当前 app 的私有目录；卸载 app 后通常会一起被删除。
        </Text>
        <Button label="查看文件状态与 URI" onPress={inspectFile} />
        <Button label="写入一份 demo 文件" onPress={writeDemoFile} />
        <Button label="读取文件内容" onPress={readDemoFile} />
        <Button danger label="删除 demo 文件" onPress={confirmDelete} />
      </View>

      <Text style={styles.sectionTitle}>和 AsyncStorage 怎么选？</Text>
      <View style={styles.card}>
        <Text style={styles.cardHint}>AsyncStorage：小型 key-value 数据，例如任务列表、开关、登录状态。</Text>
        <Text style={styles.cardHint}>FileSystem：内容本身是文件，例如照片、附件、长文本、下载结果、缓存。</Text>
        <Text style={styles.cardHint}>常见组合：AsyncStorage 存文件的 URI 或元数据，FileSystem 存真正的大内容。</Text>
      </View>

      <Text style={styles.sectionTitle}>调用日志</Text>
      <View style={styles.logCard}>
        {log.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/files/images')} style={styles.nextButton}>
        <Text style={styles.nextButtonText}>进入 Day 7：离线图片草稿</Text>
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
  title: { color: '#111827', fontSize: 32, fontWeight: '700' },
  description: { color: '#4B5563', fontSize: 16, lineHeight: 24 },
  codeCard: { gap: 8, marginTop: 8, padding: 20, borderRadius: 16, backgroundColor: '#111827' },
  codeLabel: { color: '#93C5FD', fontSize: 12, fontWeight: '700' },
  code: { color: '#F9FAFB', fontSize: 15, fontWeight: '600' },
  sectionTitle: { marginTop: 8, color: '#111827', fontSize: 20, fontWeight: '700' },
  card: { gap: 12, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  conceptTitle: { color: '#111827', fontSize: 16, fontWeight: '700' },
  cardHint: { color: '#6B7280', fontSize: 14, lineHeight: 20 },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#2563EB',
  },
  dangerButton: { backgroundColor: '#DC2626' },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  logCard: { gap: 10, padding: 16, borderRadius: 16, backgroundColor: '#111827' },
  logLine: { color: '#93C5FD', fontSize: 14, lineHeight: 20 },
  nextButton: { alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#DBEAFE' },
  nextButtonText: { color: '#1D4ED8', fontSize: 15, fontWeight: '700' },
});

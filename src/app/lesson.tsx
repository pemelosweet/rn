import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const concepts = [
  ['文件就是路由', 'src/app/lesson.tsx 自动成为 /lesson。'],
  ['router.push', '从首页进入本页，会把新页面压入导航历史。'],
  ['router.back', '返回时恢复上一个页面的状态，而不是重新创建它。'],
];

export default function LessonScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      style={styles.screen}>
      <Text style={styles.eyebrow}>REACT NATIVE · DAY 3</Text>
      <Text style={styles.title}>Expo Router 导航</Text>
      <Text style={styles.description}>
        React 的组件状态没变；变化的是路由由文件系统声明，并自动处理 Web URL 与原生深链接。
      </Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>当前文件</Text>
        <Text style={styles.code}>src/app/lesson.tsx</Text>
        <Text style={styles.codeLabel}>对应路径</Text>
        <Text style={styles.code}>/lesson</Text>
      </View>

      <Text style={styles.sectionTitle}>三个关键点</Text>
      {concepts.map(([title, detail], index) => (
        <View key={title} style={styles.concept}>
          <Text style={styles.number}>0{index + 1}</Text>
          <View style={styles.conceptText}>
            <Text style={styles.conceptTitle}>{title}</Text>
            <Text style={styles.conceptDetail}>{detail}</Text>
          </View>
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonText}>返回任务清单</Text>
      </Pressable>
    </ScrollView>
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
  code: { color: '#F9FAFB', fontSize: 18, fontWeight: '600' },
  sectionTitle: { marginTop: 8, color: '#111827', fontSize: 20, fontWeight: '700' },
  concept: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  number: { color: '#2563EB', fontSize: 16, fontWeight: '700' },
  conceptText: { flex: 1, gap: 4 },
  conceptTitle: { color: '#111827', fontSize: 16, fontWeight: '700' },
  conceptDetail: { color: '#6B7280', fontSize: 14, lineHeight: 20 },
  button: { alignItems: 'center', marginTop: 8, paddingVertical: 15, borderRadius: 14, backgroundColor: '#2563EB' },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

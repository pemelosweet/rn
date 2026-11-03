import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function FilesWebScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>WEB 降级页面</Text>
      <Text style={styles.title}>Day 6 文件系统</Text>
      <Text style={styles.description}>
        Paths.document 是 Android/iOS 应用沙盒能力，浏览器没有对应的私有文件目录，因此这部分请在 Expo Go 真机或模拟器中练习。
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/files/network')} style={styles.button}>
        <Text style={styles.buttonText}>在浏览器继续 Day 9：查看网络请求</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: 16, padding: 24, backgroundColor: '#F4F7FB' },
  eyebrow: { color: '#2563EB', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#111827', fontSize: 30, fontWeight: '700' },
  description: { color: '#4B5563', fontSize: 16, lineHeight: 24 },
  button: { alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#2563EB' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
});

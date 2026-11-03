import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ImagesWebScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>WEB 降级页面</Text>
      <Text style={styles.title}>Day 7 离线图片草稿</Text>
      <Text style={styles.description}>
        此课程依赖手机相册和应用私有文件目录，应在 Android 真机或模拟器中运行。浏览器端请直接练习 Day 9 的网络请求。
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/files/network')} style={styles.button}>
        <Text style={styles.buttonText}>进入 Day 9：远端任务列表</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>返回 Day 6</Text>
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
  backButton: { alignItems: 'center', padding: 10 },
  backText: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
});

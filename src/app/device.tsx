import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const steps = [
  ['① 设备支持吗', '先问一句「这台机器有没有这个能力」。平板、模拟器、网页常常没有震动马达。'],
  ['② 用户授权了吗', '剪贴板和震动都不需要权限；相机、定位才需要。别一上来就写权限代码。'],
  ['③ 调用', 'await 一个异步函数，JS 通过「对讲机」把请求转给原生代码去做。'],
  ['④ 失败了怎么办', '用户拒绝、取消、设备不支持都会 throw。try/catch 不是可选项。'],
];

export default function DeviceScreen() {
  const insets = useSafeAreaInsets();
  const [log, setLog] = useState<string[]>(['还没点过按钮，下面会显示每次调用的结果。']);

  // 所有原生调用都套同一个壳：成功打结果，失败打原因，这就是骨架第 ④ 步。
  async function attempt(label: string, task: () => Promise<string>) {
    try {
      const result = await task();
      setLog((prev) => [`${label} → ${result}`, ...prev].slice(0, 12));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLog((prev) => [`${label} 失败 → ${message}`, ...prev].slice(0, 12));
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      style={styles.screen}>
      <Text style={styles.eyebrow}>REACT NATIVE · DAY 5</Text>
      <Text style={styles.title}>剪贴板 + 震动反馈</Text>
      <Text style={styles.description}>
        这是原生能力里最简单的一对：不要权限、不要配置，但已经要走完「调用原生代码」的全流程了。
      </Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>装了什么</Text>
        <Text style={styles.code}>expo-clipboard / expo-haptics</Text>
        <Text style={styles.codeLabel}>怎么用 npx 装（它会挑和 SDK 58 匹配的版本）</Text>
        <Text style={styles.code}>npx expo install expo-clipboard expo-haptics</Text>
      </View>

      <Text style={styles.sectionTitle}>原生能力的四步骨架</Text>
      {steps.map(([title, detail], index) => (
        <View key={title} style={styles.concept}>
          <Text style={styles.number}>0{index + 1}</Text>
          <View style={styles.conceptText}>
            <Text style={styles.conceptTitle}>{title}</Text>
            <Text style={styles.conceptDetail}>{detail}</Text>
          </View>
        </View>
      ))}

      <View style={styles.platformCard}>
        <Text style={styles.platformLabel}>第 ① 步现场演示：这段代码自己就在判断设备</Text>
        <Text style={styles.platformValue}>
          Platform.OS = {Platform.OS}，所以震动按钮
          {Platform.OS === 'android' ? '会用 Android 专属的那组效果。' : '只发通用效果。'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>剪贴板</Text>
      <View style={styles.card}>
        <Text style={styles.cardHint}>
          写入不需要权限。Android 13+ 复制成功后系统会在屏幕下方弹一个预览条，那是系统的行为，不是 app 的 bug。
        </Text>
        <Button label="复制一段文字" onPress={() => attempt('写入剪贴板', async () => {
          await Clipboard.setStringAsync('Hello from MyApp · DAY 5');
          return '已写入 "Hello from MyApp · DAY 5"';
        })} />
        <Button label="看看剪贴板里有没有字" onPress={() => attempt('检查剪贴板', async () => {
          const has = await Clipboard.hasStringAsync();
          return has ? '有文本' : '空的';
        })} />
        <Button label="读出剪贴板" onPress={() => attempt('读取剪贴板', async () => {
          const text = await Clipboard.getStringAsync();
          return text === '' ? '读回来是空的（也可能没权限或被系统挡了）' : text;
        })} />
      </View>

      <Text style={styles.sectionTitle}>震动反馈</Text>
      <View style={styles.card}>
        <Text style={styles.cardHint}>
          重要：安卓模拟器大多没有震动马达，点按钮「没感觉」很正常，日志里显示成功只说明调用通了。要真的摸到震动，得用真机。
        </Text>
        <View style={styles.buttonRow}>
          <Button
            label="Light"
            onPress={() => attempt('impactAsync', async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              return 'light 清脆一下';
            })}
          />
          <Button
            label="Medium"
            onPress={() => attempt('impactAsync', async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              return 'medium 中等';
            })}
          />
          <Button
            label="Heavy"
            onPress={() => attempt('impactAsync', async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              return 'heavy 沉闷一下';
            })}
          />
        </View>
        <Button label={'列表滑动时的「哒哒」声'} onPress={() => attempt('selectionAsync', async () => {
          await Haptics.selectionAsync();
          return 'selection 轻微一下';
        })} />
        <Button
          label="成功 / 警告 / 失败三种通知震动"
          onPress={async () => {
            await attempt('notificationAsync', async () => {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              return 'success';
            });
            await attempt('notificationAsync', async () => {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              return 'warning';
            });
            await attempt('notificationAsync', async () => {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              return 'error';
            });
          }}
        />
        {Platform.OS === 'android' && (
          <Button
            label="Android 专属：系统级触觉 confirm"
            onPress={() => attempt('performAndroidHapticsAsync', async () => {
              await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
              return '系统 confirm 效果（iOS 没有这个 API）';
            })}
          />
        )}
      </View>

      <Text style={styles.sectionTitle}>调用日志</Text>
      <View style={styles.logCard}>
        {log.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </View>

      <Text style={styles.footer}>
        下一步（DAY 6）：文件系统。那时会第一次遇到「文件存在哪、能存多大、什么时候被系统清掉」这类真问题。
      </Text>
    </ScrollView>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
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
  code: { color: '#F9FAFB', fontSize: 16, fontWeight: '600' },
  sectionTitle: { marginTop: 8, color: '#111827', fontSize: 20, fontWeight: '700' },
  concept: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  number: { color: '#2563EB', fontSize: 16, fontWeight: '700' },
  conceptText: { flex: 1, gap: 4 },
  conceptTitle: { color: '#111827', fontSize: 16, fontWeight: '700' },
  conceptDetail: { color: '#6B7280', fontSize: 14, lineHeight: 20 },
  platformCard: { gap: 6, padding: 16, borderRadius: 16, backgroundColor: '#DBEAFE' },
  platformLabel: { color: '#1E40AF', fontSize: 12, fontWeight: '700' },
  platformValue: { color: '#111827', fontSize: 15, lineHeight: 22 },
  card: { gap: 12, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  cardHint: { color: '#6B7280', fontSize: 14, lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#2563EB',
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  logCard: { gap: 10, padding: 16, borderRadius: 16, backgroundColor: '#111827' },
  logLine: { color: '#93C5FD', fontSize: 14, lineHeight: 20 },
  footer: { color: '#6B7280', fontSize: 14, lineHeight: 20 },
});

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TODOS_URL = 'https://jsonplaceholder.typicode.com/todos?userId=1';

type RemoteTodo = {
  id: number;
  title: string;
  completed: boolean;
};

type RequestStatus = 'loading' | 'refreshing' | 'success' | 'error';

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const [todos, setTodos] = useState<RemoteTodo[]>([]);
  const [status, setStatus] = useState<RequestStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadTodos = useCallback(async (isRefresh = false) => {
    setStatus(isRefresh ? 'refreshing' : 'loading');
    setErrorMessage('');

    try {
      const response = await fetch(TODOS_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error('接口返回的数据不是数组');
      }

      const nextTodos = payload
        .filter((item): item is RemoteTodo => {
          if (!item || typeof item !== 'object') return false;
          const todo = item as Record<string, unknown>;
          return typeof todo.id === 'number' && typeof todo.title === 'string' && typeof todo.completed === 'boolean';
        })
        .slice(0, 10);

      setTodos(nextTodos);
      setStatus('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTodos();
    }, [loadTodos])
  );

  return (
    <FlatList
      data={todos}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      style={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={status === 'refreshing'}
          onRefresh={() => void loadTodos(true)}
          tintColor="#2563EB"
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>REACT NATIVE · DAY 9</Text>
          <Text style={styles.title}>远端列表与请求状态</Text>
          <Text style={styles.description}>
            这份列表来自公开演示 API。重点不是接口内容，而是把网络请求的加载、失败、重试和下拉刷新做完整。
          </Text>
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>请求地址</Text>
            <Text style={styles.code}>GET /todos?userId=1</Text>
            <Text style={styles.codeHint}>生产项目中，把这个 URL 换成自己的服务端地址；不要把密钥写进客户端。</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        status === 'loading' ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2563EB" />
            <Text style={styles.stateText}>正在请求远端任务…</Text>
          </View>
        ) : status === 'error' ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorTitle}>请求失败</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Button label="重试" onPress={() => void loadTodos()} />
          </View>
        ) : (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>接口成功了，但没有返回任务。</Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <View style={styles.todoCard}>
          <View style={[styles.statusDot, item.completed && styles.statusDotDone]} />
          <View style={styles.todoContent}>
            <Text style={styles.todoTitle}>{item.title}</Text>
            <Text style={styles.todoMeta}>远端 ID: {item.id} · {item.completed ? '已完成' : '待完成'}</Text>
          </View>
        </View>
      )}
      ListFooterComponent={
        status === 'success' && todos.length > 0 ? (
          <View style={styles.footer}>
            <Text style={styles.footerText}>下拉即可重新请求。下一步会加入详情页和分页。</Text>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>返回 Day 7</Text>
            </Pressable>
          </View>
        ) : undefined
      }
    />
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { gap: 12, paddingHorizontal: 20 },
  header: { gap: 16, marginBottom: 4 },
  eyebrow: { color: '#2563EB', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#111827', fontSize: 30, fontWeight: '700' },
  description: { color: '#4B5563', fontSize: 16, lineHeight: 24 },
  codeCard: { gap: 6, padding: 16, borderRadius: 16, backgroundColor: '#111827' },
  codeLabel: { color: '#93C5FD', fontSize: 12, fontWeight: '700' },
  code: { color: '#F9FAFB', fontSize: 16, fontWeight: '700' },
  codeHint: { color: '#CBD5E1', fontSize: 13, lineHeight: 19 },
  stateCard: { alignItems: 'center', gap: 12, padding: 24, borderRadius: 16, backgroundColor: '#FFFFFF' },
  stateText: { color: '#4B5563', fontSize: 15, textAlign: 'center' },
  errorTitle: { color: '#B91C1C', fontSize: 18, fontWeight: '700' },
  errorText: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
  button: { minWidth: 120, alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#2563EB' },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  todoCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  statusDot: { width: 12, height: 12, marginTop: 4, borderRadius: 6, backgroundColor: '#F59E0B' },
  statusDotDone: { backgroundColor: '#22C55E' },
  todoContent: { flex: 1, gap: 6 },
  todoTitle: { color: '#111827', fontSize: 16, fontWeight: '600', lineHeight: 22 },
  todoMeta: { color: '#6B7280', fontSize: 13 },
  footer: { alignItems: 'center', gap: 10, paddingTop: 8 },
  footerText: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
  backButton: { padding: 12 },
  backText: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
});

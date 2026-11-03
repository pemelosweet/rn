import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Lesson = {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
};

const initialLessons: Lesson[] = [
  { id: 'layout', title: '布局：View 与 StyleSheet', detail: '用 Flexbox 组织移动端界面。', completed: true },
  { id: 'pressable', title: '交互：Pressable', detail: '处理点击、按下与长按等触摸手势。', completed: false },
  { id: 'list', title: '长列表：FlatList', detail: '只渲染可见区域，适合真实业务数据。', completed: false },
  { id: 'navigation', title: '下一步：Expo Router', detail: '用文件系统路由创建多页面应用。', completed: false },
];

const LESSONS_STORAGE_KEY = '@myapp/lessons';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [lessons, setLessons] = useState(initialLessons);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [hasRestoredLessons, setHasRestoredLessons] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const completedCount = useMemo(() => lessons.filter((lesson) => lesson.completed).length, [lessons]);

  useEffect(() => {
    let isActive = true;

    async function restoreLessons() {
      try {
        const storedLessons = await AsyncStorage.getItem(LESSONS_STORAGE_KEY);
        if (storedLessons && isActive) {
          const parsedLessons: unknown = JSON.parse(storedLessons);
          if (Array.isArray(parsedLessons)) {
            setLessons(parsedLessons as Lesson[]);
          }
        }
      } catch (error) {
        console.warn('无法恢复本地任务数据', error);
      } finally {
        if (isActive) {
          setHasRestoredLessons(true);
        }
      }
    }

    void restoreLessons();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasRestoredLessons) return;

    void AsyncStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons)).catch((error) => {
      console.warn('无法保存本地任务数据', error);
    });
  }, [hasRestoredLessons, lessons]);

  function toggleLesson(id: string) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === id ? { ...lesson, completed: !lesson.completed } : lesson,
      ),
    );
  }

  function addLesson() {
    const title = newLessonTitle.trim();
    if (!title) return;

    setLessons((currentLessons) => [
      ...currentLessons,
      {
        id: `custom-${Date.now()}`,
        title,
        detail: '这是你刚刚在移动端创建的任务。',
        completed: false,
      },
    ]);
    setNewLessonTitle('');
    Keyboard.dismiss();
  }

  function openEditor(lesson: Lesson) {
    setEditingLesson(lesson);
    setEditingTitle(lesson.title);
  }

  function closeEditor() {
    setEditingLesson(null);
    setEditingTitle('');
  }

  function saveEditing() {
    if (!editingLesson) return;
    const title = editingTitle.trim();
    if (!title) return;

    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === editingLesson.id ? { ...lesson, title } : lesson,
      ),
    );
    closeEditor();
  }

  function confirmDelete(lesson: Lesson) {
    Alert.alert('删除任务？', `“${lesson.title}”将从本地任务清单中移除。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => setLessons((currentLessons) => currentLessons.filter((item) => item.id !== lesson.id)),
      },
    ]);
  }

  if (!hasRestoredLessons) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#2563EB" size="large" />
        <Text style={styles.loadingText}>正在恢复本地任务…</Text>
      </View>
    );
  }

  return (
    <>
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      style={styles.screen}>
      <FlatList
        data={lessons}
        keyExtractor={(lesson) => lesson.id}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
          <Text style={styles.eyebrow}>REACT NATIVE · DAY 4</Text>
          <Text style={styles.title}>完成一份原生任务清单</Text>
          <Text style={styles.description}>
            用输入框创建一项任务。键盘的“完成”键与按钮都会提交；这就是移动端表单的基础闭环。
          </Text>
          <View style={styles.form}>
            <TextInput
              accessibilityLabel="新任务名称"
              autoCapitalize="sentences"
              onChangeText={setNewLessonTitle}
              onSubmitEditing={addLesson}
              placeholder="例如：学习 TextInput"
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              submitBehavior="submit"
              value={newLessonTitle}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!newLessonTitle.trim()}
              onPress={addLesson}
              style={({ pressed }) => [
                styles.addButton,
                !newLessonTitle.trim() && styles.addButtonDisabled,
                pressed && styles.itemPressed,
              ]}>
              <Text style={styles.addButtonText}>添加</Text>
            </Pressable>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>学习进度</Text>
            <Text style={styles.progressValue}>{completedCount} / {lessons.length}</Text>
          </View>
          <Text style={styles.sectionTitle}>课程任务</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.completed }}
              accessibilityHint={item.id === 'navigation' ? '打开 Expo Router 课程页' : '切换任务完成状态'}
              onPress={() => (item.id === 'navigation' ? router.push('/lesson') : toggleLesson(item.id))}
              style={({ pressed }) => [styles.itemMain, pressed && styles.itemPressed]}>
              <View style={[styles.check, item.completed && styles.checkCompleted]}>
                <Text style={styles.checkText}>{item.completed ? '✓' : ''}</Text>
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemTitle, item.completed && styles.itemTitleCompleted]}>{item.title}</Text>
                <Text style={styles.itemDetail}>{item.detail}</Text>
              </View>
            </Pressable>
            <View style={styles.itemActions}>
              <Pressable accessibilityLabel={`编辑${item.title}`} onPress={() => openEditor(item)} style={styles.actionButton}>
                <Text style={styles.editText}>编辑</Text>
              </Pressable>
              <Pressable accessibilityLabel={`删除${item.title}`} onPress={() => confirmDelete(item)} style={styles.actionButton}>
                <Text style={styles.deleteText}>删除</Text>
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={<Text style={styles.tip}>你创建的任务只保存在当前内存中；下一步会把它持久化。</Text>}
        ListFooterComponentStyle={styles.footer}
      />
    </KeyboardAvoidingView>
    <Modal
      animationType="fade"
      onRequestClose={closeEditor}
      transparent
      visible={editingLesson !== null}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>编辑任务</Text>
          <Text style={styles.modalDescription}>修改后会自动保存到本机。</Text>
          <TextInput
            accessibilityLabel="任务名称"
            autoFocus
            onChangeText={setEditingTitle}
            onSubmitEditing={saveEditing}
            returnKeyType="done"
            submitBehavior="submit"
            value={editingTitle}
            style={styles.modalInput}
          />
          <View style={styles.modalActions}>
            <Pressable onPress={closeEditor} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </Pressable>
            <Pressable
              disabled={!editingTitle.trim()}
              onPress={saveEditing}
              style={[styles.saveButton, !editingTitle.trim() && styles.addButtonDisabled]}>
              <Text style={styles.addButtonText}>保存</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F4F7FB' },
  loadingText: { color: '#4B5563', fontSize: 16 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 36, backgroundColor: '#F4F7FB' },
  header: { gap: 12, marginBottom: 24 },
  eyebrow: { color: '#2563EB', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#111827', fontSize: 30, fontWeight: '700', lineHeight: 38 },
  description: { color: '#4B5563', fontSize: 16, lineHeight: 24 },
  form: { flexDirection: 'row', gap: 10, marginTop: 4 },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#BFDBFE',
    color: '#111827',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  addButton: { alignItems: 'center', justifyContent: 'center', minWidth: 76, borderRadius: 12, backgroundColor: '#2563EB' },
  addButtonDisabled: { backgroundColor: '#93C5FD' },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  progressCard: { alignItems: 'center', gap: 4, marginTop: 8, padding: 20, borderRadius: 16, backgroundColor: '#2563EB' },
  progressLabel: { color: '#DBEAFE', fontSize: 14, fontWeight: '600' },
  progressValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
  sectionTitle: { marginTop: 8, color: '#111827', fontSize: 18, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, backgroundColor: '#FFFFFF' },
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 4 },
  itemPressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  check: { alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderWidth: 2, borderRadius: 14, borderColor: '#93C5FD' },
  checkCompleted: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  checkText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  itemText: { flex: 1, gap: 4 },
  itemTitle: { color: '#111827', fontSize: 16, fontWeight: '700' },
  itemTitleCompleted: { color: '#6B7280', textDecorationLine: 'line-through' },
  itemDetail: { color: '#6B7280', fontSize: 14, lineHeight: 20 },
  itemActions: { gap: 2 },
  actionButton: { minWidth: 44, paddingVertical: 6, alignItems: 'center' },
  editText: { color: '#2563EB', fontSize: 13, fontWeight: '700' },
  deleteText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
  separator: { height: 12 },
  footer: { paddingTop: 20 },
  tip: { color: '#6B7280', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(17, 24, 39, 0.5)' },
  modalCard: { gap: 12, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF' },
  modalTitle: { color: '#111827', fontSize: 22, fontWeight: '700' },
  modalDescription: { color: '#6B7280', fontSize: 14 },
  modalInput: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12, borderColor: '#BFDBFE', color: '#111827', fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#E5E7EB' },
  cancelButtonText: { color: '#374151', fontSize: 16, fontWeight: '700' },
  saveButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2563EB' },
});

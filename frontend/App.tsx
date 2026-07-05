import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, SafeAreaView, useColorScheme } from 'react-native';
import { UploadScreen } from './src/components/UploadScreen';
import { ProgressScreen } from './src/components/ProgressScreen';
import { PreviewScreen } from './src/components/PreviewScreen';
import { UploadResult, ParsedEvent } from './src/types';
import { uploadFile, exportICS } from './src/api';

export default function App() {
  const [screen, setScreen] = useState<'upload' | 'progress' | 'preview' | 'done'>('upload');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const handleUpload = async (file: File) => {
    setError(null);
    setScreen('progress');
    try {
      const data = await uploadFile(file);
      setResult(data);
      setEvents(data.events);
      setScreen('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setScreen('upload');
    }
  };

  const handleExport = async () => {
    if (!result) return;
    try {
      const blob = await exportICS(result.sessionId, events, result.fileName.replace(/\.[^.]+$/, ''));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.fileName.replace(/\.[^.]+$/, '')}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      setScreen('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const backgroundColor = isDark ? '#000000' : '#F2F2F7';
  const textColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Excel Calendar</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {screen === 'upload' && <UploadScreen onUpload={handleUpload} isDark={isDark} />}
      {screen === 'progress' && <ProgressScreen isDark={isDark} />}
      {screen === 'preview' && (
        <PreviewScreen
          events={events}
          onChange={setEvents}
          onExport={handleExport}
          fileName={result?.fileName || ''}
          warnings={result?.warnings || []}
          isDark={isDark}
        />
      )}
      {screen === 'done' && (
        <View style={styles.doneBox}>
          <Text style={[styles.doneText, { color: textColor }]}>Calendar file downloaded!</Text>
          <Text style={[styles.hint, { color: isDark ? '#8E8E93' : '#6B7280' }]}>
            Open the .ics file to import into Apple Calendar.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  errorBox: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
  },
  errorText: {
    color: '#B71C1C',
  },
  doneBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  doneText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
  },
});

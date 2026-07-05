import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';

const messages = [
  'Reading spreadsheet...',
  'Finding dates...',
  'Finding timetable...',
  'Understanding layout...',
  'Creating events...',
  'Almost done...',
];

interface ProgressScreenProps {
  isDark?: boolean;
}

export function ProgressScreen({ isDark }: ProgressScreenProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev: number) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const text = isDark ? '#FFFFFF' : '#000000';
  const subtext = isDark ? '#8E8E93' : '#6B7280';

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={[styles.message, { color: text }]}>{messages[index]}</Text>
      <Text style={[styles.subtitle, { color: subtext }]}>
        AI is understanding your timetable
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
  },
});

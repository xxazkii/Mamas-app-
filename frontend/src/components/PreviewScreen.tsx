import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { AlertTriangle, Download, Trash2 } from 'lucide-react-native';
import { ParsedEvent } from '../types';

interface PreviewScreenProps {
  events: ParsedEvent[];
  onChange: (events: ParsedEvent[]) => void;
  onExport: () => void;
  fileName: string;
  warnings: string[];
  isDark?: boolean;
}

export function PreviewScreen({ events, onChange, onExport, fileName, warnings, isDark }: PreviewScreenProps) {
  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#000000';
  const subtext = isDark ? '#8E8E93' : '#6B7280';
  const border = isDark ? '#38383A' : '#E5E7EB';
  const accent = '#007AFF';
  const warningColor = '#F59E0B';

  const updateEvent = (id: string, patch: Partial<ParsedEvent>) => {
    onChange(events.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const deleteEvent = (id: string) => {
    onChange(events.filter((e) => e.id !== id));
  };

  const lowConfidence = events.filter((e) => e.confidence < 80);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: text }]}>
          {events.length} events detected
        </Text>
        {warnings.length > 0 && (
          <View style={[styles.warningRow, { borderColor: warningColor }]}>
            <AlertTriangle size={16} color={warningColor} />
            <Text style={[styles.warningText, { color: warningColor }]}>
              {warnings.length} warning{warnings.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {lowConfidence.length > 0 && (
          <View style={[styles.banner, { backgroundColor: isDark ? '#3E2723' : '#FFF3E0' }]}>
            <Text style={[styles.bannerText, { color: isDark ? '#FFCC80' : '#E65100' }]}>
              {lowConfidence.length} event{lowConfidence.length > 1 ? 's' : ''} need review
            </Text>
          </View>
        )}

        {events.map((event) => (
          <View key={event.id} style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
            <View style={styles.row}>
              <TextInput
                style={[styles.titleInput, { color: text, borderColor: border }]}
                value={event.title}
                onChangeText={(value: string) => updateEvent(event.id, { title: value })}
                placeholder="Title"
                placeholderTextColor={subtext}
              />
              <Pressable onPress={() => deleteEvent(event.id)} style={styles.deleteBtn}>
                <Trash2 size={18} color="#FF3B30" />
              </Pressable>
            </View>

            <View style={styles.row}>
              <TextInput
                style={[styles.input, { color: text, borderColor: border }]}
                value={event.startDate}
                onChangeText={(value: string) => updateEvent(event.id, { startDate: value, endDate: value })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={subtext}
              />
              <TextInput
                style={[styles.input, { color: text, borderColor: border }]}
                value={`${event.startTime} - ${event.endTime}`}
                onChangeText={(value: string) => {
                  const [start, end] = value.split(' - ');
                  updateEvent(event.id, { startTime: start || event.startTime, endTime: end || event.endTime });
                }}
                placeholder="HH:mm - HH:mm"
                placeholderTextColor={subtext}
              />
            </View>

            <TextInput
              style={[styles.input, { color: text, borderColor: border }]}
              value={event.location || ''}
              onChangeText={(value: string) => updateEvent(event.id, { location: value })}
              placeholder="Location"
              placeholderTextColor={subtext}
            />

            <TextInput
              style={[styles.input, { color: text, borderColor: border }]}
              value={event.description || ''}
              onChangeText={(value: string) => updateEvent(event.id, { description: value })}
              placeholder="Description"
              placeholderTextColor={subtext}
            />

            {event.warnings.length > 0 && (
              <Text style={[styles.warning, { color: warningColor }]}>
                {event.warnings.join(' • ')}
              </Text>
            )}

            <Text style={[styles.confidence, { color: event.confidence >= 80 ? '#34C759' : warningColor }]}>
              Confidence {event.confidence}%
            </Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Pressable style={[styles.exportBtn, { backgroundColor: accent }]} onPress={onExport}>
        <Download size={20} color="#FFFFFF" />
        <Text style={styles.exportText}>Import into Apple Calendar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  banner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  deleteBtn: {
    padding: 10,
    justifyContent: 'center',
  },
  warning: {
    fontSize: 12,
    marginTop: 8,
  },
  confidence: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  exportBtn: {
    margin: 20,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

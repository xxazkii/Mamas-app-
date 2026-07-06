import React from 'react';
import { StyleSheet, View, Text, Pressable, useColorScheme } from 'react-native';
import { Upload } from 'lucide-react-native';

interface UploadScreenProps {
  onUpload: (file: File) => void;
  isDark?: boolean;
}

export function UploadScreen({ onUpload, isDark }: UploadScreenProps) {
  const scheme = useColorScheme();
  const dark = isDark ?? scheme === 'dark';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const bg = dark ? '#1C1C1E' : '#FFFFFF';
  const text = dark ? '#FFFFFF' : '#000000';
  const subtext = dark ? '#8E8E93' : '#6B7280';
  const accent = '#007AFF';

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: bg }]}>
        <Upload size={48} color={accent} />
        <Text style={[styles.heading, { color: text }]}>Upload your timetable</Text>
        <Text style={[styles.subtitle, { color: subtext }]}>
          Drop an .xlsx or .xls file to get started
        </Text>

        <Pressable style={[styles.button, { backgroundColor: accent }]} onPress={() => {}}>
          <label style={styles.label}>
            <Text style={styles.buttonText}>Browse Files</Text>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={styles.input} />
          </label>
        </Pressable>
      </View>
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
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  label: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    cursor: 'pointer',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  input: {
    display: 'none',
  },
});

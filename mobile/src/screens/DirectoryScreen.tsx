import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Banner, Body, SourceBadge } from '../components/ui';
import { COLORS } from '../config';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Directory'>;

export default function DirectoryScreen({ navigation }: Props) {
  const { directory, directorySource, refreshDirectory, online } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDirectory();
    setRefreshing(false);
  };

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={directory}
      keyExtractor={(m) => m.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 8 }}>
          <SourceBadge source={directorySource} />
          {!online ? <View style={{ marginTop: 8 }}><Banner kind="info" text="Offline: showing the saved directory. Profiles still open." /></View> : null}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.fullName}, ${item.role}. Open profile`}
          onPress={() => navigation.navigate('Profile', { memberId: item.id, name: item.fullName })}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.name}>{item.fullName}</Text>
          <Body>{item.role}</Body>
          <Text style={styles.feature}>Built: {item.feature}</Text>
          <Text style={styles.gh}>@{item.githubUsername}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  row: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, minHeight: 64 },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  feature: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  gh: { fontSize: 14, color: COLORS.info, marginTop: 2 },
});

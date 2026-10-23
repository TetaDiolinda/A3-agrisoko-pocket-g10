import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Banner, Body, Button, Card, H, Label, LinkRow, SourceBadge } from '../components/ui';
import { COLORS } from '../config';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { result, notice } = route.params;
  const pct = Math.round(result.confidence * 100);

  if (!result.matched) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Card>
          <H>No confident match found</H>
          <SourceBadge source={result.source} />
          <Body style={{ marginTop: 8 }}>
            {result.message ?? 'No confident match was found. Try a member name, role or feature.'}
          </Body>
          <Label>Why</Label>
          <Body>{result.reason}</Body>
          <Label>Best score</Label>
          <Body>{pct}% (needs {result.threshold != null ? Math.round(result.threshold * 100) : '—'}%)</Body>
          <Label>Try one of these</Label>
          {result.suggestions.map((s) => (
            <Body key={s}>• {s}</Body>
          ))}
        </Card>
        <View style={{ gap: 12 }}>
          <Button title="Ask something else" onPress={() => navigation.navigate('Ask')} />
          <Button title="Choose from the directory" variant="secondary" onPress={() => navigation.navigate('Directory')} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {notice ? <Banner kind="warn" text={notice} /> : null}
      <Card>
        <SourceBadge source={result.source} />
        <H>{result.memberName}</H>
        <Body>{result.role}</Body>
        <Label>Confidence</Label>
        <View accessible accessibilityLabel={`Confidence ${pct} percent`} style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.max(4, pct)}%` }]} />
        </View>
        <Body style={{ fontWeight: '700' }}>{pct}%</Body>
        <Label>Why this member</Label>
        <Body>{result.reason}</Body>
        <Label>Introduction</Label>
        <Body>{result.introduction}</Body>
      </Card>
      <Card>
        <Label>Evidence links</Label>
        {result.evidenceLinks.length === 0 ? <Body>No evidence links recorded yet.</Body> : null}
        {result.evidenceLinks.map((l) => (
          <LinkRow key={l.label} label={l.label} url={l.url} />
        ))}
      </Card>
      <View style={{ gap: 12 }}>
        <Button
          title="Open full profile"
          onPress={() => result.memberId && navigation.navigate('Profile', { memberId: result.memberId, name: result.memberName ?? undefined })}
        />
        <Button title="Ask another question" variant="secondary" onPress={() => navigation.navigate('Ask')} />
      </View>
      <Body style={styles.small}>Model: {result.modelVersion} · Group {result.groupCode}</Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  barBg: { height: 12, borderRadius: 6, backgroundColor: '#DDE6D9', overflow: 'hidden', marginVertical: 4 },
  barFill: { height: 12, backgroundColor: COLORS.primary },
  small: { fontSize: 12, color: COLORS.muted, marginTop: 12 },
});

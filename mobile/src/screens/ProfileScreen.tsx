import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Banner, Body, Card, H, Label, LinkRow, Loading, SourceBadge } from '../components/ui';
import { COLORS } from '../config';
import { useApp } from '../context/AppContext';
import { api, describeError } from '../lib/api';
import { introductionFor } from '../lib/offlineMatch';
import { cache } from '../lib/storage';
import { Member, RootStackParamList, Source } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ route, navigation }: Props) {
  const { memberId, name } = route.params;
  const { online, bundled } = useApp();
  const [member, setMember] = useState<Member | null>(null);
  const [source, setSource] = useState<Source>('offline');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    let reason: string | null = null;
    if (online) {
      try {
        const live = await api.member(memberId);
        setMember(live);
        setSource('live');
        await cache.setProfile(live);
        setLoading(false);
        return;
      } catch (e) {
        reason = describeError(e);
      }
    }
    const saved = await cache.getProfile(memberId);
    if (saved) {
      setMember(saved);
      setSource('cached');
    } else {
      const local = bundled.find((m) => m.id === memberId) ?? null;
      setMember(local);
      setSource('offline');
    }
    if (reason) setNotice(`${reason} Showing the copy stored on this phone.`);
    setLoading(false);
  }, [memberId, online, bundled]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (member) navigation.setOptions({ title: member.fullName });
    else if (name) navigation.setOptions({ title: name });
  }, [member, name, navigation]);

  if (loading) return <Loading text="Loading profile…" />;
  if (!member) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Banner kind="error" text="This profile could not be found." actionLabel="Retry" onAction={load} />
      </ScrollView>
    );
  }

  const metric = member.outcomeMetric?.trim();
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {notice ? <Banner kind="warn" text={notice} actionLabel="Retry" onAction={load} /> : null}
      <Card>
        <SourceBadge source={source} />
        <H>{member.fullName}</H>
        <Body>{member.role}</Body>
        <Label>Registration number</Label>
        <Body>{member.registrationNumber}</Body>
        <Label>GitHub</Label>
        <Body>@{member.githubUsername}</Body>
        <Label>Also known as</Label>
        <Body>{member.aliases.join(', ') || '—'}</Body>
      </Card>
      <Card>
        <Label>Introduction</Label>
        <Body>{introductionFor(member)}</Body>
        <Label>Target user</Label>
        <Body>{member.targetUser}</Body>
        <Label>Problem addressed</Label>
        <Body>{member.problem}</Body>
      </Card>
      <Card>
        <Label>Owned contribution</Label>
        <Body>{member.contribution}</Body>
        <Label>Feature</Label>
        <Body>{member.feature}</Body>
        <Label>Skills</Label>
        <Body>{member.skills.join(' · ')}</Body>
      </Card>
      <Card>
        <Label>Measured evidence</Label>
        <Body>{metric || 'No verified outcome metric has been recorded yet.'}</Body>
        <Label>Tester feedback</Label>
        {member.testerFeedback.length === 0 ? <Body>No verified tester feedback recorded yet.</Body> : null}
        {member.testerFeedback.map((f, i) => (
          <Body key={i}>• {f}</Body>
        ))}
      </Card>
      <Card>
        <Label>Repository and demo evidence</Label>
        {member.evidenceLinks.map((l) => (
          <LinkRow key={l.label} label={l.label} url={l.url} />
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
});

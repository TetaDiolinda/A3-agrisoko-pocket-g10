import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Banner, Body, Button, Card, H, Label, LinkRow } from '../components/ui';
import { API_BASE_URL, APP_NAME, APP_VERSION, COLORS, GITHUB_URL, GROUP_CODE, GROUP_VERIFICATION_CODE } from '../config';
import { useApp } from '../context/AppContext';
import { api, describeError } from '../lib/api';

interface Info { modelVersion: string; vectorizer: string; threshold: number; datasetFingerprint: string; buildCommit: string; limitations: string[] }

export default function AboutScreen() {
  const { apiStatus, checkApi, online } = useApp();
  const [info, setInfo] = useState<Info | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    await checkApi();
    try {
      setInfo(await api.modelInfo());
    } catch (e) {
      setInfo(null);
      setErr(describeError(e));
    }
  }, [checkApi]);

  useEffect(() => { if (online) load(); }, [online, load]);

  const statusText = apiStatus === 'up' ? 'Reachable' : apiStatus === 'down' ? 'Unavailable' : 'Not checked yet';
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Card>
        <H>{APP_NAME}</H>
        <Label>APK version</Label><Body>v{APP_VERSION}</Body>
        <Label>Group verification code</Label><Body selectable>{GROUP_VERIFICATION_CODE}</Body>
        <Label>Group code</Label><Body>{GROUP_CODE}</Body>
        <Label>GitHub repository</Label>
        <LinkRow label={GITHUB_URL || 'Not set'} url={GITHUB_URL} />
      </Card>
      <Card>
        <H>Data and AI approach</H>
        <Label>Data source</Label>
        <Body>Approved member records in members.json, reviewed by each member. Nothing else is used.</Body>
        <Label>Model approach</Label>
        <Body>
          A small deterministic TF-IDF retrieval model (words and character n-grams, cosine similarity) with an exact name/alias boost.
          No generative AI. Offline, the phone matches only exact names, nicknames and roles.
        </Body>
        <Label>Limitations</Label>
        <Body>• Answers only about team members{'\n'}• Word-based matching can miss synonyms{'\n'}• No metric or testimonial is shown unless it is in the approved record</Body>
      </Card>
      <Card>
        <H>API status</H>
        <Label>Server</Label><Body selectable>{API_BASE_URL}</Body>
        <Label>Status</Label><Body>{statusText}</Body>
        {err ? <Banner kind="warn" text={err} /> : null}
        {info ? (
          <>
            <Label>Model version</Label><Body>{info.modelVersion}</Body>
            <Label>Vectorizer</Label><Body>{info.vectorizer}</Body>
            <Label>Confidence threshold</Label><Body>{info.threshold}</Body>
            <Label>Dataset fingerprint (SHA-256)</Label><Body selectable>{info.datasetFingerprint}</Body>
            <Label>Build commit</Label><Body>{info.buildCommit}</Body>
          </>
        ) : null}
        <Button title="Check again" variant="secondary" onPress={load} disabled={!online} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
});

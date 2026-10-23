import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Banner, Body, Button, Card, H, Label, Loading, OnlineBadge, SourceBadge } from '../components/ui';
import { COLORS, GROUP_CODE, MAX_QUESTION_LENGTH } from '../config';
import { useApp } from '../context/AppContext';
import { runAsk } from '../lib/askFlow';
import { cache } from '../lib/storage';
import { validateQuestion } from '../lib/text';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Ask'>;

const EXAMPLES = ['Who built offline mode?', 'Tell me about Member One', 'Who is the AI and data engineer?'];

export default function AskScreen({ navigation }: Props) {
  const { online, bundled, lastResult, setLastResult } = useApp();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    const problem = validateQuestion(question, MAX_QUESTION_LENGTH);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setNotice(null);
    setLoading(true);
    const out = await runAsk(question, online, bundled, GROUP_CODE);
    setLoading(false);
    if (out.result) {
      if (out.result.matched) {
        setLastResult(out.result);
        cache.setLastResult(out.result);
      }
      setNotice(out.notice);
      navigation.navigate('Result', { result: out.result, notice: out.notice });
    } else {
      setError(out.error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <H>Ask the team</H>
          <OnlineBadge online={online} />
          <Label>Your question</Label>
          <TextInput
            value={question}
            onChangeText={(t) => { setQuestion(t); if (error) setError(null); }}
            placeholder='e.g. "Who built offline mode?"'
            placeholderTextColor="#6B6B6B"
            accessibilityLabel="Question about a team member"
            style={styles.input}
            multiline
            maxLength={MAX_QUESTION_LENGTH + 50}
            editable={!loading}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={submit}
          />
          <Text style={[styles.counter, question.length > MAX_QUESTION_LENGTH && { color: COLORS.danger }]}>
            {question.length}/{MAX_QUESTION_LENGTH}
          </Text>
          <Button title="Ask" onPress={submit} loading={loading} hint="Sends your question to the AI service" />
          <Label>Try an example</Label>
          {EXAMPLES.map((e) => (
            <Pressable key={e} accessibilityRole="button" accessibilityLabel={`Use example: ${e}`} onPress={() => setQuestion(e)} style={styles.example}>
              <Text style={styles.exampleText}>{e}</Text>
            </Pressable>
          ))}
        </Card>

        {loading ? <Loading text={online ? 'Asking the AI service…' : 'Searching on this phone…'} /> : null}
        {error ? <Banner kind="error" text={error} actionLabel={question.trim() ? 'Retry' : undefined} onAction={submit} /> : null}
        {notice ? <Banner kind="warn" text={notice} /> : null}
        {!online ? <Banner kind="info" text="You are offline. Only exact names, nicknames and roles can be matched." /> : null}

        {lastResult ? (
          <Card>
            <Label>Last useful result</Label>
            <SourceBadge source={lastResult.source} />
            <Body style={{ marginTop: 6, fontWeight: '700' }}>{lastResult.memberName}</Body>
            <Body>“{lastResult.query}”</Body>
            <View style={{ marginTop: 8 }}>
              <Button title="Open last result" variant="secondary" onPress={() => navigation.navigate('Result', { result: lastResult })} />
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  input: { minHeight: 80, borderWidth: 2, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 16, color: COLORS.text, backgroundColor: '#fff', textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: COLORS.muted, marginVertical: 4 },
  example: { minHeight: 44, justifyContent: 'center' },
  exampleText: { fontSize: 15, color: COLORS.info, textDecorationLine: 'underline' },
});

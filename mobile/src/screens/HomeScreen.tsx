import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Body, Button, Card, H, Label, OnlineBadge } from '../components/ui';
import { APP_NAME, APP_VERSION, COLORS, GROUP_CODE } from '../config';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { online } = useApp();
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Card>
        <H>{APP_NAME}</H>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <OnlineBadge online={online} />
        </View>
        <Body>
          Meet the team behind AgriSoko. Ask a question about any member and get an evidence-based professional profile.
        </Body>
        <Label>Who it is for</Label>
        <Body>Potato cooperatives, employers and innovation partners in Musanze.</Body>
        <Label>Team code</Label>
        <Body>{GROUP_CODE}</Body>
        <Label>Release version</Label>
        <Body>v{APP_VERSION}</Body>
        <Label>Connection</Label>
        <Body>
          {online
            ? 'Online: questions are answered by the AI service.'
            : 'Offline: exact name, nickname and role lookup still works on this phone.'}
        </Body>
      </Card>
      <View style={{ gap: 12 }}>
        <Button title="Ask the team" hint="Type a question about a team member" onPress={() => navigation.navigate('Ask')} />
        <Button title="Member directory" variant="secondary" onPress={() => navigation.navigate('Directory')} />
        <Button title="About and evidence" variant="secondary" onPress={() => navigation.navigate('About')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
});

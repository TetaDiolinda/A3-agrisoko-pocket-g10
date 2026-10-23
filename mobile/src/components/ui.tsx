import React from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View, ViewStyle, Alert } from 'react-native';
import { COLORS } from '../config';
import { Source } from '../types';
import { isPlaceholderUrl } from '../lib/text';

export function Button({
  title, onPress, variant = 'primary', disabled, loading, hint,
}: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary'; disabled?: boolean; loading?: boolean; hint?: string;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        primary ? styles.btnPrimary : styles.btnSecondary,
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? <ActivityIndicator color={primary ? '#fff' : COLORS.primary} /> : null}
      <Text style={[styles.btnText, { color: primary ? '#fff' : COLORS.primary }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H({ children }: { children: React.ReactNode }) {
  return <Text accessibilityRole="header" style={styles.h}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Body({ children, style, selectable }: { children: React.ReactNode; style?: object; selectable?: boolean }) {
  return <Text selectable={selectable} style={[styles.body, style]}>{children}</Text>;
}

const SOURCE_STYLE: Record<Source, { text: string; bg: string; fg: string }> = {
  live: { text: 'LIVE · AI server', bg: '#DDF3DF', fg: '#0D3F12' },
  cached: { text: 'CACHED · saved on this phone', bg: '#FFF1CC', fg: '#6B4500' },
  offline: { text: 'OFFLINE MATCH · local on phone', bg: '#DCE9F9', fg: '#0B3C75' },
};

export function SourceBadge({ source }: { source: Source }) {
  const s = SOURCE_STYLE[source];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]} accessible accessibilityLabel={`Source: ${s.text}`}>
      <Text style={[styles.badgeText, { color: s.fg }]}>{s.text}</Text>
    </View>
  );
}

export function OnlineBadge({ online }: { online: boolean }) {
  return (
    <View
      style={[styles.badge, { backgroundColor: online ? '#DDF3DF' : '#F9D9D6' }]}
      accessible
      accessibilityLabel={online ? 'You are online' : 'You are offline'}
    >
      <Text style={[styles.badgeText, { color: online ? '#0D3F12' : '#7A1913' }]}>{online ? 'ONLINE' : 'OFFLINE'}</Text>
    </View>
  );
}

export function Banner({ kind, text, actionLabel, onAction }: {
  kind: 'error' | 'warn' | 'info'; text: string; actionLabel?: string; onAction?: () => void;
}) {
  const color = kind === 'error' ? COLORS.danger : kind === 'warn' ? COLORS.warn : COLORS.info;
  const bg = kind === 'error' ? '#FBE9E7' : kind === 'warn' ? '#FFF4D6' : '#E3EFFB';
  return (
    <View style={[styles.banner, { borderColor: color, backgroundColor: bg }]} accessibilityRole="alert">
      <Text style={[styles.body, { color, fontWeight: '600' }]}>{text}</Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: 8 }}>
          <Button title={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function LinkRow({ label, url }: { label: string; url: string }) {
  const placeholder = isPlaceholderUrl(url);
  const open = async () => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) throw new Error('unsupported');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Link unavailable', 'This link could not be opened on this phone. Check your connection or try again later.');
    }
  };
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={placeholder ? `${label}, link not set yet` : `Open ${label}`}
      disabled={placeholder}
      onPress={open}
      style={styles.linkRow}
    >
      <Text style={[styles.linkText, placeholder && { color: COLORS.muted, textDecorationLine: 'none' }]}>
        {label}{placeholder ? ' (link not set yet)' : ''}
      </Text>
    </Pressable>
  );
}

export function Loading({ text }: { text: string }) {
  return (
    <View style={styles.loading} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={[styles.body, { marginTop: 8 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.primary },
  btnText: { fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  h: { fontSize: 20, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', marginTop: 10, marginBottom: 2 },
  body: { fontSize: 16, color: COLORS.text, lineHeight: 23 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  banner: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 12 },
  linkRow: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontSize: 16, color: COLORS.info, textDecorationLine: 'underline', fontWeight: '600' },
  loading: { padding: 24, alignItems: 'center' },
});

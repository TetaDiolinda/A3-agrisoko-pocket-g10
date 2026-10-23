import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { api } from '../lib/api';
import { cache } from '../lib/storage';
import bundledJson from '../data/members.json';
import { AskResult, DirectoryItem, Member, Source } from '../types';

const bundled = bundledJson as unknown as Member[];

function toItem(m: Member): DirectoryItem {
  return { id: m.id, fullName: m.fullName, aliases: m.aliases, githubUsername: m.githubUsername, role: m.role, feature: m.feature };
}

interface Ctx {
  online: boolean;
  bundled: Member[];
  directory: DirectoryItem[];
  directorySource: Source;
  apiStatus: 'unknown' | 'up' | 'down';
  lastResult: AskResult | null;
  setLastResult: (r: AskResult) => void;
  refreshDirectory: () => Promise<void>;
  checkApi: () => Promise<void>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [directory, setDirectory] = useState<DirectoryItem[]>(bundled.map(toItem));
  const [directorySource, setDirectorySource] = useState<Source>('offline');
  const [apiStatus, setApiStatus] = useState<'unknown' | 'up' | 'down'>('unknown');
  const [lastResult, setLast] = useState<AskResult | null>(null);

  const checkApi = useCallback(async () => {
    try {
      await api.health();
      setApiStatus('up');
    } catch {
      setApiStatus('down');
    }
  }, []);

  const refreshDirectory = useCallback(async () => {
    try {
      const live = await api.members();
      setDirectory(live);
      setDirectorySource('live');
      setApiStatus('up');
      await cache.setDirectory(live);
    } catch {
      const saved = await cache.getDirectory();
      if (saved && saved.length) {
        setDirectory(saved);
        setDirectorySource('cached');
      } else {
        setDirectory(bundled.map(toItem));
        setDirectorySource('offline');
      }
      setApiStatus('down');
    }
  }, []);

  useEffect(() => {
    cache.getLastResult().then((r) => r && setLast({ ...r, source: 'cached' }));
    const unsub = NetInfo.addEventListener((s) => setOnline(!!s.isConnected && s.isInternetReachable !== false));
    return unsub;
  }, []);

  useEffect(() => {
    if (online) {
      refreshDirectory();
    } else {
      setApiStatus('down');
      cache.getDirectory().then((saved) => {
        if (saved?.length) { setDirectory(saved); setDirectorySource('cached'); }
        else { setDirectory(bundled.map(toItem)); setDirectorySource('offline'); }
      });
    }
  }, [online, refreshDirectory]);

  const value = useMemo<Ctx>(
    () => ({ online, bundled, directory, directorySource, apiStatus, lastResult, setLastResult: setLast, refreshDirectory, checkApi }),
    [online, directory, directorySource, apiStatus, lastResult, refreshDirectory, checkApi],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}

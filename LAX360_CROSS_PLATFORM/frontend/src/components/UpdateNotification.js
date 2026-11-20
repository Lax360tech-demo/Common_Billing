import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const UpdateNotification = () => {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [updateState, setUpdateState] = useState(null); // null | 'available' | 'downloading' | 'downloaded' | 'error'
  const [updateInfo, setUpdateInfo] = useState({});
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only active in Electron desktop environment with exposed updater bridge
    if (typeof window === 'undefined' || !window.electronUpdater) {
      return;
    }

    const unsubscribe = window.electronUpdater.onUpdateEvent((event) => {
      console.log('[UpdateNotification] Received updater event:', event);

      if (event.status === 'available') {
        setUpdateState('available');
        setUpdateInfo({
          version: event.version,
          releaseNotes: event.releaseNotes
        });
        setDismissed(false);
      } else if (event.status === 'downloading') {
        setUpdateState('downloading');
        setDownloadProgress(event.percent || 0);
        if (event.bytesPerSecond) {
          setDownloadSpeed(Math.round(event.bytesPerSecond / 1024));
        }
      } else if (event.status === 'downloaded') {
        setUpdateState('downloaded');
        setUpdateInfo((prev) => ({ ...prev, version: event.version }));
        setDismissed(false);
      } else if (event.status === 'error') {
        // Only show error if an active update was being downloaded
        if (updateState === 'downloading') {
          setUpdateState('error');
          setUpdateInfo({ errorMsg: event.message });
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [updateState]);

  if (!updateState || dismissed) {
    return null;
  }

  const handleStartDownload = () => {
    setUpdateState('downloading');
    setDownloadProgress(0);
    if (window.electronUpdater?.downloadUpdate) {
      window.electronUpdater.downloadUpdate().catch((err) => {
        setUpdateState('error');
        setUpdateInfo({ errorMsg: err.message });
      });
    }
  };

  const handleRestartAndInstall = () => {
    if (window.electronUpdater?.quitAndInstall) {
      window.electronUpdater.quitAndInstall();
    }
  };

  const handleRemindLater = () => {
    setDismissed(true);
  };

  return (
    <View style={[styles.floatingBanner, { backgroundColor: colors.bgCard || '#FFFFFF', borderColor: colors.border || '#E2E8F0' }]}>
      {/* Header Accent Bar */}
      <View style={[styles.topBar, { backgroundColor: updateState === 'downloaded' ? '#10B981' : colors.primary || '#4F46E5' }]} />

      <View style={styles.content}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>
              {updateState === 'downloaded' ? '🎉' : updateState === 'downloading' ? '⏳' : '🚀'}
            </Text>
            <View>
              <Text style={[styles.title, { color: colors.textMain || '#0F172A' }]}>
                {updateState === 'downloaded'
                  ? 'Update Ready to Install'
                  : updateState === 'downloading'
                  ? 'Downloading Update...'
                  : 'New Update Available'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted || '#64748B' }]}>
                LAX360 Billing {updateInfo.version ? `v${updateInfo.version}` : 'latest'}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleRemindLater} style={styles.closeBtn}>
            <Text style={{ color: colors.textMuted || '#94A3B8', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* State: Available */}
        {updateState === 'available' && (
          <View style={styles.section}>
            <Text style={[styles.description, { color: colors.textMain || '#334155' }]}>
              A new version of LAX360 Billing is available. You can download and install it without losing any data.
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleStartDownload}
                style={[styles.primaryBtn, { backgroundColor: colors.primary || '#4F46E5' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>📥 Download Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRemindLater}
                style={[styles.secondaryBtn, { borderColor: colors.border || '#CBD5E1' }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textMuted || '#64748B' }]}>
                  Remind Me Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* State: Downloading */}
        {updateState === 'downloading' && (
          <View style={styles.section}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textMain || '#334155' }]}>
                Downloading update: {downloadProgress}%
              </Text>
              {downloadSpeed > 0 && (
                <Text style={[styles.speedLabel, { color: colors.textMuted || '#64748B' }]}>
                  {downloadSpeed} KB/s
                </Text>
              )}
            </View>

            {/* Progress Bar Container */}
            <View style={[styles.progressBarBg, { backgroundColor: colors.bgMain || '#F1F5F9' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(Math.max(downloadProgress, 3), 100)}%`,
                    backgroundColor: colors.primary || '#4F46E5'
                  }
                ]}
              />
            </View>

            <Text style={[styles.minorNote, { color: colors.textMuted || '#94A3B8' }]}>
              You can continue billing while the update downloads in the background.
            </Text>
          </View>
        )}

        {/* State: Ready to Install */}
        {updateState === 'downloaded' && (
          <View style={styles.section}>
            <Text style={[styles.description, { color: colors.textMain || '#334155' }]}>
              The update has been downloaded. Restart the app now to apply the latest version.
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleRestartAndInstall}
                style={[styles.primaryBtn, { backgroundColor: '#10B981' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>🔄 Restart & Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRemindLater}
                style={[styles.secondaryBtn, { borderColor: colors.border || '#CBD5E1' }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textMuted || '#64748B' }]}>
                  Remind Me Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* State: Error */}
        {updateState === 'error' && (
          <View style={styles.section}>
            <Text style={{ fontSize: 12, color: '#EF4444', marginBottom: 10 }}>
              {updateInfo.errorMsg || 'Unable to complete update. Will retry on next launch.'}
            </Text>
            <TouchableOpacity
              onPress={handleRemindLater}
              style={[styles.secondaryBtn, { alignSelf: 'flex-start', borderColor: colors.border || '#CBD5E1' }]}
            >
              <Text style={{ fontSize: 12, color: colors.textMuted || '#64748B' }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingBanner: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 380,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20
  },
  topBar: {
    height: 4,
    width: '100%'
  },
  content: {
    padding: 16
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  title: {
    fontSize: 14,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  closeBtn: {
    padding: 4
  },
  section: {
    marginTop: 4
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600'
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700'
  },
  speedLabel: {
    fontSize: 11
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 6
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  minorNote: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2
  }
});

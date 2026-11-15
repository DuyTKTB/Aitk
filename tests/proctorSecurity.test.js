import { describe, it, expect } from 'vitest';
import { defaultProctor } from '../src/lib/classroom.js';
import { VIOLATION_META, violationMeta } from '../src/lib/sessionIcons.jsx';
import { serverNow } from '../src/lib/serverClock.js';

describe('Proctor configuration & metadata integrity', () => {
  it('defaultProctor enables core lockdown hardening flags safely', () => {
    const cfg = defaultProctor();
    expect(cfg.fullscreenLock).toBe(true);
    expect(cfg.blockCopyPaste).toBe(true);
    expect(cfg.strictMode).toBe(true);
    expect(cfg.blurOnFocusLost).toBe(true);
    expect(cfg.singleDeviceLock).toBe(true);
    expect(cfg.blockMultiScreen).toBe(true);
    expect(cfg.watermark).toBe(true);
    expect(cfg.motionGuard).toBe(true);
    expect(cfg.softToHard).toBe(5);
    expect(cfg.audioMonitor).toBe(false); // opt-in / Lockdown preset
    expect(cfg.lockdown).toBe(false);
  });

  it('VIOLATION_META provides localized metadata and valid severity for every emitted event type', () => {
    const expectedTypes = [
      'tab_hidden', 'window_blur', 'long_blur', 'exit_fullscreen',
      'window_shrunk', 'multi_screen', 'multi_device',
      'no_face', 'multi_face', 'camera_lost', 'camera_covered', 'camera_frozen',
      'look_away', 'hand_raise', 'phone_like', 'phone_detected',
      'voice_detected', 'devtools_open', 'devtools_shortcut',
      'screenshot_attempt', 'print_attempt', 'paste_spike',
      'copy', 'paste', 'cut', 'copy_attempt', 'contextmenu', 'context_menu',
      'device_lifted', 'orientation_change', 'pinch_zoom', 'multi_touch',
      'back_pressed', 'page_hide', 'app_switch', 'soft_escalation', 'force_submit',
    ];

    for (const key of expectedTypes) {
      expect(VIOLATION_META[key]).toBeDefined();
      const meta = violationMeta(key);
      expect(typeof meta.Icon).toBe('function');
      expect(typeof meta.label).toBe('string');
      expect(meta.label.length).toBeGreaterThan(2);
      expect(meta.label).not.toBe(key);
      expect(['hard', 'soft']).toContain(meta.severity);
    }

    // Critical anti-cheat events must stay 'hard'
    for (const hardKey of [
      'multi_device', 'camera_covered', 'camera_frozen',
      'camera_lost', 'phone_detected', 'devtools_open', 'force_submit',
    ]) {
      expect(VIOLATION_META[hardKey].severity).toBe('hard');
    }
  });

  it('serverNow returns valid current timestamp ms', () => {
    const t = serverNow();
    expect(typeof t).toBe('number');
    expect(t).toBeGreaterThan(1700000000000);
  });
});

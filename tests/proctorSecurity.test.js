import { describe, it, expect } from 'vitest';
import { defaultProctor } from '../src/lib/classroom.js';
import { VIOLATION_META, violationMeta } from '../src/lib/sessionIcons.jsx';
import { serverNow } from '../src/lib/serverClock.js';
import { isDevtoolsViewportSuspect } from '../src/hooks/useExamGuard.js';
import {
  isFrameCovered,
  updatePoseCalibration,
  analyzeGazeAndHead,
  classifyHandNearFace,
} from '../src/hooks/useProctorCamera.js';

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

function makeFaceLandmarks({ noseX = 0.5, noseY = 0.52, chinY = 0.62, eyeY = 0.42 } = {}) {
  const lm = Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  lm[1] = { x: noseX, y: noseY, z: 0 };       // mũi
  lm[234] = { x: 0.35, y: 0.5, z: 0 };        // má trái
  lm[454] = { x: 0.65, y: 0.5, z: 0 };        // má phải
  lm[152] = { x: 0.5, y: chinY, z: 0 };       // cằm
  lm[159] = { x: 0.45, y: eyeY, z: 0 };       // mắt trái
  return lm;
}

function makeHandLandmarks({ curled = false, cx = 0.5, cy = 0.52 } = {}) {
  const h = Array.from({ length: 21 }, (_, idx) => ({
    x: cx + ((idx % 5) - 2) * 0.015,
    y: cy + Math.floor(idx / 5) * 0.015,
    z: 0,
  }));
  h[0] = { x: cx, y: cy + 0.12, z: 0 }; // cổ tay
  h[9] = { x: cx, y: cy + 0.02, z: 0 }; // gốc ngón giữa -> palmSize = 0.10
  h[4] = { x: cx - 0.06, y: cy + 0.03, z: 0 };
  h[17] = { x: cx + 0.06, y: cy + 0.03, z: 0 }; // palmWidth = 0.12
  const tipOffset = curled ? 0.02 : -0.09; // gập ngón ~0.10..0.11 vs duỗi ~0.21
  h[8] = { x: cx - 0.03, y: cy + tipOffset, z: 0 };
  h[12] = { x: cx, y: cy + tipOffset, z: 0 };
  h[16] = { x: cx + 0.03, y: cy + tipOffset, z: 0 };
  return h;
}

describe('Proctor anti-cheat precision & false-positive guards', () => {
  it('isDevtoolsViewportSuspect ignores browser zoom and toolbars while catching docked DevTools', () => {
    expect(isDevtoolsViewportSuspect({ outerWidth: 1920, innerWidth: 1904, outerHeight: 1040, innerHeight: 880 })).toBe(false);
    // Zoom 125% (1920x1040 với thanh công cụ 90px) -> tỷ lệ co giãn đều cả 2 trục
    expect(isDevtoolsViewportSuspect({ outerWidth: 1920, innerWidth: 1536, outerHeight: 1040, innerHeight: 760 })).toBe(false);
    // Zoom 150% fullscreen
    expect(isDevtoolsViewportSuspect({ outerWidth: 1920, innerWidth: 1280, outerHeight: 1080, innerHeight: 720 })).toBe(false);
    // Dock DevTools bên phải
    expect(isDevtoolsViewportSuspect({ outerWidth: 1920, innerWidth: 1420, outerHeight: 1040, innerHeight: 950 })).toBe(true);
    // Dock DevTools dưới đáy
    expect(isDevtoolsViewportSuspect({ outerWidth: 1920, innerWidth: 1904, outerHeight: 1040, innerHeight: 620 })).toBe(true);
  });

  it('isFrameCovered avoids false positives in dim rooms when face/edges exist and catches covered lens', () => {
    // Phòng tối nhưng AI vẫn nhận diện được mặt
    expect(isFrameCovered({ meanLuma: 9, lumaStd: 5, meanEdge: 2.5 }, 1)).toBe(false);
    // Khung hình trống nhưng nét cảnh thật rõ
    expect(isFrameCovered({ meanLuma: 85, lumaStd: 30, meanEdge: 7.4 }, 0)).toBe(false);
    // Che đen ống kính
    expect(isFrameCovered({ meanLuma: 4, lumaStd: 1.5, meanEdge: 0.4 }, 0)).toBe(true);
    // Ngón tay áp sát ống kính (sáng đỏ nhòe đều, không có cạnh)
    expect(isFrameCovered({ meanLuma: 48, lumaStd: 5.2, meanEdge: 1.1 }, 0)).toBe(true);
  });

  it('updatePoseCalibration & analyzeGazeAndHead adapt to webcam tilt and catch eye glances', () => {
    const calib = { samples: [], baseYaw: 0, basePitch: 0.28, ready: false };
    // Học sinh ngồi dưới góc camera hơi cao khiến pitch nghỉ tự nhiên là ~0.37 (chin-nose lớn hơn 0.28)
    const restingTilt = makeFaceLandmarks({ noseX: 0.5, noseY: 0.50, chinY: 0.62, eyeY: 0.30 }); // pitch = 0.12/0.32 = 0.375
    for (let i = 0; i < 5; i++) updatePoseCalibration(calib, restingTilt);
    expect(calib.ready).toBe(true);
    expect(analyzeGazeAndHead(restingTilt, null, calib)).toBe(false);

    // Quay hẳn đầu sang phải -> bắt look_away
    const turnedHead = makeFaceLandmarks({ noseX: 0.60, noseY: 0.50, chinY: 0.62, eyeY: 0.30 });
    expect(analyzeGazeAndHead(turnedHead, null, calib)).toBe(true);

    // Đầu vẫn thẳng nhưng mắt liếc xuống đọc điện thoại
    const glanceDown = [
      { categoryName: 'eyeLookDownLeft', score: 0.72 },
      { categoryName: 'eyeLookDownRight', score: 0.68 },
    ];
    expect(analyzeGazeAndHead(restingTilt, glanceDown, calib)).toBe(true);
  });

  it('classifyHandNearFace separates curled phone grip from open hand raise without double-counting', () => {
    const faceBox = { x0: 0.4, y0: 0.35, x1: 0.6, y1: 0.65, w: 0.2, h: 0.3 };

    const curled = makeHandLandmarks({ curled: true, cx: 0.5, cy: 0.55 });
    const resPhone = classifyHandNearFace([curled], faceBox);
    expect(resPhone.phoneLike).toBe(true);
    expect(resPhone.handRaise).toBe(false);

    const openHand = makeHandLandmarks({ curled: false, cx: 0.5, cy: 0.5 });
    const resRaise = classifyHandNearFace([openHand], faceBox);
    expect(resRaise.handRaise).toBe(true);
    expect(resRaise.phoneLike).toBe(false);
  });
});

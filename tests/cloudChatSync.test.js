import { describe, it, expect } from 'vitest';
import {
  chatDocId,
  sanitizeForFirestore,
  prepareMessagesForCloud,
  mergeChatsById,
} from '../src/lib/aiChatApi.js';

describe('ELEC AI Cross-Device Cloud Sync (Firestore ai_chats)', () => {
  it('1. chatDocId tách biệt dữ liệu từng tài khoản UID ngay cả khi trùng chat ID', () => {
    expect(chatDocId('userA', 'chat-1')).not.toBe(chatDocId('userB', 'chat-1'));
    expect(chatDocId('userA', 'teacher_studio')).toBe('userA__teacher_studio');
  });

  it('2. sanitizeForFirestore loại bỏ undefined, NaN và function đệ quy để không lỗi Firestore', () => {
    const dirty = {
      title: 'Bài 1',
      bad: undefined,
      score: NaN,
      fn: () => {},
      nested: [{ a: 1, b: undefined, c: Infinity }],
    };
    const clean = sanitizeForFirestore(dirty);
    expect('bad' in clean).toBe(false);
    expect('fn' in clean).toBe(false);
    expect(clean.score).toBe(0);
    expect(clean.nested[0].c).toBe(0);
    expect('b' in clean.nested[0]).toBe(false);
  });

  it('3. prepareMessagesForCloud loại bỏ inlineData base64 và rút gọn tài liệu nặng dưới 1MB', () => {
    const msgs = [
      {
        role: 'user',
        parts: [
          { text: 'Phân tích giúp mình' },
          { inlineData: { mimeType: 'image/png', data: 'B'.repeat(200000) } },
        ],
        preview: {
          images: [{ dataUrl: 'data:image/png;base64,AAA', width: 800, height: 600 }],
          docs: [{ id: 'd1', name: 'de-thi.docx', kind: 'docx', text: 'X'.repeat(30000) }],
        },
      },
    ];
    const cloud = prepareMessagesForCloud(msgs);
    expect(cloud[0].parts[1]).toEqual({ text: '[ảnh đã gửi]' });
    expect(cloud[0].preview.images[0].dataUrl).toBeUndefined();
    expect(cloud[0].preview.docs[0].text.length).toBeLessThanOrEqual(1500);
  });

  it('4. mergeChatsById hợp nhất dữ liệu server và local mà không làm mất cuộc trò chuyện', () => {
    const server = [
      { id: 'c1', title: 'Đoạn cloud mới', messages: [{ role: 'user', text: 'a' }, { role: 'model', text: 'b' }], updated_at: 2000 },
      { id: 'c2', title: 'Chỉ có trên máy khác', messages: [{ role: 'user', text: 'hello' }], updated_at: 1500 },
    ];
    const local = [
      { id: 'c1', title: 'Đoạn cũ', messages: [{ role: 'user', text: 'a' }], updatedAt: 1000 },
      { id: 'c3', title: 'Mới tạo offline', messages: [{ role: 'user', text: 'offline' }], updatedAt: 3000 },
    ];
    const merged = mergeChatsById(server, local);
    expect(merged.map((c) => c.id)).toEqual(['c3', 'c1', 'c2']);
    expect(merged.find((c) => c.id === 'c1')?.messages).toHaveLength(2);
  });
});

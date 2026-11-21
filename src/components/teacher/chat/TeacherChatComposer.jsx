import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IcoPlus, IcoImage, IcoMic, IcoSend, IcoStop, IcoX, IcoSparkles } from './tfcIcons.jsx';
import {
  AI_MODES,
  filterSlashCommands,
  getSubjectExamplePlaceholder,
} from './tfcHelpers.js';

const IMAGE_QUICK_PROMPTS = [
  { label: 'Giải chi tiết', prompt: 'Hãy đọc ảnh đề bài này, giải chi tiết từng bước và nêu rõ đáp án cuối cùng.' },
  { label: 'Soi bẫy & Bloom', prompt: 'Hãy thẩm định câu hỏi trong ảnh theo chuẩn GDPT 2025: xác định mức Bloom, kiểm tra tính chuẩn xác và chỉ ra bẫy học sinh dễ sai.' },
  { label: 'Chuyển 3 phần', prompt: 'Hãy chuyển nội dung đề trong ảnh thành câu hỏi chuẩn GDPT 2025 (kèm đáp án và lời giải ngắn gọn).' },
];

const TeacherChatComposer = React.memo(function TeacherChatComposer({
  input,
  setInput,
  inputRef,
  fileInputRef,
  imageInputRef,
  aiMode,
  onChangeAiMode,
  pendingImage,
  onImageSelected,
  onClearPendingImage,
  isTyping,
  isRecording,
  inferredSubject,
  onSubmit,
  onStopGeneration,
  onToggleMic,
  onFileSelected,
  onRunSlashCommand,
}) {
  const [activeCmdIndex, setActiveCmdIndex] = useState(0);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const modeWrapRef = useRef(null);

  const slashMatches = useMemo(() => filterSlashCommands(input), [input]);
  const slashOpen = slashMatches.length > 0;
  const placeholder = useMemo(
    () => getSubjectExamplePlaceholder(inferredSubject),
    [inferredSubject]
  );
  const activeModeObj = useMemo(
    () => AI_MODES.find((m) => m.id === aiMode) || AI_MODES[0],
    [aiMode]
  );

  useEffect(() => {
    setActiveCmdIndex(0);
  }, [slashMatches.length, input]);

  // Close mode popover on outside click
  useEffect(() => {
    if (!modeMenuOpen) return undefined;
    const onDocClick = (e) => {
      if (modeWrapRef.current && !modeWrapRef.current.contains(e.target)) {
        setModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [modeMenuOpen]);

  // Auto-resize textarea cleanly (1..4 lines, starts at crisp 1 line)
  useEffect(() => {
    const el = inputRef?.current;
    if (!el) return;
    el.style.height = 'auto';
    if (!input) {
      el.style.height = '22px';
      return;
    }
    const nextHeight = Math.min(el.scrollHeight, 96);
    el.style.height = `${Math.max(22, nextHeight)}px`;
  }, [input, inputRef]);

  const handleSelectCommand = (item) => {
    setInput('');
    onRunSlashCommand?.(item);
    inputRef?.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (slashOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveCmdIndex((i) => (i + 1) % slashMatches.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveCmdIndex((i) => (i - 1 + slashMatches.length) % slashMatches.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        const chosen = slashMatches[activeCmdIndex] || slashMatches[0];
        if (chosen) handleSelectCommand(chosen);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setInput('');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && (input.trim() || pendingImage)) {
        onSubmit?.();
      }
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file' && it.type.startsWith('image/')) {
        const file = it.getAsFile();
        if (file) {
          e.preventDefault();
          onImageSelected?.(file);
          return;
        }
      }
    }
  };

  const canSend = Boolean(input.trim() || pendingImage);

  return (
    <div className="tfc-footer">
      {/* Popover lệnh nhanh Slash Commands (/) */}
      {slashOpen && (
        <div className="tfc-slash-menu" role="listbox" aria-label="Lệnh nhanh ELEC AI">
          <div className="tfc-slash-menu-head">
            <span>Lệnh nhanh</span>
            <span className="tfc-slash-hint">↑↓ chọn · Enter thực thi</span>
          </div>
          {slashMatches.map((item, idx) => (
            <button
              key={item.cmd}
              type="button"
              role="option"
              aria-selected={idx === activeCmdIndex}
              className={`tfc-slash-item ${idx === activeCmdIndex ? 'active' : ''}`}
              onMouseEnter={() => setActiveCmdIndex(idx)}
              onClick={() => handleSelectCommand(item)}
            >
              <code className="tfc-slash-cmd">{item.cmd}</code>
              <span className="tfc-slash-meta">
                <strong>{item.label}</strong>
                <small>{item.desc}</small>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Xem trước ảnh đề bài đang đính kèm (Vision / Ctrl+V) */}
      {pendingImage && (
        <div className="tfc-img-stage">
          <div className="tfc-img-stage-top">
            <img
              src={pendingImage.dataUrl}
              alt={pendingImage.name}
              className="tfc-img-stage-thumb"
            />
            <div className="tfc-img-stage-info">
              <strong title={pendingImage.name}>{pendingImage.name}</strong>
              <span>{pendingImage.sizeLabel} · Ảnh đề bài sẵn sàng</span>
            </div>
            <button
              type="button"
              className="tfc-img-stage-remove"
              onClick={onClearPendingImage}
              title="Bỏ ảnh đính kèm"
              aria-label="Bỏ ảnh đính kèm"
            >
              <IcoX size={13} />
            </button>
          </div>
          <div className="tfc-img-presets">
            {IMAGE_QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="tfc-img-preset-btn"
                onClick={() => onSubmit?.(p.prompt)}
                disabled={isTyping}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Khung nhập liệu chuẩn ChatGPT/Claude: 1 hộp duy nhất, 2 hàng gọn gàng */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isTyping) {
            onStopGeneration?.();
          } else if (canSend) {
            onSubmit?.();
          }
        }}
        className="tfc-composer-box"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.txt"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onFileSelected?.(file);
          }}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onImageSelected?.(file);
          }}
        />

        <textarea
          ref={inputRef}
          rows={1}
          className="tfc-composer-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          aria-label="Nhập yêu cầu cho ELEC AI Agent"
        />

        <div className="tfc-composer-toolbar">
          <div className="tfc-composer-tools-left">
            <button
              type="button"
              className="tfc-tool-icon-btn"
              onClick={() => fileInputRef?.current?.click()}
              title="Nạp file Word (.docx) hoặc PDF đề thi"
              aria-label="Nạp file Word hoặc PDF"
            >
              <IcoPlus size={15} />
            </button>

            <button
              type="button"
              className={`tfc-tool-icon-btn ${pendingImage ? 'is-active' : ''}`}
              onClick={() => imageInputRef?.current?.click()}
              title="Gửi ảnh đề bài (hoặc dán Ctrl+V)"
              aria-label="Gửi ảnh đề bài"
            >
              <IcoImage size={15} />
            </button>

            {/* Nút chọn chế độ AI dạng popover gọn (không chiếm thêm 1 hàng) */}
            <div className="tfc-mode-dropdown-wrap" ref={modeWrapRef}>
              <button
                type="button"
                className={`tfc-mode-trigger ${aiMode !== 'balanced' ? 'is-custom' : ''}`}
                onClick={() => setModeMenuOpen((v) => !v)}
                title={activeModeObj.title}
                aria-expanded={modeMenuOpen}
                aria-haspopup="menu"
              >
                <IcoSparkles size={11} />
                <span>{activeModeObj.label}</span>
                <span className="tfc-mode-caret" aria-hidden="true">▾</span>
              </button>

              {modeMenuOpen && (
                <div className="tfc-mode-popover" role="menu">
                  {AI_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={aiMode === m.id}
                      className={`tfc-mode-option ${aiMode === m.id ? 'active' : ''}`}
                      onClick={() => {
                        onChangeAiMode?.(m.id);
                        setModeMenuOpen(false);
                      }}
                    >
                      <strong>{m.label}</strong>
                      <small>{m.title}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="tfc-composer-tools-right">
            <button
              type="button"
              className={`tfc-tool-icon-btn ${isRecording ? 'is-recording' : ''}`}
              onClick={onToggleMic}
              title={isRecording ? 'Đang nghe... bấm để dừng' : 'Nói vào micro'}
              aria-label="Nói vào micro"
            >
              <IcoMic size={15} />
            </button>

            {isTyping ? (
              <button
                type="button"
                className="tfc-composer-send is-stop"
                onClick={onStopGeneration}
                title="Dừng tạo phản hồi"
                aria-label="Dừng tạo phản hồi"
              >
                <IcoStop size={12} />
              </button>
            ) : (
              <button
                type="submit"
                className="tfc-composer-send"
                disabled={!canSend}
                title="Gửi (Enter · Shift+Enter xuống dòng)"
                aria-label="Gửi lệnh"
              >
                <IcoSend size={14} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
});

export default TeacherChatComposer;

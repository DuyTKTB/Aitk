/* ============================================================
   emailTemplates.js — HTML Email Templates Cao Cấp, Màu Sáng, Động (GIF & SVG)
   Chuẩn hiển thị 100% Gmail (Web & App), Apple Mail, Outlook
   ============================================================ */

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export const BRAND_EMAIL = 'elecai@elecai.id.vn';
export const BRAND_SITE = 'https://www.elecai.id.vn';
export const BRAND_LOGO = 'https://www.elecai.id.vn/img/logo.png';
export const ELEC_MASCOT_HELLO = 'https://www.elecai.id.vn/img/elec/elec-hello.png';
export const ELEC_MASCOT_WINK = 'https://www.elecai.id.vn/img/elec/elec-wink.png';
export const ELEC_MASCOT_CELEBRATE = 'https://www.elecai.id.vn/img/elec/elec-celebrate.png';

// Google Official Noto Animated 3D GIFs (Whitelisted & Cached by Gmail)
export const ANIM_LOCK_GIF = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f512/512.gif';
export const ANIM_WAVE_GIF = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif';
export const ANIM_SPARKLES_GIF = 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif';
export const ANIM_CHECK_GIF = 'https://fonts.gstatic.com/s/e/notoemoji/latest/2705/512.gif';
export const ANIM_GRAD_GIF = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f393/512.gif';

export function sanitizeOtpInput(raw = '') {
  return String(raw ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function isValidOtpFormat(code = '') {
  return /^\d{6}$/.test(String(code ?? '').trim());
}

function escapeHtml(s = '') {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatViTime(ts = Date.now()) {
  try {
    return new Date(ts).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return new Date(ts).toISOString();
  }
}

/**
 * Tạo URL avatar sáng đẹp cho học viên
 */
export function buildUserAvatarUrl({ avatarUrl = '', name = '', email = '' }) {
  if (avatarUrl && /^https?:\/\//i.test(avatarUrl)) {
    return avatarUrl;
  }
  const seed = (name || email.split('@')[0] || 'Student').trim();
  // UI-Avatars nền xanh gradient sáng kèm chữ cái đầu
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=2563eb&color=ffffff&size=128&bold=true&rounded=true&font-size=0.45`;
}

/**
 * Shell khung email: Theme sáng (Light Theme) rực rỡ, hiện đại, viền gradient
 */
function renderBrightEmailShell({
  preheader = '',
  badge = 'Bảo mật ELEC AI',
  heroIconGif = ANIM_LOCK_GIF,
  title = '',
  subtitle = '',
  bodyHtml = '',
  appName = 'ELEC AI',
  siteUrl = BRAND_SITE,
  supportEmail = BRAND_EMAIL,
}) {
  const safePreheader = escapeHtml(preheader);
  return `<!DOCTYPE html>
<html lang="vi" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f6ff;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  <!-- Preheader ẩn cho hộp thư Gmail & Apple Mail -->
  <div style="display:none;font-size:1px;color:#f0f6ff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    ${safePreheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(180deg, #e0f2fe 0%, #f0f6ff 40%, #f8fafc 100%);padding:36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Bright Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #bfdbfe;border-radius:22px;box-shadow:0 12px 35px -8px rgba(37, 99, 235, 0.15), 0 4px 12px rgba(0,0,0,0.03);overflow:hidden;">
          
          <!-- Top Gradient Accent Bar -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #8b5cf6 100%);"></td>
          </tr>

          <!-- Top Brand Header Bar -->
          <tr>
            <td style="padding:22px 28px 18px 28px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                            <img src="${BRAND_LOGO}" width="38" height="38" alt="${escapeHtml(appName)}" style="display:block;border-radius:10px;border:1.5px solid #dbeafe;box-shadow:0 2px 6px rgba(37,99,235,0.12);" />
                          </a>
                        </td>
                        <td style="vertical-align:middle;">
                          <div style="font-size:16px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;line-height:1.2;">
                            ${escapeHtml(appName)}
                          </div>
                          <div style="font-size:11px;font-weight:500;color:#64748b;letter-spacing:0.01em;">
                            Hệ sinh thái học &amp; luyện thi KHTN thông minh
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:6px;">
                          <img src="${ANIM_SPARKLES_GIF}" width="18" height="18" alt="Sparkles" style="display:block;" />
                        </td>
                        <td style="vertical-align:middle;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:0.02em;">
                          ${escapeHtml(badge)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Illustration & Title Banner -->
          <tr>
            <td style="padding:28px 28px 14px 28px;text-align:center;background:linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 14px auto;">
                <tr>
                  <td align="center" style="width:72px;height:72px;background:#ffffff;border:2px solid #bfdbfe;border-radius:22px;box-shadow:0 8px 20px -4px rgba(37,99,235,0.15);vertical-align:middle;">
                    <img src="${heroIconGif}" width="48" height="48" alt="Hero Animation" style="display:block;margin:0 auto;" />
                  </td>
                </tr>
              </table>
              <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;line-height:1.3;">
                ${escapeHtml(title)}
              </h1>
              ${subtitle ? `<p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${escapeHtml(subtitle)}</p>` : ''}
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:4px 28px 28px 28px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Bottom Footer -->
          <tr>
            <td style="padding:22px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="font-size:12px;color:#64748b;line-height:1.6;">
                    Thư tự động từ hệ thống bảo mật <strong>${escapeHtml(appName)}</strong>.<br />
                    Mọi thắc mắc vui lòng liên hệ: <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;font-weight:600;">${supportEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px;">
                    <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#ffffff;border:1px solid #cbd5e1;color:#334155;font-size:11px;font-weight:600;padding:6px 14px;border-radius:8px;text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
                      Truy cập website ELEC AI &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:10px;font-size:11px;color:#94a3b8;">
                    &copy; 2026 ELEC Science AI. All rights reserved. &bull; Mã hóa &amp; bảo vệ bởi Resend DKIM.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Hiển thị thẻ User Profile kèm ảnh Avatar nổi bật
 */
function renderUserProfileCard({ name = '', email = '', avatarUrl = '' }) {
  const safeName = name ? escapeHtml(name) : 'Học viên ELEC AI';
  const safeEmail = escapeHtml(email);
  const finalAvatar = buildUserAvatarUrl({ avatarUrl, name, email });

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin:16px 0 20px 0;">
      <tr>
        <td style="width:52px;vertical-align:middle;">
          <img src="${finalAvatar}" width="50" height="50" alt="${safeName}" style="display:block;border-radius:50%;border:2px solid #38bdf8;box-shadow:0 3px 8px rgba(14,165,233,0.2);" />
        </td>
        <td style="padding-left:14px;vertical-align:middle;">
          <div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.3;">
            Xin chào, <span style="color:#2563eb;">${safeName}</span>
          </div>
          <div style="font-size:12px;color:#64748b;line-height:1.4;margin-top:2px;">
            ${safeEmail}
          </div>
        </td>
        <td align="right" style="vertical-align:middle;">
          <span style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px;text-transform:uppercase;letter-spacing:0.04em;">
            Đã xác thực
          </span>
        </td>
      </tr>
    </table>`;
}

/**
 * Hiển thị 6 ô mã OTP rực rỡ, sáng sủa, số to rõ ràng
 */
function renderOtpDigitsBox(code = '123456') {
  const digits = String(code).padStart(6, '0').slice(0, 6).split('');
  const cells = digits
    .map(
      (d) => `
        <td align="center" valign="middle" style="width:46px;height:54px;background:#ffffff;border:2px solid #2563eb;border-radius:12px;font-size:26px;font-weight:800;color:#1e40af;font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;box-shadow:0 4px 10px rgba(37,99,235,0.14);">
          ${d}
        </td>`
    )
    .join('<td style="width:7px;">&nbsp;</td>');

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 16px 0;">
      <tr>
        <td align="center" style="background:linear-gradient(180deg, #f0f7ff 0%, #e0f2fe 100%);border:1.5px solid #bae6fd;border-radius:16px;padding:24px 16px;box-shadow:inset 0 1px 3px rgba(255,255,255,0.8);">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#0284c7;margin-bottom:14px;">
            MÃ XÁC THỰC BẢO MẬT (OTP 6 SỐ)
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>${cells}</tr>
          </table>
          <div style="margin-top:16px;">
            <span style="display:inline-block;background:#ffffff;border:1px dashed #38bdf8;padding:6px 14px;border-radius:8px;font-size:12px;color:#0369a1;font-weight:600;">
              Mã sao chép nhanh: <strong style="color:#0284c7;font-family:monospace;font-size:14px;letter-spacing:1px;">${code}</strong>
            </span>
          </div>
          <div style="font-size:12px;color:#64748b;margin-top:12px;">
            Mã có hiệu lực trong vòng <strong>10 phút</strong> &bull; Tối đa 5 lần nhập sai
          </div>
        </td>
      </tr>
    </table>`;
}

/**
 * Bảng thông tin chi tiết với icon vector rõ ràng
 */
function renderMetaTable({ email, actionLabel, expiresLabel }) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-top:16px;font-size:12px;line-height:1.7;">
      <tr>
        <td style="color:#64748b;padding:3px 0;width:110px;">Hòm thư nhận:</td>
        <td style="color:#0f172a;font-weight:700;padding:3px 0;word-break:break-all;">${escapeHtml(email)}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:3px 0;">Mục đích:</td>
        <td style="color:#2563eb;font-weight:600;padding:3px 0;">${escapeHtml(actionLabel)}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:3px 0;">Thời hạn:</td>
        <td style="color:#059669;font-weight:600;padding:3px 0;">${escapeHtml(expiresLabel)}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:3px 0;">Thời gian gửi:</td>
        <td style="color:#64748b;padding:3px 0;">${escapeHtml(formatViTime())} (GMT+7)</td>
      </tr>
    </table>`;
}

/* ============================================================
   1. MẪU EMAIL: MÃ OTP ĐẶT LẠI MẬT KHẨU
   ============================================================ */
export function buildPasswordResetOtpEmailHtml({ code, email, name = '', avatarUrl = '', appName = 'ELEC AI' }) {
  const bodyHtml = `
    ${renderUserProfileCard({ name, email, avatarUrl })}
    
    <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#334155;">
      Hệ thống bảo mật <strong>${escapeHtml(appName)}</strong> vừa nhận được yêu cầu <strong>khôi phục mật khẩu</strong> cho tài khoản của bạn.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
      Vui lòng nhập mã OTP 6 chữ số dưới đây vào ứng dụng để tạo mật khẩu mới:
    </p>

    ${renderOtpDigitsBox(code)}

    ${renderMetaTable({
      email,
      actionLabel: 'Đặt lại mật khẩu đăng nhập',
      expiresLabel: '10 phút (tối đa 5 lần nhập sai)',
    })}

    <div style="margin-top:18px;padding:12px 16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;font-size:12px;color:#991b1b;line-height:1.5;">
      <strong>Lưu ý an toàn:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư &mdash; mật khẩu hiện tại của bạn hoàn toàn an toàn.
    </div>`;

  return renderBrightEmailShell({
    preheader: `Mã OTP đặt lại mật khẩu của bạn là ${code} (hiệu lực 10 phút).`,
    badge: 'Khôi phục mật khẩu',
    heroIconGif: ANIM_LOCK_GIF,
    title: 'Đặt Lại Mật Khẩu Tài Khoản',
    subtitle: 'Mã xác thực một lần (OTP) để tạo mật khẩu mới an toàn',
    bodyHtml,
    appName,
  });
}

/* ============================================================
   2. MẪU EMAIL: MÃ OTP XÁC THỰC EMAIL ĐĂNG KÝ
   ============================================================ */
export function buildOtpEmailHtml({ code, email, name = '', avatarUrl = '', appName = 'ELEC AI' }) {
  const bodyHtml = `
    ${renderUserProfileCard({ name, email, avatarUrl })}

    <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#334155;">
      Chào mừng bạn gia nhập <strong>${escapeHtml(appName)}</strong>! Cảm ơn bạn đã lựa chọn nền tảng ôn thi &amp; giải đề KHTN thông minh.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
      Hãy nhập mã 6 số dưới đây để kích hoạt tài khoản học viên và mở khóa toàn bộ lộ trình:
    </p>

    ${renderOtpDigitsBox(code)}

    ${renderMetaTable({
      email,
      actionLabel: 'Kích hoạt tài khoản học viên',
      expiresLabel: '10 phút (tối đa 5 lần nhập sai)',
    })}

    <div style="margin-top:18px;padding:12px 16px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;font-size:12px;color:#166534;line-height:1.5;">
      <strong>Quà tặng tân học viên:</strong> Ngay sau khi xác thực thành công, bạn sẽ nhận được 50 lượt giải chi tiết đề thi và quyền truy cập phòng thi ảo 3D!
    </div>`;

  return renderBrightEmailShell({
    preheader: `Mã kích hoạt ELEC AI của bạn là ${code} (hiệu lực 10 phút).`,
    badge: 'Kích hoạt tài khoản',
    heroIconGif: ANIM_WAVE_GIF,
    title: 'Xác Thực Email Của Bạn',
    subtitle: 'Bước cuối cùng để kích hoạt tài khoản học tập tại ELEC AI',
    bodyHtml,
    appName,
  });
}

/* ============================================================
   3. MẪU EMAIL: LIÊN KẾT ĐẶT LẠI MẬT KHẨU
   ============================================================ */
export function buildPasswordResetEmailHtml({ resetLink, email, name = '', avatarUrl = '', appName = 'ELEC AI' }) {
  const safeLink = escapeHtml(resetLink);
  const bodyHtml = `
    ${renderUserProfileCard({ name, email, avatarUrl })}

    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#334155;">
      Chúng tôi vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${escapeHtml(appName)}</strong> của bạn. Bấm vào nút bên dưới để tạo mật khẩu mới ngay:
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px 0;">
      <tr>
        <td align="center">
          <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(90deg, #2563eb 0%, #0284c7 100%);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 34px;border-radius:12px;box-shadow:0 6px 18px rgba(37,99,235,0.25);">
            Tạo Mật Khẩu Mới Ngay &rarr;
          </a>
        </td>
      </tr>
    </table>

    ${renderMetaTable({
      email,
      actionLabel: 'Đặt lại mật khẩu qua liên kết bảo mật',
      expiresLabel: '1 giờ (chỉ dùng 1 lần)',
    })}

    <div style="margin-top:18px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:4px;">Hoặc dán liên kết này vào trình duyệt:</div>
      <div style="font-size:11px;line-height:1.5;color:#2563eb;word-break:break-all;font-family:monospace;">${safeLink}</div>
    </div>`;

  return renderBrightEmailShell({
    preheader: 'Yêu cầu đặt lại mật khẩu tài khoản ELEC AI — Bấm để mở liên kết bảo mật.',
    badge: 'Liên kết bảo mật',
    heroIconGif: ANIM_LOCK_GIF,
    title: 'Đặt lại mật khẩu mới',
    subtitle: 'Tạo mật khẩu mới qua liên kết bảo mật có thời hạn 1 giờ',
    bodyHtml,
    appName,
  });
}

export function buildOtpEmailText({ code, email, name = '', appName = 'ELEC AI' }) {
  const safeName = name || 'học viên';
  return `Xin chào ${safeName},\n\nCảm ơn bạn đã đăng ký tại ${appName}.\nMã xác thực tài khoản của bạn là: ${code}\n(Hiệu lực trong 10 phút, tối đa 5 lần nhập).\n\nTài khoản: ${email}\n\nTrân trọng,\nĐội ngũ ${appName}\n${BRAND_SITE}`;
}

export function buildPasswordResetOtpEmailText({ code, email, name = '', appName = 'ELEC AI' }) {
  const safeName = name || 'bạn';
  return `Xin chào ${safeName},\n\nHệ thống ghi nhận yêu cầu đặt lại mật khẩu tài khoản ${appName}.\nMã OTP của bạn là: ${code}\n(Hiệu lực trong 10 phút, tối đa 5 lần nhập).\n\nTài khoản: ${email}\nNếu bạn không yêu cầu, vui lòng bỏ qua thư này.\n\nTrân trọng,\nĐội ngũ ${appName}\n${BRAND_SITE}`;
}

export function buildPasswordResetEmailText({ resetLink, email, name = '', appName = 'ELEC AI' }) {
  const safeName = name || 'bạn';
  return `Xin chào ${safeName},\n\nLiên kết đặt lại mật khẩu tài khoản ${appName} của bạn là:\n${resetLink}\n(Hiệu lực trong 1 giờ, chỉ dùng 1 lần).\n\nTài khoản: ${email}\n\nTrân trọng,\nĐội ngũ ${appName}\n${BRAND_SITE}`;
}

-- ============================================================
-- Migration: Credits System — Hệ thống điểm tự động nạp
-- Chạy 1 lần trong Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Bảng 1: user_credits — Số dư credits mỗi user
-- ============================================================
CREATE TABLE IF NOT EXISTS user_credits (
  user_id      TEXT PRIMARY KEY,
  balance      INTEGER NOT NULL DEFAULT 50,
  total_earned INTEGER NOT NULL DEFAULT 50,
  total_spent  INTEGER NOT NULL DEFAULT 0,
  last_free_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Bảng 2: credit_transactions — Lịch sử giao dịch
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN (
    'signup_bonus', 'daily_free', 'purchase', 'referral',
    'ai_text', 'ai_image', 'refund',
    'admin_grant', 'admin_deduct'
  )),
  description TEXT,
  order_id    UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user
  ON credit_transactions(user_id, created_at DESC);

-- ============================================================
-- Bảng 3: payment_orders — Đơn nạp tiền
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  order_code   TEXT UNIQUE NOT NULL,
  amount_vnd   INTEGER NOT NULL,
  credits      INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  paid_at      TIMESTAMPTZ,
  sepay_tx_id  TEXT,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_code ON payment_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_user ON payment_orders(user_id, created_at DESC);

-- ============================================================
-- RLS — Cho phép client đọc data của mình
-- (Firebase UID lưu dạng text, không dùng auth.uid())
-- ============================================================
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả đọc (client gửi userId để filter)
-- Webhook dùng service_role key nên bypass RLS
DROP POLICY IF EXISTS "Allow select user_credits" ON user_credits;
CREATE POLICY "Allow select user_credits" ON user_credits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select credit_transactions" ON credit_transactions;
CREATE POLICY "Allow select credit_transactions" ON credit_transactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select payment_orders" ON payment_orders;
CREATE POLICY "Allow select payment_orders" ON payment_orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert payment_orders" ON payment_orders;
CREATE POLICY "Allow insert payment_orders" ON payment_orders
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- Trigger: auto update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION credits_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_credits_updated ON user_credits;
CREATE TRIGGER trg_credits_updated
  BEFORE UPDATE ON user_credits
  FOR EACH ROW EXECUTE FUNCTION credits_set_updated_at();

-- ============================================================
-- Function: Cộng/trừ credits an toàn (atomic)
-- SECURITY DEFINER để webhook gọi được
-- ============================================================
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id TEXT,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_order_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Upsert user_credits
  INSERT INTO user_credits (user_id, balance, total_earned, total_spent)
  VALUES (
    p_user_id,
    GREATEST(0, p_amount),
    CASE WHEN p_amount > 0 THEN p_amount ELSE 0 END,
    CASE WHEN p_amount < 0 THEN ABS(p_amount) ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = GREATEST(0, user_credits.balance + p_amount),
    total_earned = CASE
      WHEN p_amount > 0 THEN user_credits.total_earned + p_amount
      ELSE user_credits.total_earned
    END,
    total_spent = CASE
      WHEN p_amount < 0 THEN user_credits.total_spent + ABS(p_amount)
      ELSE user_credits.total_spent
    END
  RETURNING balance INTO v_new_balance;

  -- Ghi lịch sử giao dịch
  INSERT INTO credit_transactions (user_id, amount, type, description, order_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_order_id);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Bật Realtime cho user_credits và payment_orders
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE user_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_orders;

// ============================================================
// SePay Webhook — Tự động cộng credits khi nhận chuyển khoản
// Deploy: supabase functions deploy sepay-webhook
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SEPAY_API_KEY = Deno.env.get('SEPAY_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Bảng quy đổi (phải khớp với CREDIT_PACKAGES ở frontend)
const CREDIT_PACKAGES = {
  10000: 100,
  20000: 210,
  50000: 550,
  100000: 1150,
  200000: 2400,
  500000: 6500,
}

function calculateCredits(amountVnd) {
  if (CREDIT_PACKAGES[amountVnd]) return CREDIT_PACKAGES[amountVnd]
  return Math.floor(amountVnd / 1000) * 10
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  // ========== 1. Xác thực API Key từ SePay ==========
  const authHeader = req.headers.get('Authorization') || ''
  if (SEPAY_API_KEY && authHeader !== `Apikey ${SEPAY_API_KEY}`) {
    console.warn('[webhook] Unauthorized:', authHeader.slice(0, 20))
    return new Response(
      JSON.stringify({ success: false, message: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ========== 2. Parse payload từ SePay ==========
  let data
  try {
    data = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const {
    id: sepayTxId,
    transferType,
    transferAmount,
    content,
    code,
  } = data

  console.log(`[webhook] Nhận giao dịch: type=${transferType}, amount=${transferAmount}, content=${content}`)

  // Chỉ xử lý tiền VÀO
  if (transferType !== 'in') {
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ========== 3. Bóc tách order_code ==========
  // Format nội dung CK: "ELEC ABC123"
  const match = (content || '').match(/ELEC\s+([A-Z0-9]{4,})/i)
  const orderCode = match?.[1]?.toUpperCase() || code?.toUpperCase() || ''

  if (!orderCode) {
    console.warn('[webhook] Không tìm thấy order code trong:', content)
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  console.log(`[webhook] Order code: ${orderCode}`)

  // ========== 4. Xử lý nghiệp vụ ==========
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Tìm đơn hàng pending
  const { data: order, error: orderErr } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('order_code', orderCode)
    .eq('status', 'pending')
    .maybeSingle()

  if (orderErr || !order) {
    console.warn('[webhook] Không tìm order:', orderCode, orderErr?.message)
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Idempotency: đã xử lý rồi thì bỏ qua
  if (order.status === 'paid') {
    console.log('[webhook] Order đã paid, skip')
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Kiểm tra số tiền (cho phép chênh 1.000đ do phí CK)
  if (transferAmount < order.amount_vnd - 1000) {
    console.warn(`[webhook] Số tiền không khớp: nhận ${transferAmount}, cần ${order.amount_vnd}`)
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ========== 5. Cộng credits (atomic) ==========
  const creditsToAdd = order.credits || calculateCredits(transferAmount)

  const { error: creditErr } = await supabase.rpc('add_credits', {
    p_user_id: order.user_id,
    p_amount: creditsToAdd,
    p_type: 'purchase',
    p_description: `Nạp ${transferAmount.toLocaleString()}đ → +${creditsToAdd} điểm`,
    p_order_id: order.id,
  })

  if (creditErr) {
    console.error('[webhook] Lỗi cộng credits:', creditErr)
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ========== 6. Đánh dấu đơn đã thanh toán ==========
  await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      sepay_tx_id: String(sepayTxId || ''),
    })
    .eq('id', order.id)

  console.log(`[webhook] ✅ Thành công: user=${order.user_id}, +${creditsToAdd} credits`)

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})

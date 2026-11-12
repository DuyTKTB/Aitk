import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from collections import deque
import numpy as np
from PIL import Image

def extract_cell(im, r, c, nrows, ncols, pad=12):
    """
    Extract a single cell, remove outer white background using floodfill,
    preserve white interior (face, eyes, text, clothes),
    de-fringe anti-aliased edge, and add transparent padding.
    """
    W, H = im.size
    cw = W / float(ncols)
    ch = H / float(nrows)
    
    # Exact cell slice
    x0 = int(round(c * cw))
    x1 = int(round((c + 1) * cw))
    y0 = int(round(r * ch))
    y1 = int(round((r + 1) * ch))
    
    cell = im.crop((x0, y0, x1, y1))
    arr = np.array(cell.convert('RGB'))
    cH, cW, _ = arr.shape
    
    # White background threshold
    is_white = (arr[:, :, 0] > 240) & (arr[:, :, 1] > 240) & (arr[:, :, 2] > 240)
    bg_mask = np.zeros((cH, cW), dtype=bool)
    q = deque()
    
    for x in range(cW):
        if is_white[0, x]: q.append((0, x)); bg_mask[0, x] = True
        if is_white[cH-1, x]: q.append((cH-1, x)); bg_mask[cH-1, x] = True
    for y in range(cH):
        if is_white[y, 0] and not bg_mask[y, 0]: q.append((y, 0)); bg_mask[y, 0] = True
        if is_white[y, cW-1] and not bg_mask[y, cW-1]: q.append((y, cW-1)); bg_mask[y, cW-1] = True
        
    while q:
        y, x = q.popleft()
        for dy, dx in ((-1,0), (1,0), (0,-1), (0,1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < cH and 0 <= nx < cW:
                if not bg_mask[ny, nx] and is_white[ny, nx]:
                    bg_mask[ny, nx] = True
                    q.append((ny, nx))
                    
    fg_mask = ~bg_mask
    ys, xs = np.where(fg_mask)
    if len(ys) == 0:
        return None
        
    ymin, ymax = ys.min(), ys.max()
    xmin, xmax = xs.min(), xs.max()
    
    crop_arr = arr[ymin:ymax+1, xmin:xmax+1]
    crop_bg = bg_mask[ymin:ymax+1, xmin:xmax+1]
    
    sH, sW, _ = crop_arr.shape
    alpha = np.where(crop_bg, 0, 255).astype(np.uint8)
    rgba = np.dstack([crop_arr, alpha])
    
    # De-fringe edge pixels
    for y in range(sH):
        for x in range(sW):
            if alpha[y, x] == 255:
                # Check 4-neighbors for transparency
                has_trans_nbr = False
                for dy, dx in ((-1,0), (1,0), (0,-1), (0,1)):
                    ny, nx = y + dy, x + dx
                    if ny < 0 or ny >= sH or nx < 0 or nx >= sW or alpha[ny, nx] == 0:
                        has_trans_nbr = True
                        break
                if has_trans_nbr:
                    r_val, g_val, b_val = crop_arr[y, x]
                    brightness = (int(r_val) + int(g_val) + int(b_val)) / 3.0
                    if brightness > 220:
                        a_val = int(255 - (brightness - 220) / (255 - 220) * 190)
                        rgba[y, x, 3] = max(40, min(255, a_val))
                        
    sprite = Image.fromarray(rgba, mode='RGBA')
    
    # Add uniform transparent padding
    final_w = sprite.width + pad * 2
    final_h = sprite.height + pad * 2
    padded = Image.new('RGBA', (final_w, final_h), (0, 0, 0, 0))
    padded.paste(sprite, (pad, pad))
    return padded

def process_all():
    out_dir = r'D:\Tải Xuống\app\public\img\elec'
    os.makedirs(out_dir, exist_ok=True)
    
    # ── SHEET 1: 1 (1).png (3 rows x 5 cols) ──
    s1_path = os.path.join(out_dir, 'elecpng', '1 (1).png')
    im1 = Image.open(s1_path).convert('RGB')
    
    sheet1_names = {
        (0, 0): 'elec-default',       # Chào! / Default / Hello
        (0, 1): 'elec-wink',          # Thumbs up nháy mắt
        (0, 2): 'elec-happy',         # Nhảy vui cười híp mắt
        (0, 3): 'elec-love',          # Ôm tim hồng
        (0, 4): 'elec-cool',          # Kính râm pixel cool ngầu
        (1, 0): 'elec-think',         # Tay chống cằm suy nghĩ (?)
        (1, 1): 'elec-crying',        # Ngồi khóc ròng rã
        (1, 2): 'elec-angry',         # Nổi giận gân đỏ
        (1, 3): 'elec-shocked',       # Há hốc mồm kinh ngạc (!!)
        (1, 4): 'elec-sleepy',        # Ngủ gật (Zzz)
        (2, 0): 'elec-heart-eyes',    # Mắt trái tim mê mẩn
        (2, 1): 'elec-fighting',      # Quyết tâm đấm tới
        (2, 2): 'elec-shy',           # Ngượng ngùng hoa bay
        (2, 3): 'elec-exhausted',     # Nằm bẹp dí dưới sàn (...)
        (2, 4): 'elec-celebrate',     # Nhảy múa ăn mừng sao bay
    }
    
    print('Extracting Sheet 1 (15 emotions)...')
    for (r, c), name in sheet1_names.items():
        res = extract_cell(im1, r, c, 3, 5, pad=12)
        if res:
            out_file = os.path.join(out_dir, f'{name}.png')
            res.save(out_file, 'PNG')
            print(f'  Saved {out_file} (size: {res.size})')
            if name == 'elec-crying':
                res.save(os.path.join(out_dir, 'elec-sad.png'), 'PNG')
            if name == 'elec-default':
                res.save(os.path.join(out_dir, 'elec-hello.png'), 'PNG')

    # ── SHEET 2: 1 (2).png (3 rows x 6 cols) ──
    s2_path = os.path.join(out_dir, 'elecpng', '1 (2).png')
    im2 = Image.open(s2_path).convert('RGB')
    
    sheet2_extra = {
        (0, 1): 'elec-grumpy',          # Bĩu môi khoanh tay hờn dỗi
        (0, 2): 'elec-plead',           # Mắt ngấn lệ chắp tay cầu xin
        (1, 4): 'elec-sleeping-pillow',   # Ngủ trên gối êm
        (2, 1): 'elec-super-saiyan',    # Năng lượng bùng nổ Super Saiyan
        (2, 5): 'elec-suspicious',      # Khoanh tay liếc mắt nghi ngờ
    }
    
    print('\nExtracting Sheet 2 (Special extra emotions)...')
    for (r, c), name in sheet2_extra.items():
        res = extract_cell(im2, r, c, 3, 6, pad=12)
        if res:
            out_file = os.path.join(out_dir, f'{name}.png')
            res.save(out_file, 'PNG')
            print(f'  Saved {out_file} (size: {res.size})')
            
    print('\nAll 20+ mascot emotions extracted cleanly and saved with transparency!')

if __name__ == '__main__':
    process_all()

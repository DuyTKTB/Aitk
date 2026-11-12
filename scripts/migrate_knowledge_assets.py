# -*- coding: utf-8 -*-
"""
migrate_knowledge_assets.py
Sao chép, chuẩn hóa và chuyển đổi toàn bộ tài nguyên từ 'ELEC AI' vào 'public/img/knowledge/'
Đồng thời render 11 trang của '11.pdf' thành ảnh JPG độ nét cao để xem trực tiếp trong app.
"""

import os
import shutil
import pymupdf  # fitz

SRC_DIR = r"D:\Tải Xuống\app\ELEC AI"
DEST_BASE = r"D:\Tải Xuống\app\public\img\knowledge"

os.makedirs(DEST_BASE, exist_ok=True)

manifest = {}

# 1. HÓA 10
hoa10_src = os.path.join(SRC_DIR, "Hóa", "10")
hoa10_dest = os.path.join(DEST_BASE, "hoa", "10")
os.makedirs(hoa10_dest, exist_ok=True)

# Mapping chương Hóa 10
hoa10_files = os.listdir(hoa10_src)
for f in hoa10_files:
    src_f = os.path.join(hoa10_src, f)
    # Tên chuẩn: c10-chX-Y.gif
    safe_name = f.replace("chương ", "hoa10-ch").replace(" ", "").replace("(", "-").replace(")", "")
    dest_f = os.path.join(hoa10_dest, safe_name)
    shutil.copy2(src_f, dest_f)

print(f"[OK] Hóa 10: Đã sao chép {len(hoa10_files)} tệp vào {hoa10_dest}")

# 2. HÓA 12
hoa12_src = os.path.join(SRC_DIR, "Hóa", "12")
hoa12_dest = os.path.join(DEST_BASE, "hoa", "12")
os.makedirs(hoa12_dest, exist_ok=True)

bai_map = {
    "1": "bai01-ester",
    "2": "bai02-lipid",
    "3": "bai03-carbohydrate",
    "4": "bai04-glucose-fructose",
    "5": "bai05-saccharose-maltose",
    "6": "bai06-tinhbot-cellulose",
    "7": "bai07-amine",
    "8": "bai08-amino-acid",
    "9": "bai09-peptide",
    "10": "bai10-protein",
    "11": "bai11-cau-truc-protein",
    "13": "bai13-dai-cuong-polymer",
    "14": "bai14-vat-lieu-polymer",
    "15": "bai15-to-tong-hop",
    "16": "bai16-cao-su-keo-dan",
    "17": "bai17-kim-loai",
    "18": "bai18-day-dien-hoa",
    "20": "bai20-an-mon-kim-loai",
    "20.2": "bai20-2-dieu-che-kim-loai",
    "21": "bai21-pin-dien-hoa",
    "22": "bai22-dien-phan",
    "23": "bai23-phuc-chat",
}

hoa12_files = os.listdir(hoa12_src)
for f in hoa12_files:
    num_part = f.replace("(", "").replace(").jpg", "")
    bai_slug = bai_map.get(num_part, f"bai{num_part}")
    safe_name = f"hoa12-{bai_slug}.jpg"
    shutil.copy2(os.path.join(hoa12_src, f), os.path.join(hoa12_dest, safe_name))

print(f"[OK] Hóa 12: Đã sao chép {len(hoa12_files)} tệp vào {hoa12_dest}")

# 3. LÝ 10
ly10_src = os.path.join(SRC_DIR, "Lý", "10")
ly10_dest = os.path.join(DEST_BASE, "ly", "10")
os.makedirs(ly10_dest, exist_ok=True)

ly10_files = os.listdir(ly10_src)
for f in ly10_files:
    # học kì 1 (1).jpg -> ly10-hk1-1.jpg
    safe_name = f.replace("học kì ", "ly10-hk").replace(" ", "").replace("(", "-").replace(")", "")
    shutil.copy2(os.path.join(ly10_src, f), os.path.join(ly10_dest, safe_name))

print(f"[OK] Lý 10: Đã sao chép {len(ly10_files)} tệp vào {ly10_dest}")

# 4. LÝ 11 - RENDER TỪ 11.pdf
ly11_src_pdf = os.path.join(SRC_DIR, "Lý", "11", "11.pdf")
ly11_dest = os.path.join(DEST_BASE, "ly", "11")
os.makedirs(ly11_dest, exist_ok=True)

# Copy file PDF gốc
shutil.copy2(ly11_src_pdf, os.path.join(ly11_dest, "ly11-tong-hop-kien-thuc.pdf"))

# Render từng trang thành ảnh JPG độ nét cao (2x DPI)
doc_pdf = pymupdf.open(ly11_src_pdf)
print(f"[INFO] Lý 11: Đang render {len(doc_pdf)} trang từ 11.pdf sang ảnh JPG...")
for page_num in range(len(doc_pdf)):
    page = doc_pdf[page_num]
    pix = page.get_pixmap(dpi=200)
    img_name = f"ly11-chuyensau-trang-{page_num + 1:02d}.jpg"
    pix.save(os.path.join(ly11_dest, img_name))

print(f"[OK] Lý 11: Render thành công {len(doc_pdf)} trang JPG sắc nét!")

# 5. LÝ 12
ly12_src = os.path.join(SRC_DIR, "Lý", "12")
ly12_dest = os.path.join(DEST_BASE, "ly", "12")
os.makedirs(ly12_dest, exist_ok=True)

ly12_files = os.listdir(ly12_src)
for f in ly12_files:
    num_part = f.replace("(", "").replace(").jpg", "")
    safe_name = f"ly12-vat-ly-nhiet-{num_part}.jpg"
    shutil.copy2(os.path.join(ly12_src, f), os.path.join(ly12_dest, safe_name))

print(f"[OK] Lý 12: Đã sao chép {len(ly12_files)} tệp vào {ly12_dest}")
print("[HOÀN TẤT] Toàn bộ tài nguyên đã được số hóa sang public/img/knowledge!")

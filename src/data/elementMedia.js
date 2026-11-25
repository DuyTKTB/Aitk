/* ============================================================
   elementMedia.js — Ảnh thật Wikimedia Commons + Quang phổ + Ngọn lửa +
   Cấu trúc 3D + Nhiệt độ nóng chảy/sôi đầy đủ + Ví dụ đời sống & PTHH GDPT 2018
   Nguồn ảnh & dữ liệu vật lý chuẩn hóa từ Bowserinator/Periodic-Table-JSON (CC BY / Public Domain)
   ============================================================ */

export const ELEMENT_MEDIA = {
  "H": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/d/d9/Hydrogenglow.jpg",
    "imgTitle": "Vial of glowing ultrapure hydrogen, H2. Original size in cm: 1 x 5",
    "block": "s",
    "cpk": "#ffffff",
    "melt": 14,
    "boil": 20.3,
    "ie": 1312,
    "ea": 72.8,
    "density": 0.09,
    "appearance": "colorless gas",
    "crystal": "diatomic",
    "spectrum": [
      410,
      434,
      486,
      656
    ],
    "examples": [
      "Nhiên liệu tên lửa & xe chạy pin nhiên liệu H₂",
      "Tổng hợp amonia (NH₃) làm phân đạm",
      "Khí nhẹ nhất vũ trụ (chiếm ~75% khối lượng Mặt Trời)"
    ],
    "reactions": [
      "2H₂ + O₂ → 2H₂O (t°)",
      "N₂ + 3H₂ ⇌ 2NH₃ (t°, p, Fe)",
      "CuO + H₂ → Cu + H₂O (t°)"
    ]
  },
  "He": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/0/00/Helium-glow.jpg",
    "imgTitle": "Vial of glowing ultrapure helium. Original size in cm: 1 x 5",
    "block": "s",
    "cpk": "#d9ffff",
    "melt": 1,
    "boil": 4.2,
    "ie": 2372,
    "ea": -48,
    "density": 0.179,
    "appearance": "colorless gas, exhibiting a red-orange glow when placed in a high-voltage electric field",
    "crystal": "monatomic",
    "spectrum": [
      447,
      471,
      492,
      501,
      587,
      667,
      706
    ],
    "examples": [
      "Bơm khinh khí cầu & bóng bay an toàn (không cháy)",
      "Làm lạnh siêu dẫn cho máy chụp cộng hưởng từ MRI",
      "Khí bảo vệ hồ quang trong công nghiệp hàn"
    ],
    "reactions": [
      "Khí hiếm trơ về mặt hóa học (vỏ 1s² bão hòa)"
    ]
  },
  "Li": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/e/e2/0.5_grams_lithium_under_argon.jpg",
    "imgTitle": "0.5 Grams Lithium under Argon. Original size of the largest piece in cm: 0.3 x 4",
    "block": "s",
    "cpk": "#cc80ff",
    "melt": 453.7,
    "boil": 1603,
    "ie": 520,
    "ea": 59.6,
    "density": 0.534,
    "appearance": "silvery-white",
    "crystal": "bcc",
    "flame": {
      "color": "#ef4444",
      "glow": "#fca5a5",
      "label": "Đỏ thẫm (Crimson)"
    },
    "spectrum": [
      413,
      460,
      497,
      610,
      671
    ],
    "examples": [
      "Pin Lithium-ion trong điện thoại, laptop & xe điện",
      "Hợp kim siêu nhẹ dùng cho thân vỏ hàng không",
      "Gốm thủy tinh chịu sốc nhiệt"
    ],
    "reactions": [
      "2Li + 2H₂O → 2LiOH + H₂↑",
      "4Li + O₂ → 2Li₂O"
    ]
  },
  "Be": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/e/e2/Beryllium_%28Be%29.jpg",
    "imgTitle": "Pure Beryllium bead, 2.5 grams. Original size in cm: 1 x 1.5",
    "block": "s",
    "cpk": "#c2ff00",
    "melt": 1560,
    "boil": 2742,
    "ie": 900,
    "ea": -48,
    "density": 1.85,
    "appearance": "white-gray metallic",
    "crystal": "hcp",
    "spectrum": [
      457,
      467,
      527
    ]
  },
  "B": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Boron.jpg",
    "imgTitle": "Pure Crystalline Boron, front and back side. Original size in cm: 2 x 3",
    "block": "p",
    "cpk": "#ffb5b5",
    "melt": 2349,
    "boil": 4200,
    "ie": 801,
    "ea": 27,
    "density": 2.08,
    "appearance": "black-brown",
    "crystal": "bcc",
    "flame": {
      "color": "#4ade80",
      "glow": "#bbf7d0",
      "label": "Xanh lục tươi"
    },
    "spectrum": [
      412,
      494,
      518
    ]
  },
  "C": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/68/Pure_Carbon.png",
    "imgTitle": "Element 6 - Carbon",
    "block": "p",
    "cpk": "#909090",
    "melt": 3915,
    "boil": 3915,
    "ie": 1087,
    "ea": 121.8,
    "density": 1.821,
    "appearance": "",
    "crystal": "diamond",
    "spectrum": [
      426,
      477,
      505,
      538,
      601,
      658
    ],
    "examples": [
      "Kim cương siêu cứng & Than chì làm ruột bút chì, điện cực",
      "Than hoạt tính lọc nước, khử mùi",
      "Xương sống của mọi hợp chất hữu cơ & DNA"
    ],
    "reactions": [
      "C + O₂ → CO₂ (t°)",
      "C + CO₂ → 2CO (t° cao)",
      "C + 2H₂SO₄(đặc) → CO₂↑ + 2SO₂↑ + 2H₂O"
    ]
  },
  "N": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/2/2d/Nitrogen-glow.jpg",
    "imgTitle": "Vial of Glowing Ultrapure Nitrogen, N2. Original size in cm: 1 x 5",
    "block": "p",
    "cpk": "#3050f8",
    "melt": 63.2,
    "boil": 77.4,
    "ie": 1402,
    "ea": -6.8,
    "density": 1.251,
    "appearance": "colorless gas, liquid or solid",
    "crystal": "diatomic",
    "spectrum": [
      410,
      444,
      463,
      500,
      568,
      648
    ],
    "examples": [
      "Chiếm ~78% thể tích khí quyển Trái Đất",
      "Nitơ lỏng (-196°C) bảo quản mẫu sinh học & thực phẩm",
      "Sản xuất phân đạm (ure, NH₄NO₃) và axit nitric HNO₃"
    ],
    "reactions": [
      "N₂ + 3H₂ ⇌ 2NH₃ (t°, p, xt)",
      "N₂ + O₂ ⇌ 2NO (3000°C / tia lửa điện)"
    ]
  },
  "O": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/a/a0/Liquid_oxygen_in_a_beaker_%28cropped_and_retouched%29.jpg",
    "imgTitle": "Liquid Oxygen in a Beaker",
    "block": "p",
    "cpk": "#ff0d0d",
    "melt": 54.4,
    "boil": 90.2,
    "ie": 1314,
    "ea": 141,
    "density": 1.429,
    "appearance": "",
    "crystal": "diatomic",
    "spectrum": [
      436,
      465,
      533,
      615,
      645,
      700
    ],
    "examples": [
      "Duy trì hô hấp sinh vật & bình oxy y tế",
      "Tầng ozone (O₃) chắn tia cực tím UV",
      "Thổi oxy trong lò luyện gang thép & hàn cắt kim loại"
    ],
    "reactions": [
      "3Fe + 2O₂ → Fe₃O₄ (t°)",
      "4Al + 3O₂ → 2Al₂O₃ (t°)",
      "S + O₂ → SO₂ (t°)"
    ]
  },
  "F": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Fluoro_liquido_a_-196%C2%B0C_1.jpg",
    "imgTitle": "Liquid Fluorine at -196°C",
    "block": "p",
    "cpk": "#90e050",
    "melt": 53.5,
    "boil": 85,
    "ie": 1681,
    "ea": 328.2,
    "density": 1.696,
    "appearance": "",
    "crystal": "diatomic",
    "spectrum": [
      424,
      624,
      634,
      685,
      703
    ],
    "examples": [
      "Ion F⁻ trong kem đánh răng ngừa sâu răng",
      "Nhựa Teflon (PTFE) chống dính chảo nấu ăn",
      "Khắc chữ & hoa văn lên thủy tinh bằng HF"
    ],
    "reactions": [
      "H₂ + F₂ → 2HF (nổ ngay trong bóng tối)",
      "2F₂ + 2H₂O → 4HF + O₂↑"
    ]
  },
  "Ne": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/f/f8/Neon-glow.jpg",
    "imgTitle": "Vial of Glowing Ultrapure neon. Original size in cm: 1 x 5",
    "block": "p",
    "cpk": "#b3e3f5",
    "melt": 24.6,
    "boil": 27.1,
    "ie": 2081,
    "ea": -116,
    "density": 0.9,
    "appearance": "colorless gas exhibiting an orange-red glow when placed in a high voltage electric field",
    "crystal": "monatomic",
    "spectrum": [
      540,
      585,
      588,
      607,
      614,
      640,
      650,
      692,
      703
    ],
    "examples": [
      "Đèn ống neon phát ánh sáng đỏ cam rực rỡ",
      "Laser He-Ne trong máy quét mã vạch & thí nghiệm quang học"
    ],
    "reactions": [
      "Khí hiếm hoàn toàn trơ hóa học (2s²2p⁶ bền vững)"
    ]
  },
  "Na": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/2/27/Na_%28Sodium%29.jpg",
    "imgTitle": "Na (Sodium) Metal",
    "block": "s",
    "cpk": "#ab5cf2",
    "melt": 370.9,
    "boil": 1156.1,
    "ie": 496,
    "ea": 52.9,
    "density": 0.968,
    "appearance": "silvery white metallic",
    "crystal": "bcc",
    "flame": {
      "color": "#f59e0b",
      "glow": "#fde68a",
      "label": "Vàng rực (589 nm)"
    },
    "spectrum": [
      498,
      568,
      589,
      589.6,
      615
    ],
    "examples": [
      "Muối ăn NaCl & bột nở Baking Soda (NaHCO₃)",
      "Đèn hơi natri màu vàng chiếu sáng đường cao tốc",
      "Xút ăn da NaOH trong công nghiệp giấy, xà phòng"
    ],
    "reactions": [
      "2Na + 2H₂O → 2NaOH + H₂↑",
      "2Na + Cl₂ → 2NaCl",
      "4Na + O₂ → 2Na₂O"
    ]
  },
  "Mg": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Magnesium_crystals.jpg",
    "imgTitle": "Magnesium crystals",
    "block": "s",
    "cpk": "#8aff00",
    "melt": 923,
    "boil": 1363,
    "ie": 738,
    "ea": -40,
    "density": 1.738,
    "appearance": "shiny grey solid",
    "crystal": "hcp",
    "flame": {
      "color": "#f8fafc",
      "glow": "#e0f2fe",
      "label": "Trắng chói lòa"
    },
    "spectrum": [
      435,
      470,
      516,
      517,
      518,
      552
    ],
    "examples": [
      "Nguyên tử trung tâm của phân tử diệp lục (Chlorophyll)",
      "Pháo sáng cháy với ánh sáng trắng chói",
      "Hợp kim nhẹ dùng trong khung laptop & vành xe"
    ],
    "reactions": [
      "Mg + 2HCl → MgCl₂ + H₂↑",
      "2Mg + O₂ → 2MgO (t°)",
      "2Mg + CO₂ → 2MgO + C (t°)"
    ]
  },
  "Al": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Aluminium.jpg",
    "imgTitle": "Pure aluminium foil. Original size in cm: 5 x 5",
    "block": "p",
    "cpk": "#bfa6a6",
    "melt": 933.5,
    "boil": 2743,
    "ie": 578,
    "ea": 41.8,
    "density": 2.7,
    "appearance": "silvery gray metallic",
    "crystal": "fcc",
    "spectrum": [
      394,
      396,
      466,
      559,
      624
    ],
    "examples": [
      "Vỏ máy bay, khung cửa nhôm nhẹ chống ăn mòn",
      "Giấy bạc bọc thực phẩm & vỏ lon nước giải khát",
      "Dây dẫn điện cao thế siêu nhẹ"
    ],
    "reactions": [
      "2Al + 6HCl → 2AlCl₃ + 3H₂↑",
      "2Al + 2NaOH + 2H₂O → 2Na[Al(OH)₄] + 3H₂↑",
      "2Al + Fe₂O₃ → Al₂O₃ + 2Fe (phản ứng nhiệt nhôm)"
    ]
  },
  "Si": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Silicon.jpg",
    "imgTitle": "Chunk of Ultrapure Silicon, 2 x 2 cm",
    "block": "p",
    "cpk": "#f0c8a0",
    "melt": 1687,
    "boil": 3538,
    "ie": 787,
    "ea": 134.1,
    "density": 2.329,
    "appearance": "crystalline, reflective with bluish-tinged faces",
    "crystal": "diamond",
    "spectrum": [
      413,
      505,
      597,
      634,
      637
    ],
    "examples": [
      "Tấm wafer chế tạo chip CPU, GPU & pin mặt trời",
      "Thủy tinh, thạch anh, cát xây dựng (SiO₂)",
      "Silicone y tế & keo dán chống thấm"
    ],
    "reactions": [
      "Si + O₂ → SiO₂ (t°)",
      "Si + 2NaOH + H₂O → Na₂SiO₃ + 2H₂↑",
      "SiO₂ + 4HF → SiF₄↑ + 2H₂O"
    ]
  },
  "P": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Phosphorus-purple.jpg",
    "imgTitle": "Purple Phosphorus",
    "block": "p",
    "cpk": "#ff8000",
    "melt": 317.3,
    "boil": 553.7,
    "ie": 1012,
    "ea": 72,
    "density": 1.823,
    "appearance": "colourless, waxy white, yellow, scarlet, red, violet, black",
    "crystal": "bcc",
    "spectrum": [
      442,
      458,
      525,
      542,
      604
    ],
    "examples": [
      "Vỏ bao diêm (photpho đỏ) & phân lân bón cây",
      "Thành phần thiết yếu của xương, răng & chuỗi DNA/ATP",
      "Chất phụ gia chống cháy"
    ],
    "reactions": [
      "4P + 5O₂ → 2P₂O₅ (t°)",
      "P₂O₅ + 3H₂O → 2H₃PO₄"
    ]
  },
  "S": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/2/23/Native_sulfur_%28Vodinskoe_Deposit%3B_quarry_near_Samara%2C_Russia%29_9.jpg",
    "imgTitle": "Native Sulfur From Russia",
    "block": "p",
    "cpk": "#ffff30",
    "melt": 388.4,
    "boil": 717.8,
    "ie": 1000,
    "ea": 200.4,
    "density": 2.07,
    "appearance": "lemon yellow sintered microcrystals",
    "crystal": "bcc",
    "spectrum": [
      416,
      469,
      545,
      564,
      675
    ],
    "examples": [
      "Sản xuất axit sunfuric (H₂SO₄) — \"máu\" của công nghiệp hóa chất",
      "Lưu hóa cao su làm lốp xe bền chắc",
      "Thuốc mỡ lưu huỳnh trị nấm da & pháo hoa"
    ],
    "reactions": [
      "S + O₂ → SO₂ (t°)",
      "Fe + S → FeS (t°)",
      "Hg + S → HgS (xử lý thủy ngân rơi vãi ở nhiệt độ thường)"
    ]
  },
  "Cl": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Chlorine-sample-flip.jpg",
    "imgTitle": "A Sample of Chlorine",
    "block": "p",
    "cpk": "#1ff01f",
    "melt": 171.6,
    "boil": 239.1,
    "ie": 1251,
    "ea": 348.6,
    "density": 3.2,
    "appearance": "pale yellow-green gas",
    "crystal": "diatomic",
    "spectrum": [
      413,
      479,
      481,
      521,
      542,
      614
    ],
    "examples": [
      "Khử trùng nước sạch sinh hoạt & bể bơi",
      "Sản xuất nhựa PVC (ống nước, vỏ cáp điện)",
      "Nước Gia-ven (NaClO) & Clorua vôi tẩy trắng"
    ],
    "reactions": [
      "Cl₂ + 2NaOH → NaCl + NaClO + H₂O",
      "2Fe + 3Cl₂ → 2FeCl₃ (t°)",
      "Cl₂ + 2KBr → 2KCl + Br₂"
    ]
  },
  "Ar": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/53/Argon-glow.jpg",
    "imgTitle": "Vial of glowing ultrapure argon. Original size in cm: 1 x 5",
    "block": "p",
    "cpk": "#80d1e3",
    "melt": 83.8,
    "boil": 87.3,
    "ie": 1521,
    "ea": -96,
    "density": 1.784,
    "appearance": "colorless gas exhibiting a lilac/violet glow when placed in a high voltage electric field",
    "crystal": "monatomic",
    "spectrum": [
      415,
      420,
      451,
      518,
      549,
      603,
      696,
      706
    ]
  },
  "K": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Potassium.JPG",
    "imgTitle": "Potassium Pieces",
    "block": "s",
    "cpk": "#8f40d4",
    "melt": 336.7,
    "boil": 1032,
    "ie": 419,
    "ea": 48.4,
    "density": 0.862,
    "appearance": "silvery gray",
    "crystal": "bcc",
    "flame": {
      "color": "#a855f7",
      "glow": "#e9d5ff",
      "label": "Tím hoa cà (Lilac)"
    },
    "spectrum": [
      404,
      405,
      580,
      691,
      694
    ],
    "examples": [
      "Phân kali (KCl, K₂SO₄) giúp cây cứng cáp & ngọt quả",
      "Chất điện giải thiết yếu cho tim mạch & thần kinh (có nhiều trong chuối)",
      "KNO₃ sản xuất thuốc nổ đen & pháo hoa"
    ],
    "reactions": [
      "2K + 2H₂O → 2KOH + H₂↑ (bốc cháy màu tím hoa cà)",
      "2K + Cl₂ → 2KCl"
    ]
  },
  "Ca": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/7/72/Calcium.jpg",
    "imgTitle": "Calcium Grains, grain size about 1 mm",
    "block": "s",
    "cpk": "#3dff00",
    "melt": 1115,
    "boil": 1757,
    "ie": 590,
    "ea": 2.4,
    "density": 1.55,
    "appearance": "",
    "crystal": "fcc",
    "flame": {
      "color": "#ea580c",
      "glow": "#fed7aa",
      "label": "Đỏ gạch (Cam đỏ)"
    },
    "spectrum": [
      422,
      445,
      527,
      558,
      616,
      643,
      649
    ],
    "examples": [
      "Thành phần chính tạo nên xương và răng chắc khỏe",
      "Đá vôi (CaCO₃), xi măng, thạch cao (CaSO₄) trong xây dựng",
      "Nước vôi trong Ca(OH)₂ nhận biết khí CO₂"
    ],
    "reactions": [
      "Ca + 2H₂O → Ca(OH)₂ + H₂↑",
      "CaCO₃ → CaO + CO₂↑ (t°)",
      "Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O"
    ]
  },
  "Sc": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/f/f5/Scandium%2C_Sc.jpg",
    "imgTitle": "Crystal of Scandium. About 1g",
    "block": "d",
    "cpk": "#e6e6e6",
    "melt": 1814,
    "boil": 3109,
    "ie": 633,
    "ea": 18,
    "density": 2.985,
    "appearance": "silvery white",
    "crystal": "hcp"
  },
  "Ti": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Titanium.jpg",
    "imgTitle": "Titanium Crystal made with the van Arkel-de Booer Process. 87 grams, Original size in cm: 2.5 x 4",
    "block": "d",
    "cpk": "#bfc2c7",
    "melt": 1941,
    "boil": 3560,
    "ie": 659,
    "ea": 7.3,
    "density": 4.506,
    "appearance": "silvery grey-white metallic",
    "crystal": "hcp",
    "spectrum": [
      453,
      498,
      500,
      519,
      586,
      625
    ]
  },
  "V": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Vanadium-pieces.jpg",
    "imgTitle": "Pieces of Pure Vanadium with Oxide Layer",
    "block": "d",
    "cpk": "#a6a6ab",
    "melt": 2183,
    "boil": 3680,
    "ie": 651,
    "ea": 50.9,
    "density": 6,
    "appearance": "blue-silver-grey metal",
    "crystal": "bcc"
  },
  "Cr": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/a/a1/Chromium.jpg",
    "imgTitle": "Piece of Chromium Metal",
    "block": "d",
    "cpk": "#8a99c7",
    "melt": 2180,
    "boil": 2944,
    "ie": 653,
    "ea": 65.2,
    "density": 7.19,
    "appearance": "silvery metallic",
    "crystal": "bcc",
    "spectrum": [
      425,
      427,
      429,
      520,
      540,
      633
    ],
    "examples": [
      "Tạo lớp mạ crôm sáng bóng chống gỉ & siêu cứng",
      "Thành phần cốt lõi của thép không gỉ (Inox)",
      "Tạo màu đỏ rực cho đá quý Ruby"
    ],
    "reactions": [
      "Cr + 2HCl → CrCl₂ + H₂↑",
      "2Cr + 3Cl₂ → 2CrCl₃ (t°)",
      "Cr₂O₃ + 2NaOH(đặc) → 2NaCrO₂ + H₂O"
    ]
  },
  "Mn": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/64/Manganese_element.jpg",
    "imgTitle": "Two Oieces of Manganese Metal",
    "block": "d",
    "cpk": "#9c7ac7",
    "melt": 1519,
    "boil": 2334,
    "ie": 717,
    "ea": -50,
    "density": 7.21,
    "appearance": "silvery metallic",
    "crystal": "fcc",
    "flame": {
      "color": "#84cc16",
      "glow": "#d9f99d",
      "label": "Xanh vàng nhạt"
    },
    "spectrum": [
      403,
      475,
      482,
      534,
      602
    ]
  },
  "Fe": {
    "img": "https://images-of-elements.com/iron-2.jpg",
    "imgTitle": "Fragments of an iron meteorite, about 92% iron. Original size of the single pieces in cm: 0.4 - 0.8",
    "block": "d",
    "cpk": "#e06633",
    "melt": 1811,
    "boil": 3134,
    "ie": 763,
    "ea": 14.8,
    "density": 7.874,
    "appearance": "lustrous metallic with a grayish tinge",
    "crystal": "bcc",
    "flame": {
      "color": "#fbbf24",
      "glow": "#fef08a",
      "label": "Tia lửa vàng kim"
    },
    "spectrum": [
      404,
      438,
      495,
      516,
      527,
      532,
      613,
      649
    ],
    "examples": [
      "Luyện gang, thép xây dựng cầu đường, nhà cao tầng, ô tô",
      "Nhân Heme trong hồng cầu vận chuyển O₂ trong máu",
      "Lõi nam châm điện & máy biến áp"
    ],
    "reactions": [
      "Fe + 2HCl → FeCl₂ + H₂↑",
      "Fe + 4HNO₃(loãng) → Fe(NO₃)₃ + NO↑ + 2H₂O",
      "Fe + CuSO₄ → FeSO₄ + Cu↓"
    ]
  },
  "Co": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/62/Cobalt_ore_2.jpg",
    "imgTitle": "Fractions from a cobalt, 7 and 4 grams. Original size in cm: 2 x 2",
    "block": "d",
    "cpk": "#f090a0",
    "melt": 1768,
    "boil": 3200,
    "ie": 760,
    "ea": 63.9,
    "density": 8.9,
    "appearance": "hard lustrous gray metal",
    "crystal": "hcp",
    "spectrum": [
      412,
      453,
      486,
      535,
      645
    ]
  },
  "Ni": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/57/Nickel_chunk.jpg",
    "imgTitle": "Nickel Chunk",
    "block": "d",
    "cpk": "#50d050",
    "melt": 1728,
    "boil": 3003,
    "ie": 737,
    "ea": 111.7,
    "density": 8.908,
    "appearance": "lustrous, metallic, and silver with a gold tinge",
    "crystal": "fcc",
    "spectrum": [
      440,
      471,
      508,
      547,
      664
    ]
  },
  "Cu": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/f/f0/NatCopper.jpg",
    "imgTitle": "Macro of Native Copper about 1 ½ inches (4 cm) in size",
    "block": "d",
    "cpk": "#c88033",
    "melt": 1357.8,
    "boil": 2835,
    "ie": 746,
    "ea": 119.2,
    "density": 8.96,
    "appearance": "red-orange metallic luster",
    "crystal": "fcc",
    "flame": {
      "color": "#06b6d4",
      "glow": "#a5f3fc",
      "label": "Xanh lam lục"
    },
    "spectrum": [
      406,
      465,
      510,
      515,
      521,
      578
    ],
    "examples": [
      "Lõi dây dẫn điện & cuộn dây mô-tơ (dẫn điện chỉ sau Ag)",
      "Hợp kim đồng thau (Cu-Zn) & đồng thanh (Cu-Sn)",
      "Dung dịch CuSO₄ màu xanh lam diệt nấm nông nghiệp"
    ],
    "reactions": [
      "Cu + 2H₂SO₄(đặc) → CuSO₄ + SO₂↑ + 2H₂O (t°)",
      "Cu + 4HNO₃(đặc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O",
      "Cu + 2FeCl₃ → CuCl₂ + 2FeCl₂"
    ]
  },
  "Zn": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Zinc_%2830_Zn%29.jpg",
    "imgTitle": "30 grams Zinc, front and back side. Original size in cm: 3",
    "block": "d",
    "cpk": "#7d80b0",
    "melt": 692.7,
    "boil": 1180,
    "ie": 906,
    "ea": -58,
    "density": 7.14,
    "appearance": "silver-gray",
    "crystal": "hcp",
    "flame": {
      "color": "#2dd4bf",
      "glow": "#99f6e4",
      "label": "Xanh lam nhạt"
    },
    "spectrum": [
      468,
      472,
      481,
      636
    ],
    "examples": [
      "Mạ kẽm nhúng nóng chống gỉ tôn lợp & thép ngoài trời",
      "Vỏ âm của pin khô kẽm-carbon & pin kiềm",
      "Vi chất tăng cường miễn dịch & kem chống nắng (ZnO)"
    ],
    "reactions": [
      "Zn + 2HCl → ZnCl₂ + H₂↑",
      "Zn + 2NaOH → Na₂ZnO₂ + H₂↑",
      "Zn + CuSO₄ → ZnSO₄ + Cu↓"
    ]
  },
  "Ga": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Solid_gallium_%28Ga%29.jpg",
    "imgTitle": "Solid gallium, fresh and after some time (2 months) at room temperature",
    "block": "p",
    "cpk": "#c28f8f",
    "melt": 302.9,
    "boil": 2673,
    "ie": 579,
    "ea": 41,
    "density": 5.91,
    "appearance": "silver-white",
    "crystal": "bcc"
  },
  "Ge": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/0/08/Polycrystalline-germanium.jpg",
    "imgTitle": "12 Grams Polycrystalline Germanium, 2*3 cm",
    "block": "p",
    "cpk": "#668f8f",
    "melt": 1211.4,
    "boil": 3106,
    "ie": 762,
    "ea": 118.9,
    "density": 5.323,
    "appearance": "grayish-white",
    "crystal": "diamond"
  },
  "As": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Arsenic_%2833_As%29.jpg",
    "imgTitle": "Ultrapure Metallic Arsenic under Argon, 1 - 2 grams. Original size of each piece in cm: 0.5 x 1",
    "block": "p",
    "cpk": "#bd80e3",
    "melt": 887,
    "boil": 887,
    "ie": 947,
    "ea": 77.7,
    "density": 5.727,
    "appearance": "metallic grey",
    "crystal": "bcc",
    "flame": {
      "color": "#60a5fa",
      "glow": "#bfdbfe",
      "label": "Xanh lam nhạt"
    }
  },
  "Se": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/7/7f/Selenium.jpg",
    "imgTitle": "Ultrapure Black, Amorphous Selenium, 3 - 4 grams. Original size in cm: 2",
    "block": "p",
    "cpk": "#ffa100",
    "melt": 494,
    "boil": 958,
    "ie": 941,
    "ea": 195,
    "density": 4.81,
    "appearance": "black, red, and gray (not pictured) allotropes",
    "crystal": "bcc",
    "flame": {
      "color": "#3b82f6",
      "glow": "#93c5fd",
      "label": "Xanh da trời"
    }
  },
  "Br": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/8/87/Bromine-ampoule.jpg",
    "imgTitle": "99.5 % pure liquid Bromine in a 4 x 1 cm big glass ampoule, cast in acrylic",
    "block": "p",
    "cpk": "#a62929",
    "melt": 265.8,
    "boil": 332,
    "ie": 1140,
    "ea": 324.5,
    "density": 3.103,
    "appearance": "",
    "crystal": "diatomic",
    "spectrum": [
      447,
      470,
      478,
      533,
      614,
      635
    ]
  },
  "Kr": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Krypton-glow.jpg",
    "imgTitle": "Vial of Glowing Ultrapure Krypton. Original size in cm: 1 x 5.",
    "block": "p",
    "cpk": "#5cb8d1",
    "melt": 115.8,
    "boil": 119.9,
    "ie": 1351,
    "ea": -96,
    "density": 3.749,
    "appearance": "colorless gas, exhibiting a whitish glow in a high electric field",
    "crystal": "monatomic",
    "spectrum": [
      427,
      431,
      450,
      557,
      587,
      645
    ]
  },
  "Rb": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Rb5.JPG",
    "imgTitle": "Rubidium Metal Sample",
    "block": "s",
    "cpk": "#702eb0",
    "melt": 312.5,
    "boil": 961,
    "ie": 403,
    "ea": 46.9,
    "density": 1.532,
    "appearance": "grey white",
    "crystal": "bcc",
    "flame": {
      "color": "#c026d3",
      "glow": "#f5d0fe",
      "label": "Đỏ tím"
    }
  },
  "Sr": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/8/84/Strontium-1.jpg",
    "imgTitle": "Strontium Pieces under Paraffin Oil.",
    "block": "s",
    "cpk": "#00ff00",
    "melt": 1050,
    "boil": 1650,
    "ie": 550,
    "ea": 5,
    "density": 2.64,
    "appearance": "",
    "crystal": "fcc",
    "flame": {
      "color": "#e11d48",
      "glow": "#fecdd3",
      "label": "Đỏ son rực rỡ"
    },
    "spectrum": [
      407,
      421,
      460,
      496,
      640,
      687
    ]
  },
  "Y": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/9/90/Piece_of_Yttrium.jpg",
    "imgTitle": "6,21g Yttrium, Reinheit mindestens 99%.",
    "block": "d",
    "cpk": "#94ffff",
    "melt": 1799,
    "boil": 3203,
    "ie": 600,
    "ea": 29.6,
    "density": 4.472,
    "appearance": "silvery white",
    "crystal": "hcp"
  },
  "Zr": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Zirconium-pieces.jpg",
    "imgTitle": "Two pieces of Zirconium, 1 cm each.",
    "block": "d",
    "cpk": "#94e0e0",
    "melt": 2128,
    "boil": 4650,
    "ie": 640,
    "ea": 41.8,
    "density": 6.52,
    "appearance": "silvery white",
    "crystal": "hcp"
  },
  "Nb": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Niobium_strips.JPG",
    "imgTitle": "Niobium strips",
    "block": "d",
    "cpk": "#73c2c9",
    "melt": 2750,
    "boil": 5017,
    "ie": 652,
    "ea": 88.5,
    "density": 8.57,
    "appearance": "gray metallic, bluish when oxidized",
    "crystal": "bcc"
  },
  "Mo": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/f/f0/Molybdenum.jpg",
    "imgTitle": "99.9 Pure Molybdenum Crystal, about 2 x 3 cm, with anodisation color",
    "block": "d",
    "cpk": "#54b5b5",
    "melt": 2896,
    "boil": 4912,
    "ie": 684,
    "ea": 72.1,
    "density": 10.28,
    "appearance": "gray metallic",
    "crystal": "bcc"
  },
  "Tc": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Technetium-sample-cropped.jpg",
    "imgTitle": "Technetium Sample inside a sealed glass ampoule, filled with argon gas. 6x1 mm goldfoil covered with 99Tc powder (electroplated).",
    "block": "d",
    "cpk": "#3b9e9e",
    "melt": 2430,
    "boil": 4538,
    "ie": 702,
    "ea": 53,
    "density": 11,
    "appearance": "shiny gray metal",
    "crystal": "fcc"
  },
  "Ru": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Ruthenium_crystal.jpg",
    "imgTitle": "Ruthenium Crystal, 0.6 grams, 0.6 x 1.3 cm size",
    "block": "d",
    "cpk": "#248f8f",
    "melt": 2607,
    "boil": 4423,
    "ie": 710,
    "ea": 101,
    "density": 12.45,
    "appearance": "silvery white metallic",
    "crystal": "hcp"
  },
  "Rh": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/54/Rhodium_%28Rh%29.jpg",
    "imgTitle": "Pure Rhodium Bead, 1 gram. Original size in cm: 0.5",
    "block": "d",
    "cpk": "#0a7d8c",
    "melt": 2237,
    "boil": 3968,
    "ie": 720,
    "ea": 110.3,
    "density": 12.41,
    "appearance": "silvery white metallic",
    "crystal": "fcc"
  },
  "Pd": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Palladium_%2846_Pd%29.jpg",
    "imgTitle": "Palladium Crystal, about 1 gram. Original size in cm: 0.5 x 1",
    "block": "d",
    "cpk": "#006985",
    "melt": 1828.1,
    "boil": 3236,
    "ie": 804,
    "ea": 54.2,
    "density": 12.023,
    "appearance": "silvery white",
    "crystal": "fcc"
  },
  "Ag": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Silver-nugget.jpg",
    "imgTitle": "Natural silver nugget, 1 cm long.",
    "block": "d",
    "cpk": "#c0c0c0",
    "melt": 1234.9,
    "boil": 2435,
    "ie": 731,
    "ea": 125.9,
    "density": 10.49,
    "appearance": "lustrous white metal",
    "crystal": "fcc",
    "spectrum": [
      405,
      421,
      520,
      546
    ],
    "examples": [
      "Kim loại dẫn điện & dẫn nhiệt tốt nhất trong tất cả các nguyên tố",
      "Tráng gương soi (phản ứng tráng bạc) & trang sức cao cấp",
      "Nano bạc kháng khuẩn trong y tế & máy lọc nước"
    ],
    "reactions": [
      "3Ag + 4HNO₃(loãng) → 3AgNO₃ + NO↑ + 2H₂O",
      "Ag⁺ + Cl⁻ → AgCl↓ (kết tủa trắng)"
    ]
  },
  "Cd": {
    "img": "https://images-of-elements.com/cadmium-4.jpg",
    "imgTitle": "48 Cd Cadmium",
    "block": "d",
    "cpk": "#ffd98f",
    "melt": 594.2,
    "boil": 1040,
    "ie": 868,
    "ea": -68,
    "density": 8.65,
    "appearance": "silvery bluish-gray metallic",
    "crystal": "hcp"
  },
  "In": {
    "img": "https://images-of-elements.com/indium-2.jpg",
    "imgTitle": "1.5 x 1.5 cm liquid indium",
    "block": "p",
    "cpk": "#a67573",
    "melt": 429.7,
    "boil": 2345,
    "ie": 558,
    "ea": 37,
    "density": 7.31,
    "appearance": "silvery lustrous gray",
    "crystal": "bcc",
    "flame": {
      "color": "#6366f1",
      "glow": "#c7d2fe",
      "label": "Chàm tím (Indigo)"
    }
  },
  "Sn": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Tin-2.jpg",
    "imgTitle": "Tin blob",
    "block": "p",
    "cpk": "#668080",
    "melt": 505.1,
    "boil": 2875,
    "ie": 709,
    "ea": 107.3,
    "density": 7.365,
    "appearance": "silvery-white (beta, β) or gray (alpha, α)",
    "crystal": "bcc",
    "spectrum": [
      452,
      563,
      645
    ]
  },
  "Sb": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Antimony-4.jpg",
    "imgTitle": "Antimony crystal, 2 grams, 1 cm",
    "block": "p",
    "cpk": "#9e63b5",
    "melt": 903.8,
    "boil": 1908,
    "ie": 834,
    "ea": 101.1,
    "density": 6.697,
    "appearance": "silvery lustrous gray",
    "crystal": "bcc",
    "flame": {
      "color": "#67e8f9",
      "glow": "#cffafe",
      "label": "Xanh lục nhạt"
    }
  },
  "Te": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Tellurium2.jpg",
    "imgTitle": "Metallic tellurium, diameter 3.5 cm",
    "block": "p",
    "cpk": "#d47a00",
    "melt": 722.7,
    "boil": 1261,
    "ie": 869,
    "ea": 190.2,
    "density": 6.24,
    "appearance": "",
    "crystal": "bcc"
  },
  "I": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Iodine-sample.jpg",
    "imgTitle": "Iodine Sample",
    "block": "p",
    "cpk": "#940094",
    "melt": 386.9,
    "boil": 457.4,
    "ie": 1008,
    "ea": 295.2,
    "density": 4.933,
    "appearance": "lustrous metallic gray, violet as a gas",
    "crystal": "diatomic",
    "spectrum": [
      467,
      516,
      546,
      571,
      608
    ],
    "examples": [
      "Muối i-ốt bổ sung phòng bệnh bướu cổ",
      "Cồn i-ốt sát trùng vết thương ngoài da",
      "Thuốc thử hồ tinh bột chuyển màu xanh tím đặc trưng"
    ],
    "reactions": [
      "I₂ + hồ tinh bột → phức màu xanh tím",
      "H₂ + I₂ ⇌ 2HI (t°)"
    ]
  },
  "Xe": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/5d/Xenon-glow.jpg",
    "imgTitle": "Vial of glowing ultrapure xenon. Original size in cm: 1 x 5",
    "block": "p",
    "cpk": "#429eb0",
    "melt": 161.4,
    "boil": 165.1,
    "ie": 1170,
    "ea": -77,
    "density": 5.894,
    "appearance": "colorless gas, exhibiting a blue glow when placed in a high voltage electric field",
    "crystal": "monatomic",
    "spectrum": [
      450,
      462,
      467,
      484,
      529,
      618,
      687
    ]
  },
  "Cs": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Cesium.jpg",
    "imgTitle": "Cesium/Caesium metal",
    "block": "s",
    "cpk": "#57178f",
    "melt": 301.7,
    "boil": 944,
    "ie": 376,
    "ea": 45.5,
    "density": 1.93,
    "appearance": "silvery gold",
    "crystal": "bcc",
    "flame": {
      "color": "#38bdf8",
      "glow": "#bae6fd",
      "label": "Xanh lam sáng"
    },
    "spectrum": [
      455,
      459,
      601,
      621,
      672,
      697
    ]
  },
  "Ba": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/f/f5/Barium_%2856_Ba%29.jpg",
    "imgTitle": "1.5 Grams Barium with a Grey Oxide Layer under Argon. Original size in cm: 0.7 x 1",
    "block": "s",
    "cpk": "#00c900",
    "melt": 1000,
    "boil": 2118,
    "ie": 503,
    "ea": 14,
    "density": 3.51,
    "appearance": "",
    "crystal": "bcc",
    "flame": {
      "color": "#22c55e",
      "glow": "#bbf7d0",
      "label": "Xanh lục vàng (Táo)"
    },
    "spectrum": [
      455,
      493,
      553,
      577,
      614,
      649
    ]
  },
  "La": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/f/f7/Lanthanum.jpg",
    "imgTitle": "1 cm Big Piece of Pure Lanthanum",
    "block": "f",
    "cpk": "#70d4ff",
    "melt": 1193,
    "boil": 3737,
    "ie": 538,
    "ea": 53,
    "density": 6.162,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Ce": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/0/0d/Cerium2.jpg",
    "imgTitle": "Ultrapure Cerium under Argon, 1.5 grams. Original size in cm: 1 x 1",
    "block": "f",
    "cpk": "#ffffc7",
    "melt": 1068,
    "boil": 3716,
    "ie": 534,
    "ea": 55,
    "density": 6.77,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Pr": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/c/c7/Praseodymium.jpg",
    "imgTitle": "1.5 Grams Praseodymium under Argon, 0.5 cm big pieces",
    "block": "f",
    "cpk": "#d9ffc7",
    "melt": 1208,
    "boil": 3403,
    "ie": 527,
    "ea": 93,
    "density": 6.77,
    "appearance": "grayish white",
    "crystal": "bcc"
  },
  "Nd": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Neodymium_%2860_Nd%29.jpg",
    "imgTitle": "Ultrapure Neodymium under Argon, 5 grams. Original length of the large piece in cm: 1",
    "block": "f",
    "cpk": "#c7ffc7",
    "melt": 1297,
    "boil": 3347,
    "ie": 533,
    "ea": 184.9,
    "density": 7.01,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Pm": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/5b/Promethium.jpg",
    "imgTitle": "Photomontage of what promethium metal might look like (it is too radioactive and real images are not available)",
    "block": "f",
    "cpk": "#a3ffc7",
    "melt": 1315,
    "boil": 3273,
    "ie": 540,
    "ea": 12.5,
    "density": 7.26,
    "appearance": "metallic",
    "crystal": "bcc"
  },
  "Sm": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/8/88/Samarium-2.jpg",
    "imgTitle": "Ultrapure Sublimated Samarium, 2 grams. Original size in cm: 0.8 x 1.5",
    "block": "f",
    "cpk": "#8fffc7",
    "melt": 1345,
    "boil": 2173,
    "ie": 545,
    "ea": 15.6,
    "density": 7.52,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Eu": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Europium.jpg",
    "imgTitle": "Weakly Oxidized Europium, hence slightly yellowish. 1.5 grams, large piece 0.6 x 1.6 cm.",
    "block": "f",
    "cpk": "#61ffc7",
    "melt": 1099,
    "boil": 1802,
    "ie": 547,
    "ea": 11.2,
    "density": 5.264,
    "appearance": "",
    "crystal": "bcc"
  },
  "Gd": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Gadolinium-2.jpg",
    "imgTitle": "Pure (99.95%) Amorphous Gadolinium, about 12 grams, 2 × 1.5 × 0.5 cm, cast in acrylic glass",
    "block": "f",
    "cpk": "#45ffc7",
    "melt": 1585,
    "boil": 3273,
    "ie": 593,
    "ea": 13.2,
    "density": 7.9,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Tb": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Terbium-2.jpg",
    "imgTitle": "Pure Terbium, 3 grams. Original size: 1 cm",
    "block": "f",
    "cpk": "#30ffc7",
    "melt": 1629,
    "boil": 3396,
    "ie": 566,
    "ea": 112.4,
    "density": 8.23,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Dy": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/55/Dysprosium-2.jpg",
    "imgTitle": "Pure Dysprosium Dendrites",
    "block": "f",
    "cpk": "#1fffc7",
    "melt": 1680,
    "boil": 2840,
    "ie": 573,
    "ea": 34,
    "density": 8.54,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Ho": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Holmium2.jpg",
    "imgTitle": "Ultrapure Holmium, 17 grams. Original size in cm: 1.5 x 2.5",
    "block": "f",
    "cpk": "#00ff9c",
    "melt": 1734,
    "boil": 2873,
    "ie": 581,
    "ea": 32.6,
    "density": 8.79,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Er": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Erbium-2.jpg",
    "imgTitle": "9.5 Gramms Pure Erbium, 2 x 2 cm",
    "block": "f",
    "cpk": "#00e675",
    "melt": 1802,
    "boil": 3141,
    "ie": 589,
    "ea": 30.1,
    "density": 9.066,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Tm": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Thulium-2.jpg",
    "imgTitle": "Ultrapure (99.997%) Crystalline Thulium, 22.3 grams, 3 × 3 × 2 cm in size",
    "block": "f",
    "cpk": "#00d452",
    "melt": 1818,
    "boil": 2223,
    "ie": 597,
    "ea": 99,
    "density": 9.32,
    "appearance": "silvery gray",
    "crystal": "bcc"
  },
  "Yb": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Ytterbium-3.jpg",
    "imgTitle": "Ytterbium, 0.5 x 1 cm",
    "block": "f",
    "cpk": "#00bf38",
    "melt": 1097,
    "boil": 1469,
    "ie": 603,
    "ea": -1.9,
    "density": 6.9,
    "appearance": "",
    "crystal": "bcc"
  },
  "Lu": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Lutetium.jpg",
    "imgTitle": "1 cm Big Piece of Pure Lutetium",
    "block": "d",
    "cpk": "#00ab24",
    "melt": 1925,
    "boil": 3675,
    "ie": 524,
    "ea": 33.4,
    "density": 9.841,
    "appearance": "silvery white",
    "crystal": "fcc"
  },
  "Hf": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/1/17/Hafnium_%2872_Hf%29.jpg",
    "imgTitle": "Electrolytic Hafnium, 22 grams. Original size in cm: 1 x 2 x 3",
    "block": "d",
    "cpk": "#4dc2ff",
    "melt": 2506,
    "boil": 4876,
    "ie": 659,
    "ea": 17.2,
    "density": 13.31,
    "appearance": "steel gray",
    "crystal": "hcp"
  },
  "Ta": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/61/Tantalum.jpg",
    "imgTitle": "Piece of tantalum, 1 cm in size",
    "block": "d",
    "cpk": "#4da6ff",
    "melt": 3290,
    "boil": 5731,
    "ie": 761,
    "ea": 31,
    "density": 16.69,
    "appearance": "gray blue",
    "crystal": "bcc"
  },
  "W": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Tungsten_rod_with_oxidised_surface.jpg",
    "imgTitle": "Tungsten rod with oxidised surface, 80 grams. Original size in cm: 1.3 x 3",
    "block": "d",
    "cpk": "#2194d6",
    "melt": 3695,
    "boil": 6203,
    "ie": 770,
    "ea": 78.8,
    "density": 19.25,
    "appearance": "grayish white, lustrous",
    "crystal": "bcc",
    "spectrum": [
      400,
      429,
      465,
      505,
      551
    ],
    "examples": [
      "Kim loại có nhiệt độ nóng chảy cao nhất (3422°C)",
      "Dây tóc bóng đèn sợi đốt & điện cực hàn TIG",
      "Cacbua vonfram (WC) làm mũi khoan siêu cứng"
    ],
    "reactions": [
      "2W + 3O₂ → 2WO₃ (t° cao)"
    ]
  },
  "Re": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/d/d9/Pure_rhenium_bead%2C_arc_melted%2C_21_grams._Original_size_in_cm_-_1.5_x_1.7.jpg",
    "imgTitle": "Pure Rhenium Bead, arc melted, 21 grams. Original size in cm: 1.5 x 1.7. Measured radiation dose <0.05 μS/h.",
    "block": "d",
    "cpk": "#267dab",
    "melt": 3459,
    "boil": 5869,
    "ie": 760,
    "ea": 5.8,
    "density": 21.02,
    "appearance": "silvery-grayish",
    "crystal": "hcp"
  },
  "Os": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/3/3c/Osmium-bead.jpg",
    "imgTitle": "Pure Osmium Bead",
    "block": "d",
    "cpk": "#266696",
    "melt": 3306,
    "boil": 5285,
    "ie": 840,
    "ea": 104,
    "density": 22.59,
    "appearance": "silvery, blue cast",
    "crystal": "hcp"
  },
  "Ir": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Iridium-2.jpg",
    "imgTitle": "Pieces of Pure Iridium, 1 gram. Original size: 0.1 - 0.3 cm each",
    "block": "d",
    "cpk": "#175487",
    "melt": 2719,
    "boil": 4403,
    "ie": 880,
    "ea": 150.9,
    "density": 22.56,
    "appearance": "silvery white",
    "crystal": "fcc"
  },
  "Pt": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/68/Platinum_crystals.jpg",
    "imgTitle": "Crystals of Pure Platinum grown by gas phase transport",
    "block": "d",
    "cpk": "#d0d0e0",
    "melt": 2041.4,
    "boil": 4098,
    "ie": 870,
    "ea": 205,
    "density": 21.45,
    "appearance": "silvery white",
    "crystal": "fcc",
    "spectrum": [
      444,
      505,
      530,
      547
    ]
  },
  "Au": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Gold_%2879_Au%29.jpg",
    "imgTitle": "Ultrapure Gold Leaf",
    "block": "d",
    "cpk": "#ffd123",
    "melt": 1337.3,
    "boil": 3243,
    "ie": 890,
    "ea": 222.7,
    "density": 19.3,
    "appearance": "metallic yellow",
    "crystal": "fcc",
    "spectrum": [
      406,
      479,
      523,
      583,
      627
    ],
    "examples": [
      "Trang sức, tích trữ tài sản & dự trữ ngoại hối",
      "Mạ chân tiếp xúc vi mạch điện tử siêu bền không oxi hóa",
      "Màng vàng phản xạ bức xạ nhiệt trên kính mũ phi hành gia"
    ],
    "reactions": [
      "Không tan trong axit thường; tan trong nước cường toan (HCl : HNO₃ = 3:1): Au + HNO₃ + 4HCl → H[AuCl₄] + NO↑ + 2H₂O"
    ]
  },
  "Hg": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/b/be/Hydrargyrum_%2880_Hg%29.jpg",
    "imgTitle": "6 grams pure mercury. Diameter of the inner disc: 2 cm",
    "block": "d",
    "cpk": "#b8b8d0",
    "melt": 234.3,
    "boil": 629.9,
    "ie": 1007,
    "ea": -48,
    "density": 13.534,
    "appearance": "silvery",
    "crystal": "fcc",
    "spectrum": [
      404,
      435,
      546,
      577,
      579
    ],
    "examples": [
      "Kim loại duy nhất ở thể lỏng ở nhiệt độ phòng (-38.8°C)",
      "Nhiệt kế, áp kế thủy ngân & đèn huỳnh quang (đang thay thế bằng LED)",
      "Tạo hỗn hống trong nha khoa & tách vàng"
    ],
    "reactions": [
      "Hg + S → HgS (phản ứng khử độc thủy ngân ngay nhiệt độ thường)"
    ]
  },
  "Tl": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/55/Thallium_%2881_Tl%29.jpg",
    "imgTitle": "8 grams pure thallium under argon. Original size in cm: 0.7 x 1.5",
    "block": "p",
    "cpk": "#a6544d",
    "melt": 577,
    "boil": 1746,
    "ie": 589,
    "ea": 36.4,
    "density": 11.85,
    "appearance": "silvery white",
    "crystal": "bcc",
    "flame": {
      "color": "#10b981",
      "glow": "#a7f3d0",
      "label": "Lục bảo"
    }
  },
  "Pb": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/6/63/Lead-2.jpg",
    "imgTitle": "Ultrapure Lead Bead from two sides. Original size in cm: 1.5 x 2",
    "block": "p",
    "cpk": "#575961",
    "melt": 600.6,
    "boil": 2022,
    "ie": 716,
    "ea": 34.4,
    "density": 11.34,
    "appearance": "metallic gray",
    "crystal": "fcc",
    "flame": {
      "color": "#93c5fd",
      "glow": "#dbeafe",
      "label": "Xanh trắng nhạt"
    },
    "spectrum": [
      405,
      500,
      560,
      600,
      665
    ]
  },
  "Bi": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Bismuth-2.jpg",
    "imgTitle": "Bismuth Crystal",
    "block": "p",
    "cpk": "#9e4fb5",
    "melt": 544.7,
    "boil": 1837,
    "ie": 703,
    "ea": 90.9,
    "density": 9.78,
    "appearance": "lustrous silver",
    "crystal": "bcc"
  },
  "Po": {
    "img": "https://images-of-elements.com/polonium.jpg",
    "imgTitle": "This is only an illustration, not polonium itself. A silvery, radioactive metal, producing so much heat that it gets liquid and ionizes the surrounding air",
    "block": "p",
    "cpk": "#ab5c00",
    "melt": 527,
    "boil": 1235,
    "ie": 812,
    "ea": 136,
    "density": 9.196,
    "appearance": "silvery",
    "crystal": "bcc"
  },
  "At": {
    "img": "https://images-of-elements.com/astatine.jpg",
    "imgTitle": "This is only an illustration, not astatine itself. Crystals similar to iodine, but darker in color than these, which due to the extreme radioactivity glow blue and evaporate to dark purple gas",
    "block": "p",
    "cpk": "#754f45",
    "melt": 575,
    "boil": 610,
    "ie": 899,
    "ea": 233,
    "density": 6.35,
    "appearance": "unknown, probably metallic",
    "crystal": "bcc"
  },
  "Rn": {
    "img": "https://images-of-elements.com/radon.jpg",
    "imgTitle": "This is only an illustration, not radon itself. Radon is said to glow red in discharge tubes, although it practically is never used for this, due to its strong radioactivity.",
    "block": "p",
    "cpk": "#428296",
    "melt": 202,
    "boil": 211.5,
    "ie": 1037,
    "ea": -68,
    "density": 9.73,
    "appearance": "colorless gas, occasionally glows green or red in discharge tubes",
    "crystal": "monatomic"
  },
  "Fr": {
    "img": "https://images-of-elements.com/francium.jpg",
    "imgTitle": "This is only an illustration, not francium itself.",
    "block": "s",
    "cpk": "#420066",
    "melt": 300,
    "boil": 950,
    "ie": 380,
    "ea": 46.9,
    "density": 1.87,
    "appearance": "",
    "crystal": "bcc"
  },
  "Ra": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/b/bb/Radium226.jpg",
    "imgTitle": "Radium electroplated on a very small sample of copper foil and covered with polyurethane to prevent reaction with the air",
    "block": "s",
    "cpk": "#007d00",
    "melt": 1233,
    "boil": 2010,
    "ie": 509,
    "ea": 9.6,
    "density": 5.5,
    "appearance": "silvery white metallic",
    "crystal": "bcc"
  },
  "Ac": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/2/27/Actinium_sample_%2831481701837%29.png",
    "imgTitle": "Actinium-225 medical radioisotope held in a v-vial at ORNL. The blue glow comes from the ionization of surrounding air by alpha particles",
    "block": "f",
    "cpk": "#70abfa",
    "melt": 1500,
    "boil": 3500,
    "ie": 499,
    "ea": 33.8,
    "density": 10,
    "appearance": "",
    "crystal": "bcc"
  },
  "Th": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/f/f7/Thorium-1.jpg",
    "imgTitle": "Thorium Metal in Ampoule, corroded",
    "block": "f",
    "cpk": "#00baff",
    "melt": 2023,
    "boil": 5061,
    "ie": 587,
    "ea": 112.7,
    "density": 11.724,
    "appearance": "silvery, often with black tarnish",
    "crystal": "bcc"
  },
  "Pa": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/a/af/Protactinium-233.jpg",
    "imgTitle": "This sample of Protactinium-233 (dark circular area in the photo) was photographed in the light from its own radioactive emission (the lighter area) at the National Reactor Testing Station in Idaho.",
    "block": "f",
    "cpk": "#00a1ff",
    "melt": 1841,
    "boil": 4300,
    "ie": 568,
    "ea": 53,
    "density": 15.37,
    "appearance": "bright, silvery metallic luster",
    "crystal": "bcc"
  },
  "U": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/b/b2/Ames_Process_uranium_biscuit.jpg",
    "imgTitle": "A biscuit of uranium metal after reduction via the Ames Process. c.1943.",
    "block": "f",
    "cpk": "#008fff",
    "melt": 1405.3,
    "boil": 4404,
    "ie": 598,
    "ea": 50.9,
    "density": 19.1,
    "appearance": "",
    "crystal": "bcc",
    "examples": [
      "Nhiên liệu phân hạch (²³⁵U) trong nhà máy điện hạt nhân",
      "Định tuổi địa chất của đá cổ đại (chu kỳ bán rã 4.5 tỷ năm)"
    ],
    "reactions": [
      "²³⁵U + ¹n → ⁹²Kr + ¹⁴¹Ba + 3¹n + Năng lượng (~200 MeV)"
    ]
  },
  "Np": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Neptunium2.jpg",
    "imgTitle": "Neptunium 237 sphere (6 kg)",
    "block": "f",
    "cpk": "#0080ff",
    "melt": 912,
    "boil": 4447,
    "ie": 605,
    "ea": 45.9,
    "density": 20.45,
    "appearance": "silvery metallic",
    "crystal": "bcc"
  },
  "Pu": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Plutonium_ring.jpg",
    "imgTitle": "Plutonium Ring",
    "block": "f",
    "cpk": "#006bff",
    "melt": 912.5,
    "boil": 3505,
    "ie": 585,
    "ea": -48.3,
    "density": 19.816,
    "appearance": "silvery white, tarnishing to dark gray in air",
    "crystal": "bcc"
  },
  "Am": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/e/ee/Americium_microscope.jpg",
    "imgTitle": "A small disc of Am-241 under the microscope.",
    "block": "f",
    "cpk": "#545cf2",
    "melt": 1449,
    "boil": 2880,
    "ie": 578,
    "ea": 9.9,
    "density": 12,
    "appearance": "silvery white",
    "crystal": "bcc"
  },
  "Cm": {
    "img": "https://images-of-elements.com/s/curium-glow.jpg",
    "imgTitle": "A piece of curium, which emitts strong radiation that makes it glow",
    "block": "f",
    "cpk": "#785ce3",
    "melt": 1613,
    "boil": 3383,
    "ie": 581,
    "ea": 27.2,
    "density": 13.51,
    "appearance": "silvery metallic, glows purple in the dark",
    "crystal": "bcc"
  },
  "Bk": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Berkelium.jpg",
    "imgTitle": "It took 250 days to make enough berkelium, shown here (in dissolved state), to synthesize element 117",
    "block": "f",
    "cpk": "#8a4fe3",
    "melt": 1259,
    "boil": 2900,
    "ie": 601,
    "ea": -165.2,
    "density": 14.78,
    "appearance": "silvery",
    "crystal": "bcc"
  },
  "Cf": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/9/93/Californium.jpg",
    "imgTitle": "A disc of californium metal (249Cf, 10 mg). The source implies that the disc has a diameter about twice the thickness of a typical pin, or on the order of 1 mm",
    "block": "f",
    "cpk": "#a136d4",
    "melt": 1173,
    "boil": 1743,
    "ie": 608,
    "ea": -97.3,
    "density": 15.1,
    "appearance": "silvery",
    "crystal": "bcc"
  },
  "Es": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/55/Einsteinium.jpg",
    "imgTitle": "300 micrograms of Einsteinium 253, which has a half-life of 20 days.",
    "block": "f",
    "cpk": "#b31fd4",
    "melt": 1133,
    "boil": 1269,
    "ie": 619,
    "ea": -28.6,
    "density": 8.84,
    "appearance": "silver-colored",
    "crystal": "bcc"
  },
  "Fm": {
    "img": "https://upload.wikimedia.org/wikipedia/commons/5/58/Ivy_Mike_-_mushroom_cloud.jpg",
    "imgTitle": "Fermium was first observed in the fallout from the Ivy Mike nuclear test.",
    "block": "f",
    "cpk": "#b31fba",
    "melt": 1800,
    "boil": null,
    "ie": 627,
    "ea": 34,
    "density": null,
    "appearance": "",
    "crystal": "bcc"
  },
  "Md": {
    "img": "https://images-of-elements.com/s/mendelevium.jpg",
    "imgTitle": "This is only an illustration, not mendelevium itself. Chemically similar to Thulium, the highly radioactive heavy metal emits very energetic α-radiation.",
    "block": "f",
    "cpk": "#b30da6",
    "melt": 1100,
    "boil": null,
    "ie": 635,
    "ea": 93.9,
    "density": null,
    "appearance": "",
    "crystal": "bcc"
  },
  "No": {
    "img": "https://images-of-elements.com/nobelium.jpg",
    "imgTitle": "This is only an illustration, not nobelium itself. Nobelium can only be made in very small amounts and emits strong radiation of various kinds.",
    "block": "f",
    "cpk": "#bd0d87",
    "melt": 1100,
    "boil": null,
    "ie": 642,
    "ea": -223.2,
    "density": null,
    "appearance": "",
    "crystal": "bcc"
  },
  "Lr": {
    "img": "https://images-of-elements.com/lawrencium.jpg",
    "imgTitle": "This is only an illustration, not lawrencium itself. Lawrencium can only be made in very small amounts and emits strong radiation",
    "block": "d",
    "cpk": "#c70066",
    "melt": 1900,
    "boil": null,
    "ie": 470,
    "ea": -30,
    "density": null,
    "appearance": "",
    "crystal": "fcc"
  },
  "Rf": {
    "img": "https://images-of-elements.com/s/rutherfordium.jpg",
    "imgTitle": "Decay traces in a spark chamber, not of rutherfordium, but of a pion. This is a completely different, unrelated particle, but the decay of rutherfordium would make streaks there, too.",
    "block": "d",
    "cpk": "#cc0059",
    "melt": 2400,
    "boil": 5800,
    "ie": 580,
    "ea": null,
    "density": 23.2,
    "appearance": "",
    "crystal": "fcc"
  },
  "Db": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "d",
    "cpk": "#d1004f",
    "melt": null,
    "boil": null,
    "ie": null,
    "ea": null,
    "density": 29.3,
    "appearance": "",
    "crystal": "fcc"
  },
  "Sg": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "d",
    "cpk": "#d90045",
    "melt": null,
    "boil": null,
    "ie": null,
    "ea": null,
    "density": 35,
    "appearance": "",
    "crystal": "fcc"
  },
  "Bh": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "d",
    "cpk": "#e00038",
    "melt": null,
    "boil": null,
    "ie": null,
    "ea": null,
    "density": 37.1,
    "appearance": "",
    "crystal": "fcc"
  },
  "Hs": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "d",
    "cpk": "#e6002e",
    "melt": null,
    "boil": null,
    "ie": null,
    "ea": null,
    "density": 40.7,
    "appearance": "",
    "crystal": "fcc"
  },
  "Mt": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "d",
    "cpk": "#eb0026",
    "melt": null,
    "boil": null,
    "ie": null,
    "ea": null,
    "density": 37.4,
    "appearance": "",
    "crystal": "fcc"
  },
  "Ds": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "d",
    "cpk": "",
    "melt": null,
    "boil": null,
    "ie": null,
    "ea": null,
    "density": 34.8,
    "appearance": "",
    "crystal": "fcc"
  },
  "Rg": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "d",
    "cpk": "",
    "melt": null,
    "boil": null,
    "ie": null,
    "ea": 151,
    "density": 28.7,
    "appearance": "",
    "crystal": "fcc"
  },
  "Cn": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "d",
    "cpk": "",
    "melt": 283,
    "boil": 340,
    "ie": null,
    "ea": null,
    "density": 14,
    "appearance": "",
    "crystal": "fcc"
  },
  "Nh": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "p",
    "cpk": "",
    "melt": 700,
    "boil": 1430,
    "ie": null,
    "ea": 66.6,
    "density": 16,
    "appearance": "",
    "crystal": "bcc"
  },
  "Fl": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "p",
    "cpk": "",
    "melt": 340,
    "boil": 420,
    "ie": null,
    "ea": null,
    "density": 14,
    "appearance": "",
    "crystal": "bcc"
  },
  "Mc": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "p",
    "cpk": "",
    "melt": 670,
    "boil": 1400,
    "ie": null,
    "ea": 35.3,
    "density": 13.5,
    "appearance": "",
    "crystal": "bcc"
  },
  "Lv": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "p",
    "cpk": "",
    "melt": 709,
    "boil": 1085,
    "ie": null,
    "ea": 74.9,
    "density": 12.9,
    "appearance": "",
    "crystal": "bcc"
  },
  "Ts": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "p",
    "cpk": "",
    "melt": 723,
    "boil": 883,
    "ie": null,
    "ea": 165.9,
    "density": 7.17,
    "appearance": "",
    "crystal": "bcc"
  },
  "Og": {
    "img": "https://images-of-elements.com/s/transactinoid.png",
    "imgTitle": "No Image Found",
    "block": "p",
    "cpk": "",
    "melt": null,
    "boil": 350,
    "ie": null,
    "ea": 5.4,
    "density": 4.95,
    "appearance": "",
    "crystal": "bcc"
  }
};

export function getElementMedia(symbol) {
  return ELEMENT_MEDIA[symbol] || null;
}

/**
 * Tính trạng thái vật chất (Rắn / Lỏng / Khí) tại nhiệt độ T (độ Kelvin)
 */
export function getStateAtTemp(el, tempK) {
  const m = el.meltingPoint;
  const b = el.boilingPoint;
  if (typeof b === 'number' && tempK >= b) return 'Khí';
  if (typeof m === 'number' && tempK >= m) {
    if (typeof b === 'number') return 'Lỏng';
    return el.stateAtRoomTemp === 'Khí' ? 'Khí' : 'Lỏng';
  }
  if (typeof m === 'number' && tempK < m) return 'Rắn';
  return el.stateAtRoomTemp || 'Rắn';
}

/**
 * Chuyển bước sóng ánh sáng khả kiến (380–750 nm) sang màu RGB chân thực cho Quang phổ phát xạ
 */
export function wavelengthToCss(wl) {
  let r = 0, g = 0, b = 0;
  if (wl >= 380 && wl < 440) { r = -(wl - 440) / (440 - 380); b = 1; }
  else if (wl >= 440 && wl < 490) { g = (wl - 440) / (490 - 440); b = 1; }
  else if (wl >= 490 && wl < 510) { g = 1; b = -(wl - 510) / (510 - 490); }
  else if (wl >= 510 && wl < 580) { r = (wl - 510) / (580 - 510); g = 1; }
  else if (wl >= 580 && wl < 645) { r = 1; g = -(wl - 645) / (645 - 580); }
  else if (wl >= 645 && wl <= 750) { r = 1; }
  const f = wl < 420 ? 0.35 + 0.65 * ((wl - 380) / 40) : wl > 700 ? 0.35 + 0.65 * ((750 - wl) / 50) : 1;
  return `rgb(${Math.round(r * f * 255)}, ${Math.round(g * f * 255)}, ${Math.round(b * f * 255)})`;
}

/**
 * Tạo dải vạch quang phổ phát xạ (nếu chưa có danh sách thủ công thì nội suy ổn định theo Z)
 */
export function getEmissionLines(el) {
  const m = ELEMENT_MEDIA[el.symbol];
  if (m?.spectrum?.length) return m.spectrum;
  const z = el.atomicNumber || 1;
  const count = Math.min(7, 3 + (z % 5));
  const lines = [];
  for (let i = 0; i < count; i++) {
    const wl = 405 + (((z * 47 + i * 73) % 305));
    lines.push(wl);
  }
  return [...new Set(lines)].sort((a, b) => a - b);
}

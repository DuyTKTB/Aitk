// ============================================================
// KHO TÀI LIỆU — lớp 10, 11, 12
// Sách SGK từ taphuan.nxbgd.vn — có link chi tiết + ảnh bìa thật
// ============================================================
export const PORTAL = 'https://taphuan.nxbgd.vn/tap-huan';

export const GRADES = [10, 11, 12];

export const SUBJECTS = [
  ['toan', 'Toán'], ['van', 'Ngữ văn'], ['anh', 'Tiếng Anh'], ['ly', 'Vật lí'],
  ['hoa', 'Hóa học'], ['sinh', 'Sinh học'], ['su', 'Lịch sử'], ['dia', 'Địa lí'],
  ['ktpl', 'GD Kinh tế & Pháp luật'], ['tin', 'Tin học'], ['cn', 'Công nghệ'],
  ['gdqp', 'GD Quốc phòng & An ninh'], ['hdtn', 'HĐ trải nghiệm'],
];
export const SUBJ = Object.fromEntries(SUBJECTS);

export const KINDS = {
  sgk: 'Sách giáo khoa', sbt: 'Sách bài tập', cd: 'Chuyên đề',
  lt: 'Lý thuyết', de: 'Đề thi', khac: 'Khác',
};

// ============================================================
// DỮ LIỆU SÁCH — tự động gộp từ taphuan.nxbgd.vn
// Cấu trúc: BOOKS[grade][subject] = [{ url, title, img }, ...]
// ============================================================
const BOOKS = {
  10: {
    toan: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/toan-10-tap-mot-939928460.939928460', title: 'Toán 10, tập một', img: 'https://cdn3.olm.vn/upload/img/0413/img_2026-04-13_69dc931d127d4.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/toan-10-tap-hai-940206149.940206149', title: 'Toán 10, tập hai', img: 'https://cdn3.olm.vn/upload/img/0413/img_2026-04-13_69dc9436cd2e0.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-toan-10-940099529.940099529', title: 'Chuyên đề học tập Toán 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d878cc38b77.jpg' },
    ],
    van: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/ngu-van-10-tap-mot-939855181.939855181', title: 'Ngữ văn 10, tập một', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8a112cc7c0.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/ngu-van-10-tap-hai-940208193.940208193', title: 'Ngữ văn 10, tập hai', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8a1cb74454.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-ngu-van-10-940069740.940069740', title: 'Chuyên đề học tập Ngữ văn 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8a24ca82f5.jpg' },
    ],
    anh: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tieng-anh-10-global-sucess-939960305.939960305', title: 'Tiếng Anh 10 - Global Success', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0514/page-000-1778747544634.jpg' },
    ],
    ly: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/vat-li-10-940250226.940250226', title: 'Vật lí 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8a7976969e.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-vat-li-10-939698356.939698356', title: 'Chuyên đề học tập Vật lí 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8a91995ad7.jpg' },
    ],
    hoa: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/hoa-hoc-10-940249942.940249942', title: 'Hóa học 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8ad646d67e.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-hoa-hoc-10-940182821.940182821', title: 'Chuyên đề học tập Hóa học 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8adfd7d1e3.jpg' },
    ],
    sinh: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/sinh-hoc-10-939773641.939773641', title: 'Sinh học 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8abeb57e52.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-sinh-hoc-10-940260695.940260695', title: 'Chuyên đề học tập Sinh học 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8acaa15090.jpg' },
    ],
    su: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/lich-su-10-940218902.940218902', title: 'Lịch sử 10', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0420/page-000-1776651338058.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-lich-su-10-940123123.940123123', title: 'Chuyên đề học tập Lịch sử 10', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0420/page-000-1776649591487.jpg' },
    ],
    dia: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/dia-li-10-939903840.939903840', title: 'Địa lí 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b264365c8.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-dia-li-10-939835301.939835301', title: 'Chuyên đề học tập Địa lí 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b35080255.jpg' },
    ],
    ktpl: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/giao-duc-kinh-te-va-phap-luat-10-940210584.940210584', title: 'Giáo dục Kinh tế và Pháp luật 10', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0420/page-000-1776655495617.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-giao-duc-kinh-te-va-phap-luat-10-940205968.940205968', title: 'Chuyên đề học tập GDKTPL 10', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0413/page-000-1776067989077.jpg' },
    ],
    tin: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tin-hoc-10-939917105.939917105', title: 'Tin học 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8795207d8d.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-tin-hoc-10-dinh-huong-tin-hoc-ung-dung-939740625.939740625', title: 'Chuyên đề Tin học 10 - Tin học ứng dụng', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d879f60c3ba.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-tin-hoc-10-dinh-huong-khoa-hoc-may-tinh-939818125.939818125', title: 'Chuyên đề Tin học 10 - Khoa học máy tính', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0421/page-000-1776757228224.jpg' },
    ],
    cn: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/cong-nghe-10-thiet-ke-va-cong-nghe-939889637.939889637', title: 'Công nghệ 10 - Thiết kế và công nghệ', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8aea6261c0.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/cong-nghe-10-cong-nghe-trong-trot-939898978.939898978', title: 'Công nghệ 10 - Công nghệ trồng trọt', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0413/page-000-1776067594544.jpg' },
    ],
    gdqp: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/giao-duc-quoc-phong-va-an-ninh-10-939849687.939849687', title: 'GD Quốc phòng và An ninh 10', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0519/01-1779156013210.jpg' },
    ],
    hdtn: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/hoat-dong-trai-nghiem-huong-nghiep-10-939844996.939844996', title: 'HĐ trải nghiệm, hướng nghiệp 10', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b3ec06939.jpg' },
    ],
  },
  11: {
    toan: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/toan-11-tap-mot-940143713.940143713', title: 'Toán 11, tập một', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b604993e0.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/toan-11-tap-hai-940052816.940052816', title: 'Toán 11, tập hai', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b677815e9.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-toan-11-939779555.939779555', title: 'Chuyên đề học tập Toán 11', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b6e94053c.jpg' },
    ],
    van: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/ngu-van-11-tap-mot-939696849.939696849', title: 'Ngữ văn 11, tập một', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b49d00e45.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/ngu-van-11-tap-hai-940224592.940224592', title: 'Ngữ văn 11, tập hai', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b529476f7.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-ngu-van-11-939848342.939848342', title: 'Chuyên đề học tập Ngữ văn 11', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b5a0618ce.jpg' },
    ],
    anh: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tieng-anh-11-global-success-940228791.940228791', title: 'Tiếng Anh 11 - Global Success', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0514/page-000-1778748224045.jpg' },
    ],
    ly: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/vat-li-11-940070814.940070814', title: 'Vật lí 11', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b7c84c586.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-vat-li-11-940209783.940209783', title: 'Chuyên đề học tập Vật lí 11', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b83db6736.jpg' },
    ],
    hoa: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/hoa-hoc-11-939753998.939753998', title: 'Hóa học 11', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b8964f7e6.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-hoa-hoc-11-940084277.940084277', title: 'Chuyên đề học tập Hóa học 11', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b917af581.jpg' },
    ],
    sinh: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/sinh-hoc-11-940163795.940163795', title: 'Sinh học 11', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8b97d3803b.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-sinh-hoc-11-939749912.939749912', title: 'Chuyên đề học tập Sinh học 11', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c20a04980.jpg' },
    ],
    su: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/lich-su-11-940006350.940006350', title: 'Lịch sử 11', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0414/page-000-1776151525034.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-lich-su-11-939762605.939762605', title: 'Chuyên đề học tập Lịch sử 11', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0414/page-000-1776151721756.jpg' },
    ],
    dia: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/dia-li-11-939832163.939832163', title: 'Địa lí 11', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0414/page-000-1776152258781.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-dia-li-11-940042929.940042929', title: 'Chuyên đề học tập Địa lí 11', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0414/page-000-1776150849793.jpg' },
    ],
    ktpl: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/giao-duc-kinh-te-va-phap-luat-11-940212818.940212818', title: 'GD Kinh tế và Pháp luật 11', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0414/page-000-1776153095049.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-giao-duc-kinh-te-va-phap-luat-11-940185429.940185429', title: 'Chuyên đề học tập GDKTPL 11', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0414/page-000-1776153242974.jpg' },
    ],
    tin: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tin-hoc-11-dinh-huong-khoa-hoc-may-tinh-940112895.940112895', title: 'Tin học 11 - Khoa học máy tính', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0422/page-000-1776851223081.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tin-hoc-11-dinh-huong-tin-hoc-ung-dung-939837310.939837310', title: 'Tin học 11 - Tin học ứng dụng', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c41b4afed.jpg' },
    ],
    cn: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/cong-nghe-11-cong-nghe-co-khi-940009956.940009956', title: 'Công nghệ 11 - Cơ khí', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c26baf323.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/cong-nghe-11-cong-nghe-chan-nuoi-939887395.939887395', title: 'Công nghệ 11 - Chăn nuôi', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c36125c94.jpg' },
    ],
    gdqp: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/giao-duc-quoc-phong-va-an-ninh-11-940030399.940030399', title: 'GD Quốc phòng và An ninh 11', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0519/01-1779155272531.jpg' },
    ],
    hdtn: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/hoat-dong-trai-nghiem-huong-nghiep-11-939822388.939822388', title: 'HĐ trải nghiệm, hướng nghiệp 11', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c547c1e76.jpg' },
    ],
  },
  12: {
    toan: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/toan-12-tap-mot-940203478.940203478', title: 'Toán 12, tập một', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c99f0d65e.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/toan-12-tap-hai-939795891.939795891', title: 'Toán 12, tập hai', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8ca4f3caa4.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-toan-12-939854222.939854222', title: 'Chuyên đề học tập Toán 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8cabb7c365.jpg' },
    ],
    van: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/ngu-van-12-tap-mot-940003905.940003905', title: 'Ngữ văn 12, tập một', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c6132b824.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/ngu-van-12-tap-hai-940165602.940165602', title: 'Ngữ văn 12, tập hai', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c69f4281d.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-ngu-van-12-939953722.939953722', title: 'Chuyên đề học tập Ngữ văn 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c716c88f0.jpg' },
    ],
    anh: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tieng-anh-12-global-success-939893521.939893521', title: 'Tiếng Anh 12 - Global Success', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0514/page-000-1778748058880.jpg' },
    ],
    ly: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/vat-li-12-940172299.940172299', title: 'Vật lí 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8cb1de2219.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-vat-li-12-939949567.939949567', title: 'Chuyên đề học tập Vật lí 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8cb8dc00ac.jpg' },
    ],
    hoa: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/hoa-hoc-12-939998682.939998682', title: 'Hóa học 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8cbe4e23dc.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-hoa-hoc-12-939901192.939901192', title: 'Chuyên đề học tập Hóa học 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8cc598e0b2.jpg' },
    ],
    sinh: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/sinh-hoc-12-939869678.939869678', title: 'Sinh học 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c7f8a7c86.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-sinh-hoc-12-939769795.939769795', title: 'Chuyên đề học tập Sinh học 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c8639a249.jpg' },
    ],
    su: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/lich-su-12-939853322.939853322', title: 'Lịch sử 12', img: 'https://cdn3.olm.vn/upload/img/0413/img_2026-04-13_69dc9572cec35.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-lich-su-12-939789696.939789696', title: 'Chuyên đề học tập Lịch sử 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c7971d46e.jpg' },
    ],
    dia: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/dia-li-12-939943182.939943182', title: 'Địa lí 12', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0507/page-000-1778119335647.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-dia-li-12-940188207.940188207', title: 'Chuyên đề học tập Địa lí 12', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0420/page-000-1776652010315.jpg' },
    ],
    ktpl: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/giao-duc-kinh-te-va-phap-luat-12-940058710.940058710', title: 'GD Kinh tế và Pháp luật 12', img: 'https://cdn3.olm.vn/upload/img/0413/img_2026-04-13_69dc968d2e07e.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/chuyen-de-hoc-tap-giao-duc-kinh-te-va-phap-luat-12-939931959.939931959', title: 'Chuyên đề học tập GDKTPL 12', img: 'https://cdn3.olm.vn/upload/img/0413/img_2026-04-13_69dc970dd8dac.jpg' },
    ],
    tin: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tin-hoc-12-dinh-huong-tin-hoc-ung-dung-939989296.939989296', title: 'Tin học 12 - Tin học ứng dụng', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0414/page-000-1776134366873.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tin-hoc-12-dinh-huong-khoa-hoc-may-tinh-939914108.939914108', title: 'Tin học 12 - Khoa học máy tính', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0422/01-page-1-1776824222731.jpg' },
    ],
    cn: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/cong-nghe-12-cong-nghe-dien-dien-tu-940164770.940164770', title: 'Công nghệ 12 - Điện - Điện tử', img: 'https://cdn3.olm.vn/upload/img/0413/img_2026-04-13_69dc97853ec4f.jpg' },
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/cong-nghe-12-lam-nghiep-thuy-san-939841541.939841541', title: 'Công nghệ 12 - Lâm nghiệp - Thủy sản', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8e3d2a8242.jpg' },
    ],
    gdqp: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/giao-duc-quoc-phong-va-an-ninh-12-940230101.940230101', title: 'GD Quốc phòng và An ninh 12', img: 'https://cdn3.olm.vn/upload/taphuan/2026/0519/01-1779155443545.jpg' },
    ],
    hdtn: [
      { url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/hoat-dong-trai-nghiem-huong-nghiep-12-939786149.939786149', title: 'HĐ trải nghiệm, hướng nghiệp 12', img: 'https://cdn3.olm.vn/upload/img/0410/img_2026-04-10_69d8c939ee12e.jpg' },
    ],
  },
};

// ============================================================
// PDF CỦA BẠN (giữ nguyên)
// ============================================================
export const LOCAL_DOCS = [];

// ============================================================
// TẠO SHELVES — mỗi lớp × môn = 1 thẻ, dùng ảnh bìa + link thật
// ============================================================
const SHELVES = GRADES.flatMap((g) =>
  SUBJECTS.map(([s, name]) => {
    const books = BOOKS[g]?.[s] || [];
    const firstBook = books[0];
    return {
      id: `sgk-${g}-${s}`,
      grade: g,
      subject: s,
      kind: 'sgk',
      title: `${name} ${g}`,
      sub: 'SGK và sách bổ trợ',
      url: firstBook?.url || PORTAL,
      img: firstBook?.img || '',
      books: books,
      source: 'NXB Giáo dục VN',
      hot: s === 'hoa',
    };
  })
);

export const DOCS = [
  ...LOCAL_DOCS.map((d) => ({ ...d, source: 'Tài liệu của bạn' })),
  ...SHELVES,
];

// Helper: đếm tổng sách
export const TOTAL_BOOKS = Object.values(BOOKS).reduce(
  (sum, grade) => sum + Object.values(grade).reduce((s, arr) => s + arr.length, 0),
  0
);
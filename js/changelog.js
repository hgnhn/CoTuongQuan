/* Cờ Tướng Quân — nhật ký cập nhật, hiển thị ở góc phải sảnh.
 * Mỗi lần cập nhật game: thêm một mục MỚI LÊN ĐẦU mảng (phiên bản mới nhất đứng đầu).
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});
  CTQ.CHANGELOG = [
    {
      v: '0.4.0', date: '14/11/2026', title: 'Bản mở rộng: Danh Tướng & Quân Sư',
      items: [
        'Thêm sảnh Bản mở rộng: mỗi đội hình có 1 Danh Tướng và 1 Quân Sư.',
        '14 Danh Tướng từ Đại Việt, Tam Quốc, Hy Lạp, La Mã, Châu Âu Trung Cổ, mỗi người 2–3 perk riêng.',
        '6 Quân Sư với nội tại cho cả bàn và chiêu chủ động (dùng 1 lần hoặc có hồi chiêu).',
        'Phòng chuẩn bị trước trận: có giờ đếm ngược để chỉnh đội hình, cả hai bấm Sẵn sàng thì đếm 3‑2‑1 vào trận.',
        '4 perk mới: Voi Giày (Tượng), Phá Trận (Xe), Hoả Công (Pháo), Hãn Mã (Mã). Mỗi loại quân giờ có 4 perk.',
        'Nhật ký cập nhật ở góc phải sảnh.',
      ],
    },
    {
      v: '0.3.0', date: '13/11/2026', title: 'Sửa lỗi link mời',
      items: [
        'Nhận diện trình duyệt bên trong Zalo, Messenger, Facebook và hướng dẫn mở bằng Chrome/Safari.',
        'Thông báo lỗi vào phòng rõ ràng hơn, thêm nút Thử lại.',
        'Sao chép link mời kèm luôn mã phòng để dự phòng.',
      ],
    },
    {
      v: '0.2.0', date: '08/11/2026', title: 'Cân bằng perk',
      items: [
        'Cân bằng perk qua 7 đợt AI tự đấu.',
        'Thay Pháo Bay bằng Pháo Chéo; Rút Lui bằng Liên Hoàn; Song Bộ bằng Kim Cương.',
        'AI biết giữ Tướng an toàn hơn.',
      ],
    },
    {
      v: '0.1.0', date: '07/11/2026', title: 'Ra mắt Cờ Tướng Quân',
      items: [
        'Cờ tướng với đội hình perk: mỗi loại quân chọn 1 perk.',
        'Đấu với máy (3 cấp), hai người một máy, chơi trực tuyến bằng mã phòng hoặc link mời.',
        'Đăng nhập trước khi chơi trực tuyến.',
      ],
    },
  ];
  CTQ.VERSION = CTQ.CHANGELOG[0].v;
})(typeof window !== 'undefined' ? window : globalThis);

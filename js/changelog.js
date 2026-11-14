/* Cờ Tướng Quân — nhật ký cập nhật, hiển thị ở góc phải sảnh.
 * Mỗi lần cập nhật game: thêm một mục MỚI LÊN ĐẦU mảng (phiên bản mới nhất đứng đầu).
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});
  CTQ.CHANGELOG = [
    {
      v: '0.5.0', date: '14/11/2026', title: 'Thông thạo: Ấn ký chiến công',
      items: [
        'Thêm thông thạo riêng cho 14 Danh Tướng và 6 Quân Sư, gồm 8 cấp huy hiệu phong cách sơn mài.',
        'Thắng trận và ăn quân nhận điểm; đấu máy nhận 50%. Điểm chỉ có tác dụng trang trí, không tăng sức mạnh.',
        'Thưởng thêm 10 điểm/quân bị hạ nhờ perk hoặc chiêu của nhân vật, gồm perk Quân Sư ban cho quân và Tử Sĩ của Lê Lai; hiện rõ phần thưởng ở kết quả trận.',
        'Trang Thông thạo có bộ sưu tập, tiến độ, bảng vinh danh trên thiết bị và thẻ để sao chép chia sẻ.',
        'Trang bị danh hiệu và khoe thông thạo trong trận trực tuyến. Kết quả trận hiển thị điểm nhận được và lên cấp.',
        'Chuẩn bị Firebase cho bảng xếp hạng chung từ các trận trực tuyến được hai bên xác nhận; hiện tiến trình lưu trên trình duyệt.',
      ],
    },
    {
      v: '0.4.2', date: '14/11/2026', title: 'Sửa tải bản cập nhật',
      items: [
        'Thêm mã phiên bản cho toàn bộ JavaScript và CSS để trình duyệt tải đúng bản mới sau deploy.',
        'Thêm nút Tải bản mới ở nhật ký cập nhật để tải lại trang và tài nguyên mới nhất.',
        'Bản này đã có Hoả Công giảm sức mạnh và Archimedes dùng Pháo Chéo + Song Ngòi.',
      ],
    },
    {
      v: '0.4.1', date: '14/11/2026', title: 'Cân bằng Hoả Công và Archimedes',
      items: [
        'Hoả Công: ô ngay sau mục tiêu vẫn thiêu mọi quân địch trừ Tướng; 2 ô bên chỉ thiêu Tốt, Sĩ, Tượng.',
        'Pháo chết khi ăn Tử Sĩ không còn kích hoạt Hoả Công. Miễn nhiễm Pháo vẫn chặn lửa.',
        'Archimedes đổi Hoả Công thành Song Ngòi, kết hợp với Pháo Chéo: ăn qua 1 hoặc 2 ngòi, giữ giới hạn chiếu Tướng.',
        'Cập nhật bàn minh hoạ. Trận trực tuyến yêu cầu cả hai bên dùng cùng phiên bản luật mới.',
      ],
    },
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

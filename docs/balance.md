# Nhật ký cân bằng perk

## Bản 0.4.1: giảm sức mạnh Hoả Công

- Giữ perk Hoả Công thay vì thay perk mới, áp dụng cho cả Pháo thường và Archimedes.
- Ô ngay sau mục tiêu vẫn thiêu mọi quân địch trừ Tướng; hai ô bên chỉ thiêu Tốt, Sĩ, Tượng, không còn thiêu Xe/Mã/Pháo.
- Pháo phải sống sau đòn ăn mới phát lửa: ăn Sĩ có Tử Sĩ thì Pháo chết và không gây sát thương lan.
- Sửa vị trí hai ô bên thành vuông góc với hướng bắn, kể cả đường chéo của Archimedes.
- Miễn nhiễm Pháo và Hộ Thể vẫn chặn sát thương lan; lửa không thiêu quân mình hay Tướng. Chiêu Mượn Gió Đông của Gia Cát Lượng không thay đổi.
- Mục tiêu: giữ khả năng trừng phạt đội hình tụ quân, giảm những đòn ăn lan nhiều quân chủ lực trong một lượt và cho Tử Sĩ khả năng chặn đòn nổ.
- Kiểm chứng bằng các thế cờ kiểm thử cho hướng bắn, loại quân, miễn nhiễm, Tử Sĩ và hoàn tác. Chưa có số liệu tự đấu mới; điểm Hoả Công 0.60 và Archimedes 0.71 phía dưới là của bản 0.4.0, không đại diện cho luật mới.

## Phương pháp

- **Nền tảng**: giá trị quân theo bảng truyền thống của cờ tướng (Xe 9, Pháo 4.5, Mã 4, Sĩ 2, Tượng 2, Tốt 1 → 2 khi qua sông). Pháo mạnh hơn ở đầu ván khi bàn đông quân, Mã mạnh dần về cuối ván khi bàn thoáng.
- **Đo độ cơ động**: lấy các thế cờ trung cuộc từ ván AI tự đấu, so số nước đi của mỗi quân khi có và không có perk.
- **Tự đấu**: AI có perk ở đúng một loại quân đấu với AI không perk, đổi màu luân phiên, khai cuộc ngẫu nhiên hoá. Điểm 0.5 = perk không tạo khác biệt.
- **Mục tiêu**: các perk *cùng loại quân* nên có điểm gần nhau (khoảng 0.6–0.75), để không có lựa chọn nào áp đảo. So sánh giữa các loại quân khác nhau không quan trọng bằng, vì người chơi nào cũng có đủ 7 perk.
- Lưu ý: 16–32 ván/perk vẫn còn nhiễu (sai số chuẩn khoảng ±0.09–0.12), nên chỉ xử lý những chênh lệch lớn.

## Đợt 1 (16 ván/perk, 40 ms/nước)

| Quân | Perk | Nước thêm/quân | Điểm |
|------|------|---------------:|-----:|
| Tướng | Bát Quái Bộ (chỉ đi theo đường chéo cung) | +0.03 | 0.50 |
| Tướng | Khinh Công | +0.46 | 0.66 |
| Tướng | Ngự Giá Thân Chinh (thêm 1 hàng) | +0.03 | 0.41 |
| Tướng | Kim Thiền Thoát Xác | +2.27 | 0.50 |
| Sĩ | Cận Vệ | +1.27 | 0.66 |
| Sĩ | Tuần Tra | +0.82 | 0.59 |
| Sĩ | Song Bộ | +0.46 | 0.50 |
| Sĩ | Tử Sĩ | 0 | 0.69 |
| Tượng | Vượt Giang | +0.07 | 0.41 |
| Tượng | Voi Chiến | +0.10 | 0.50 |
| Tượng | Tiểu Bộ | +2.32 | 0.72 |
| Xe | Thiết Giáp | 0 | 0.66 |
| Xe | Chiến Xa (chéo 1 ô, có ăn) | +2.28 | 0.88 |
| Xe | Pháo Xa (ngòi bất kỳ) | +0.51 | 0.84 |
| Pháo | Song Ngòi | +0.32 | 0.72 |
| Pháo | Cận Chiến | +0.34 | 0.63 |
| Pháo | Pháo Bay | +3.15 | 0.47 |
| Mã | Thiên Lý Mã | +0.88 | 0.69 |
| Mã | Chiến Mã (thẳng 1 ô, có ăn) | +2.93 | 0.88 |
| Mã | Ô Truy (nhảy dài không cản) | +4.06 | 0.97 |
| Tốt | Linh Hoạt | +1.25 | 0.72 |
| Tốt | Xung Phong | +0.78 | 0.59 |
| Tốt | Rút Lui | +0.14 | 0.44 |
| Tốt | Thăng Cấp (hàng cuối) | 0 | 0.41 |

### Điều chỉnh sau đợt 1

- **Bát Quái Bộ**: Tướng đứng ở giữa hàng cuối, không nằm trên đường chéo cung nên perk gần như không dùng được. Đổi thành đi chéo 1 ô bất kỳ trong cung.
- **Ngự Giá Thân Chinh**: cung mở rộng thành 4 × 5 ô (thêm 1 hàng và 1 cột mỗi bên).
- **Song Bộ** (yếu, trùng ý với Tuần Tra): thay bằng **Kim Cương**, Sĩ miễn nhiễm Pháo và Tốt.
- **Chiến Xa**, **Chiến Mã**: bước thêm chỉ được đi tới ô trống, không ăn quân.
- **Pháo Xa**: ngòi phải là quân mình.
- **Ô Truy**: bị cản nếu 2 ô thẳng đầu tiên có quân.
- **Rút Lui**: thay bằng **Liên Hoàn**, Tốt có Tốt mình đứng sát ngang thì Xe, Mã, Pháo không ăn được.
- **Thăng Cấp**: phong Xe khi tới 2 hàng cuối của địch (thay vì chỉ hàng cuối).

## Đợt 2–7 (32–40 ván/perk)

Các đợt sau chỉ đo lại những perk vừa chỉnh. Điều chỉnh đáng chú ý nhất là thêm **điểm an toàn Tướng** vào AI (trừ điểm khi Tướng rời hàng cuối): trước đó AI hay đưa Tướng ra khỏi chỗ an toàn, khiến mọi perk tăng cơ động cho Tướng bị đo thấp hơn thực tế.

| Đợt | Thay đổi | Kết quả |
|-----|----------|---------|
| 2 | Chiến Xa, Chiến Mã chỉ bước tới ô trống | Chiến Xa 0.52, Chiến Mã 0.44 (nerf quá tay) |
| 2 | Pháo Xa: ngòi phải là quân mình | 0.77, vẫn mạnh |
| 2 | Ô Truy bị cản 2 ô đầu | 0.80, vẫn mạnh |
| 3 | Pháo Xa chỉ theo hàng dọc | 0.55 |
| 3 | Ô Truy chỉ nhảy dài theo chiều dọc | 0.72 |
| 3 | Chiến Mã được ăn khi tiến thẳng | 0.75 |
| 3 | Kim Cương miễn nhiễm thêm Mã; Tuần Tra đi khắp bàn | 0.59; 0.55 |
| 4 | Linh Hoạt trả lại khả năng ăn ngang | 0.68 |
| 4 | Cận Chiến không chiếu Tướng | 0.68 |
| 5 | AI có điểm an toàn Tướng; Ngự Giá chỉ giữ uy lực lộ mặt tướng | Bát Quái 0.57, Khinh Công 0.54, Ngự Giá 0.50, Kim Thiền 0.56 |
| 5 | Thay Pháo Bay (0.50–0.59, yếu dai dẳng) bằng Pháo Chéo | 0.93, quá mạnh |
| 6 | Pháo Chéo không chiếu theo đường chéo | 0.78 |
| 7 | Pháo Chéo tầm chéo tối đa 3 ô | 0.60 |

## Bảng hiện tại

Điểm của bên có perk khi đấu với bên không perk (0.5 = không tạo khác biệt). Số liệu của phiên bản perk mới nhất, sai số khoảng ±0.08.

| Quân | Perk | Điểm |
|------|------|-----:|
| Tướng | Bát Quái Bộ | 0.57 |
| Tướng | Khinh Công | 0.54 |
| Tướng | Ngự Giá Thân Chinh | 0.50 |
| Tướng | Kim Thiền Thoát Xác (3 lần) | 0.56 |
| Sĩ | Cận Vệ | 0.59 |
| Sĩ | Tuần Tra | 0.55 |
| Sĩ | Kim Cương | 0.59 |
| Sĩ | Tử Sĩ | 0.58 |
| Tượng | Vượt Giang | 0.55 |
| Tượng | Voi Chiến | 0.54 |
| Tượng | Tiểu Bộ | 0.47 |
| Xe | Thiết Giáp | 0.60 |
| Xe | Chiến Xa | 0.45–0.56 |
| Xe | Pháo Xa | 0.56 |
| Pháo | Song Ngòi | 0.63 |
| Pháo | Cận Chiến | 0.72 |
| Pháo | Pháo Chéo | 0.60 |
| Mã | Thiên Lý Mã | 0.76 |
| Mã | Chiến Mã | 0.63 |
| Mã | Ô Truy | 0.72 |
| Tốt | Linh Hoạt | 0.68 |
| Tốt | Xung Phong | 0.64 |
| Tốt | Liên Hoàn | 0.55 |
| Tốt | Thăng Cấp | 0.58 |

Trong mỗi loại quân, chênh lệch giữa perk mạnh nhất và yếu nhất hiện vào khoảng 0.1–0.15, xấp xỉ mức nhiễu của phép đo.

### Giới hạn

- AI tự đấu ở độ sâu thấp (40 ms/nước) chơi kém hơn người, nên perk cần tính toán xa (Tử Sĩ, Liên Hoàn, Ngự Giá) có thể bị đo thấp hơn giá trị thật khi người chơi.
- Nên thu thập số liệu từ ván người chơi thật sau khi ra mắt rồi chỉnh tiếp.

## Bản 0.4.0: perk mới và Bản mở rộng

### Perk mới (chế độ thường), 32–36 ván/perk

| Quân | Perk | Điểm | Ghi chú |
|------|------|-----:|---------|
| Tượng | Voi Giày | 0.36 → 0.54 | Ban đầu chỉ giẫm Tốt; nay giẫm cả Tốt, Sĩ, Tượng |
| Xe | Phá Trận | 0.61 | |
| Pháo | Hoả Công | 0.52 → 0.60 | Ban đầu chỉ thiêu 1 ô sau mục tiêu; nay thêm 2 ô hai bên |
| Mã | Hãn Mã | 0.67 | |

### Danh Tướng

Cách đo: bên có Danh Tướng (không perk, không Quân Sư) đấu với bên không có gì, 24–32 ván. Mục tiêu khoảng 0.65–0.75. Danh Tướng là "quân gánh trận" nên được phép mạnh hơn một perk thường.

| Danh Tướng | Đợt 1 | Đợt 2 | Đợt 3 | Thay đổi cuối |
|------------|------:|------:|------:|---------------|
| Trần Hưng Đạo | 0.79 | 0.77 | 0.86 | Bỏ Hịch Tướng Sĩ (ban perk cho Tốt); còn Xuất Cung (thêm 1 hàng trước cung), Khinh Công, Bát Quái Bộ. *Chưa đo lại* |
| Leonidas | 0.63 | | 0.70 | |
| Lê Lai | 0.60 | | | |
| Hứa Chử | 0.60 | | | |
| Bà Triệu | 0.48 | 0.41 | 0.78 | Thêm Cưỡi Voi Xung Trận (đi thẳng 1–2 ô), bỏ Voi Giày. *Chưa đo lại* |
| Hannibal | 0.67 | | 0.72 | |
| Lữ Bố | 0.79 | 0.89 | 0.78 | Bỏ ăn chéo; còn Thiết Giáp, Chiến Xa. *Chưa đo lại* |
| Achilles | 0.92 | 0.86 | 0.84 | Gót Chân chỉ còn miễn nhiễm Xe. *Chưa đo lại* |
| Hồ Nguyên Trừng | 0.56 | 0.68 | | Song Ngòi + Cận Chiến |
| Archimedes | 0.79 | 0.71 | | Pháo Chéo + Hoả Công |
| Quan Vũ | 0.85 | 0.66 | | Bỏ Chiến Mã |
| Richard Tim Sư Tử | 0.69 | | | |
| Yết Kiêu | 0.48 | 0.61 | | Thêm Xung Phong |
| Spartacus | 0.54 | 0.57 | 0.52 | Khởi Nghĩa đi 1 ô mọi hướng ở mọi nơi + Xung Phong. *Chưa đo lại* |

### Quân Sư

| Quân Sư | Đợt 1 | Đợt 2 | Đợt 3 | Thay đổi cuối |
|---------|------:|------:|------:|---------------|
| Gia Cát Lượng | 0.56 | 0.54 | 0.55 | Không Thành Kế dùng 2 lần, Mượn Gió Đông hồi 4. *Chưa đo lại* |
| Tư Mã Ý | 0.58 | 0.50 | 0.66 | Kiên Thủ chặn cả Pháo và Mã; hồi chiêu ngắn hơn |
| Nguyễn Trãi | 0.75 | 0.77 | 0.75 | Nội tại đổi sang Liên Hoàn; Chiêu Binh hồi 12. *Chưa đo lại* |
| Ngô Thì Nhậm | 0.52 | 0.71 | | Nội tại thêm Xung Phong |
| Tôn Tử | 0.75 | 0.63 | | Phong Toả hồi 10, Hộ Thể hồi 5 |
| Themistocles | 0.63 | | | |

### Giới hạn của phép đo

- Bên đối chứng không mang perk nào, nên các nội tại khắc chế perk địch bị đánh giá thấp. Ví dụ Bát Trận Đồ của Gia Cát Lượng chặn Thiên Lý Mã và Ô Truy, nhưng đối thủ lúc đo không có Mã mang perk.
- Sai số khoảng ±0.08–0.1 với 24–32 ván. Các lựa chọn đánh dấu *Chưa đo lại* đã được chỉnh sau lần đo cuối, cần chạy lại:

```bash
node tests/balance-ex.js gen 32 40 tranhungdao,lubo,achilles,batrieu,spartacus
node tests/balance-ex.js strat 32 40 nguyentrai,giacatluong
```

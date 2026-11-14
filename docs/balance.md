# Nhật ký cân bằng perk

## Bản 0.5.1: Hoả Công chỉ thiêu sau lưng, cân bằng theo cả đội hình

### Hoả Công
Theo yêu cầu thiết kế, Hoả Công chỉ thiêu quân địch đứng ngay sau lưng mục tiêu theo hướng bắn (trừ Tướng); 2 ô bên không còn bị lửa lan. Giữ các quy tắc của 0.4.1: Pháo chết vì Tử Sĩ thì không phát lửa, miễn nhiễm Pháo và Hộ Thể chặn lửa.

### Phương pháp mới: đo tổng thể đội hình
Đo từng Danh Tướng/Quân Sư riêng lẻ trước một đối thủ "trắng" (không perk, không Danh Tướng, không Quân Sư) cho kết quả sai lệch. Ví dụ Bát Trận Đồ của Gia Cát Lượng khắc chế Mã của địch, nên khi đối thủ không có perk thì nội tại này vô dụng.

Từ bản này dùng `tests/balance-meta.js`:
- Mỗi ván, cả hai bên đều có **đội hình đầy đủ**: 1 Danh Tướng + 1 Quân Sư + 7 perk ngẫu nhiên.
- Bên A lần lượt thử đủ 84 cặp Danh Tướng × Quân Sư; bên B là đội hình ngẫu nhiên.
- `tests/balance-meta-report.js` khớp mô hình Bradley–Terry: P(thắng) = σ(lợi thế đi trước + Σθ(đội mình) − Σθ(đội địch)). Mô hình ước lượng sức mạnh của từng Danh Tướng, Quân Sư và perk **trong bối cảnh cả đội hình**, đã trừ đi sức mạnh của đối thủ gặp phải. Báo cáo cũng liệt kê các cặp cộng hưởng (điểm thực tế vượt hoặc thấp hơn dự đoán).
- Mỗi lần đo 800 ván; mỗi Danh Tướng xuất hiện khoảng 110 lần, mỗi Quân Sư khoảng 270 lần. Sai số khoảng ±5%.

Con số là tỉ lệ thắng ước tính khi gặp một đội hình trung bình (50% = cân bằng).

| Danh Tướng | Lần 1 | Lần 2 | Lần 3 | Lần 4 |
|---|---:|---:|---:|---:|
| Achilles | 65 | 72 | 57 | 60 |
| Lữ Bố | 44 | 43 | 65 | 58 |
| Spartacus | 58 | 42 | 52 | 57 |
| Lê Lai | 44 | 38 | 49 | 54 |
| Archimedes | 45 | 38 | 56 | 53 |
| Hannibal | 55 | 50 | 47 | 50 |
| Yết Kiêu | 48 | 51 | 47 | 50 |
| Hứa Chử | 53 | 45 | 45 | 48 |
| Hồ Nguyên Trừng | 43 | 52 | 46 | 47 |
| Quan Vũ | 43 | 61 | 47 | 46 |
| Bà Triệu | 55 | 61 | 45 | 46 |
| Trần Hưng Đạo | 46 | 48 | 47 | 45 |
| Richard Tim Sư Tử | 50 | 48 | 51 | 45 |
| Leonidas | 50 | 52 | 44 | 42 |

| Quân Sư | Lần 1 | Lần 2 | Lần 3 | Lần 4 |
|---|---:|---:|---:|---:|
| Gia Cát Lượng | 57 | 52 | 57 | 55 |
| Themistocles | 50 | 48 | 48 | 53 |
| Tư Mã Ý | 54 | 54 | 49 | 51 |
| Ngô Thì Nhậm | 46 | 44 | 48 | 47 |
| Tôn Tử | 40 | 47 | 42 | 47 |
| Nguyễn Trãi | 52 | 55 | 55 | 47 |

Perk ở lần 4 (so với perk cùng loại quân): 26/28 nằm trong 46–55%. Thấp nhất là Liên Hoàn (43–48% qua 4 lần) và Hoả Công (44–48%); cao nhất là Linh Hoạt (53–56%).

### Thay đổi giữa các lần đo
- **Sau lần 1**: Achilles bỏ Phá Trận; Spartacus: Khởi Nghĩa chỉ sau khi qua sông; Gia Cát Lượng: Không Thành Kế còn 1 lần. Buff Hồ Nguyên Trừng (+Hoả Công), Quan Vũ (+Chiến Mã), Lữ Bố (+Phá Trận), Lê Lai (thế thân lúc nào cũng được), Tôn Tử, Ngô Thì Nhậm.
- **Sau lần 2**: Achilles đổi cơ chế Gót Chân: quân nào ăn cũng chết theo, trừ Tốt (trước đó là miễn nhiễm Xe nên không thể đổi Xe). Quan Vũ: Thiên Lý Mã + Chiến Mã. Bà Triệu: Cưỡi Voi còn 1 ô. Lữ Bố thêm Vô Song. Archimedes giữ Pháo Chéo + Song Ngòi, thêm Cận Chiến. Lê Lai thêm Hổ Si. Spartacus thêm Linh Hoạt. Ngô Thì Nhậm: Thu Binh hồi 4.
- **Sau lần 3**: Lữ Bố bỏ Phá Trận (Vô Song quá mạnh khi đi cùng). Tôn Tử: Phong Toả hồi 5, Hộ Thể hồi 3. Gia Cát Lượng: Mượn Gió Đông hồi 5. Hãn Mã thêm miễn nhiễm Mã.

### Giới hạn
- AI tự đấu ở 40 ms/nước chơi nông hơn người. Các chiêu cần tính xa và các nội tại khắc chế có thể bị đánh giá chưa đúng.
- Các cặp cộng hưởng mỗi cặp chỉ có 11–22 ván, nên chênh lệch ±20% vẫn nằm trong nhiễu. Chưa chỉnh theo phần này; cần thêm dữ liệu từ ván người chơi thật.


## Bản 0.4.1: cân bằng Hoả Công và Archimedes

- Giữ Hoả Công làm perk thường của Pháo và giảm sức mạnh sát thương lan.
- Archimedes đổi từ Pháo Chéo + Hoả Công sang **Pháo Chéo + Song Ngòi**, không còn gây sát thương lan. Pháo thường còn lại vẫn dùng perk Pháo đã chọn.
- Archimedes được ăn qua 1 hoặc 2 ngòi theo hàng ngang/dọc và đường chéo (tầm chéo tối đa 3 ô). Không chiếu Tướng theo đường chéo hoặc qua 2 ngòi; vẫn chiếu được theo hàng ngang/dọc qua đúng 1 ngòi.
- Ô ngay sau mục tiêu vẫn thiêu mọi quân địch trừ Tướng; hai ô bên chỉ thiêu Tốt, Sĩ, Tượng, không còn thiêu Xe/Mã/Pháo.
- Pháo phải sống sau đòn ăn mới phát lửa: ăn Sĩ có Tử Sĩ thì Pháo chết và không gây sát thương lan.
- Sửa vị trí hai ô lan của Hoả Công thành vuông góc với hướng bắn cho mọi hướng.
- Miễn nhiễm Pháo và Hộ Thể vẫn chặn sát thương lan; lửa không thiêu quân mình hay Tướng. Chiêu Mượn Gió Đông của Gia Cát Lượng không thay đổi.
- Mục tiêu: giữ khả năng trừng phạt đội hình tụ quân, giảm những đòn ăn lan nhiều quân chủ lực trong một lượt và cho Tử Sĩ khả năng chặn đòn nổ.
- Kiểm chứng bằng các thế cờ kiểm thử cho hướng bắn, loại quân, miễn nhiễm, Tử Sĩ, hoàn tác và bộ perk mới của Archimedes. Chưa có số liệu tự đấu mới; điểm Hoả Công 0.60 và Archimedes 0.71 phía dưới là của bản 0.4.0, không đại diện cho luật mới.

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

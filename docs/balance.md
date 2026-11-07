# Nhật ký cân bằng perk

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

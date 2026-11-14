# Thông thạo — Ấn ký chiến công (0.5.0)

Mỗi hồ sơ có tiến trình riêng cho 14 Danh Tướng và 6 Quân Sư. Huy hiệu, danh hiệu và bảng vinh danh chỉ là cosmetic: không thay đổi engine, perk, giá trị quân hay sức mạnh AI.

## Điểm và cấp

| Sự kiện trong bản mở rộng | Danh Tướng | Quân Sư |
|---|---:|---:|
| Thắng trận trực tuyến | +120 | +120 |
| Danh Tướng tự ăn một quân địch | +20 | +10 |
| Quân khác hoặc chiêu của đội ăn một quân địch | 0 | +10 |

- Đấu máy nhận 50% số điểm trên. Thua/hoà vẫn nhận điểm ăn quân.
- Ăn lan tính theo số quân địch thực sự bị tiêu diệt. Không tính quân mình chết theo, Tướng, hay Tâm Công (chiêu hàng).
- Chỉ chốt khi trận kết thúc, từ lịch sử cuối cùng; đi lại trong trận không cộng trùng. Trận đã chốt không được đi lại. Hai người một máy và sảnh thường không cộng điểm.
- Mã trận chống cộng lại cùng một kết quả; giữ 1.000 biên nhận gần nhất trên thiết bị.

| Cấp | Danh hiệu | Tổng điểm |
|---|---|---:|
| 1 | Tân Binh | 0 |
| 2 | Nhập Môn | 300 |
| 3 | Thuần Thục | 900 |
| 4 | Tinh Anh | 1.800 |
| 5 | Lão Luyện | 3.200 |
| 6 | Đại Sư | 5.200 |
| 7 | Tông Sư | 8.000 |
| 8 | Huyền Thoại | 12.000 |

Cấp 8 vẫn tích điểm để leo bảng. Một nhân vật có thể được trang bị làm danh hiệu đại diện, hiển thị cạnh tên người chơi. Nút **Khoe thông thạo** bật huy hiệu lớn trên bàn và gửi sang đối thủ (cách nhau tối thiểu 6 giây). Thẻ trên trang Thông thạo có thể sao chép để chia sẻ. Huy hiệu trên bàn là thông thạo do đối thủ chia sẻ từ thiết bị, không phải chứng nhận điểm bảng chung.

## Lưu trên trình duyệt (dùng ngay)

`ctq.mastery.v1` trong localStorage lưu hồ sơ theo UID tài khoản, hoặc `guest` nếu chưa đăng nhập. Không trộn điểm các tài khoản, không tự chuyển điểm khách vào tài khoản khi đăng nhập. Bảng **Thiết bị này** chỉ so các hồ sơ đã chơi trên cùng trình duyệt, không phải bảng toàn máy chủ. Đổi thiết bị/xoá dữ liệu trình duyệt sẽ không mang theo tiến trình cục bộ. Trình duyệt chặn lưu trữ vẫn chơi được và báo rõ khi điểm chỉ còn trong phiên.

Atlas `assets/mastery/badges.png` được tạo riêng cho game: nền trong suốt, 4 cột × 2 hàng, từ đồng đến ngọc và vàng thếp, dùng CSS sprite không cần tách ảnh. `css/mastery.css` điều khiển kích thước, vị trí và chuyển động; tôn trọng giảm chuyển động của hệ điều hành.

## Bảng toàn máy chủ — chuẩn bị sẵn, chưa bật mặc định

Không cần backend để chạy game trên GitHub Pages. Mặc định `firebase: null` và `masteryCloud.enabled: false`, giao diện sẽ báo bảng chung chưa kết nối. Không giả lập người chơi hay điểm toàn máy chủ.

Để bật sau khi có dự án Firebase:

1. Tạo dự án, bật **Google Authentication** và **Cloud Firestore**, thêm tên miền game vào Authorized domains. Cloud Functions cần dự án có gói thanh toán Blaze; chỉ bật sau khi chủ dự án đã thiết lập hạn mức phù hợp.
2. Điền cấu hình Web app công khai vào `firebase` trong `js/config.js` (không đưa service-account key vào repo).
3. Cài phụ thuộc và deploy từ thư mục gốc repo:

   ```bash
   npm ci --prefix server
   npx firebase-tools login
   npx firebase-tools use --add
   npx firebase-tools deploy --only functions,firestore:rules
   ```

   Predeploy tự sao chép `data.js`, `expansion.js`, `engine.js`, `mastery.js` vào `server/shared/` để máy chủ dùng cùng bộ luật. Thư mục này không commit. Firebase region mặc định `asia-southeast1` trong cả client và server.

4. Chuyển `masteryCloud.enabled` thành `true`, tăng phiên bản changelog, chạy `node scripts/version-assets.cjs`, commit/deploy GitHub Pages. Khi thay bộ luật, deploy lại Functions cùng với client.

Bảng chung chỉ tính trận trực tuyến có **hai tài khoản Google khác nhau**. Chủ phòng mở mã trận trên máy chủ, mỗi bên gửi lịch sử và kết quả sau khi kết thúc. Máy chủ phát lại từng nước hợp lệ, tự xử chiếu bí/lặp thế/60 nước và tự tính điểm. Đầu hàng cần chữ ký xác nhận bằng đăng nhập của cả hai bên. Chỉ khi hai bản phát lại có cùng hash thì Firestore transaction cộng điểm đúng một lần cho cả hai.

Không gửi số điểm từ client lên máy chủ. Điểm cục bộ/đấu máy không được nhập lên bảng chung. Đối thủ không xác nhận hoặc mất kết nối thì điểm vẫn được giữ cục bộ, chưa lên bảng chung. Đây là hệ thống cosmetic với xác nhận hai bên, không phải máy chủ điều khiển trận trực tiếp; hai người cùng cố ý dàn xếp ván vẫn có thể tạo chiến công cho nhau.

`firestore.rules` từ chối client đọc/ghi trực tiếp; ba Cloud Functions là lối truy cập duy nhất. `masteryMatches` giữ đội hình, hai UID, hash xác nhận và biên nhận, hết hạn xác nhận sau 2 giờ. `masteryBoards/{g:id hoặc s:id}/players/{uid}` giữ điểm trực tuyến riêng cho từng nhân vật; API trả top 50 với UID, tên và thống kê công khai. Không có API công khai đọc biên bản hoặc đội hình của trận.

## Kiểm tra

```bash
node tests/engine.test.js
node tests/mastery.test.js
node tests/mastery-server.test.js
node tests/mastery-functions.test.js
```

Các bài server kiểm tra phát lại và giao dịch bằng bộ dữ liệu trong bộ nhớ, không gọi dự án Firebase thật. Cần chạy thử hai tài khoản trên dự án của bạn sau khi cấu hình Firebase trước khi bật bảng chung cho mọi người.

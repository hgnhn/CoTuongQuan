# Cờ Tướng Quân

Cờ tướng có đội hình tuỳ chỉnh. Ở sảnh, người chơi trang bị **1 perk cho mỗi loại quân** (Tướng, Sĩ, Tượng, Xe, Pháo, Mã, Tốt), mỗi loại có 3–4 perk để chọn. Khi trận đã bắt đầu thì đội hình bị khoá, không đổi được nữa.

Địa chỉ chính thức: **https://cotuongquan.bananalab.id.vn**

## Tính năng

- **Sảnh (menu chính)** có 2 chế độ: **Sảnh thường** và **Bản mở rộng**. Mỗi sảnh có: chơi trực tuyến, đấu với máy, hai người một máy, đội hình, luật chơi. Góc phải sảnh là **nhật ký cập nhật**.
- **Đội hình**: chạm vào quân trên bàn để chọn perk; bàn minh hoạ hiển thị nước đi gốc (xanh), nước perk mở thêm (vàng) và nước perk chặn lại (dấu ×).
- **Phòng chuẩn bị**: trước mỗi trận, mỗi bên có 60 giây (bản mở rộng: 90 giây) để chỉnh đội hình rồi bấm **Sẵn sàng**. Cả hai sẵn sàng thì đếm 3‑2‑1 vào trận. Hết giờ, đội hình hiện tại được chốt tự động. Vào trận rồi thì không đổi được nữa.
- **Bản mở rộng**: mỗi đội hình có thêm 1 **Danh Tướng** (14 nhân vật lịch sử, mỗi người 2–3 perk riêng, thay cho 1 quân cùng loại) và 1 **Quân Sư** (6 nhân vật, có nội tại cho cả bàn và chiêu chủ động dùng 1 lần hoặc có hồi chiêu; dùng chiêu thay cho một lượt đi).
- **Chơi trực tuyến**: tạo phòng để nhận **link mời** (`?phong=MÃ`) hoặc mã 5 ký tự. Cả hai người phải **đăng nhập** trước khi vào phòng. Phòng dùng luật của sảnh người tạo phòng.
- **Đấu với máy**: 3 cấp độ (Tân binh, Hiệu uý, Đại tướng). Máy dùng alpha-beta, hiểu toàn bộ perk và mang đội hình ngẫu nhiên.
- **Luật chuẩn**: chiếu bí hoặc hết nước đi là thua, cấm lộ mặt tướng, lặp thế cờ 3 lần thì hoà (bên chiếu dai bị xử thua, theo tinh thần luật WXF), 60 nước mỗi bên không ăn quân thì hoà.
- Ghi nước đi theo ký hiệu Việt Nam (ví dụ `Pháo 2 bình 5`, `Mã 8 tiến 7`).

## Chạy thử trên máy

Không cần build. Mở bằng một web server tĩnh bất kỳ:

```bash
python3 -m http.server 8000
```

Rồi vào http://localhost:8000.

## Deploy lên tên miền riêng (GitHub Pages)

1. Trên GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, chọn nhánh `main`, thư mục `/ (root)`.
2. Ô **Custom domain** điền `cotuongquan.bananalab.id.vn` (file `CNAME` trong repo đã có sẵn), bật **Enforce HTTPS** khi GitHub cấp xong chứng chỉ.
3. Ở nơi quản lý DNS của `bananalab.id.vn`, thêm bản ghi:

   | Loại  | Tên           | Giá trị           |
   |-------|---------------|-------------------|
   | CNAME | `cotuongquan` | `hgnhn.github.io` |

## Đăng nhập

Mặc định game dùng **hồ sơ cục bộ**: người chơi đặt tên kỳ thủ, tài khoản lưu trong trình duyệt. Để bật **đăng nhập Google thật**:

1. Tạo dự án tại https://console.firebase.google.com, thêm một Web app.
2. **Authentication → Sign-in method** → bật Google.
3. **Authentication → Settings → Authorized domains** → thêm `cotuongquan.bananalab.id.vn`.
4. Dán cấu hình web app vào `firebase` trong [`js/config.js`](js/config.js).

## Kết nối trực tuyến

Trận trực tuyến là kết nối ngang hàng WebRTC qua [PeerJS](https://peerjs.com) (đóng gói sẵn trong `vendor/`). Máy chủ môi giới công khai của PeerJS chỉ giúp hai trình duyệt tìm thấy nhau; nước đi truyền thẳng giữa hai người và mỗi bên tự kiểm tra tính hợp lệ. Có thể tự dựng máy chủ môi giới (`npx peer --port 9000`) rồi khai báo ở `peer` trong `js/config.js`.

## Cân bằng perk

Giá trị quân lấy theo bảng truyền thống (Xe 9, Pháo 4.5, Mã 4, Sĩ 2, Tượng 2, Tốt 1 → 2 khi qua sông). Perk được cân bằng bằng số liệu:

```bash
node tests/balance.js 32 40 H      # đo riêng perk của Mã: 32 ván/perk, 40 ms/nước
bash tests/run-balance.sh 32 40    # đo tất cả, chạy song song 4 nhóm
node tests/balance-ex.js gen 24 40 # đo các Danh Tướng (bản mở rộng)
node tests/balance-ex.js strat 24 40 # đo các Quân Sư
```

Script đo (1) số nước đi tăng thêm của mỗi perk trên các thế cờ trung cuộc, và (2) tỉ lệ điểm khi AI có perk đấu với AI không perk. Mục tiêu: các perk cùng loại quân có sức mạnh gần nhau để không có lựa chọn nào áp đảo. Kết quả các đợt chỉnh nằm trong [`docs/balance.md`](docs/balance.md).

## Nhật ký cập nhật

Mỗi lần cập nhật game, thêm một mục mới **lên đầu** mảng `CTQ.CHANGELOG` trong [`js/changelog.js`](js/changelog.js). Sảnh tự hiển thị mục mới nhất kèm nhãn "Mới".

## Chân dung Danh Tướng & Quân Sư

Chân dung được vẽ bằng SVG trong [`js/portraits.js`](js/portraits.js). Muốn dùng ảnh riêng, thêm trường `art: 'assets/generals/ten-anh.png'` cho nhân vật đó trong [`js/expansion.js`](js/expansion.js).

## Kiểm thử

```bash
node tests/engine.test.js
```

Gồm perft chuẩn từ thế khai cuộc (44 / 1 920 / 79 666), kiểm thử từng perk, Danh Tướng, chiêu Quân Sư, và một bài thử ngẫu nhiên kiểm tra hoàn tác trên hàng nghìn nước của bản mở rộng.

## Cấu trúc

| File | Vai trò |
|------|---------|
| `js/data.js` | Danh sách quân và perk |
| `js/expansion.js` | Danh Tướng, Quân Sư, chiêu (bản mở rộng) |
| `js/portraits.js` | Chân dung SVG |
| `js/changelog.js` | Nhật ký cập nhật |
| `js/editor.js` | Trình chỉnh đội hình (sảnh và phòng chuẩn bị) |
| `js/engine.js` | Luật chơi, sinh nước đi, hiệu ứng perk |
| `js/ai.js` | AI (negamax alpha-beta + quiescence) |
| `js/board-view.js` | Vẽ bàn cờ |
| `js/net.js` | Phòng trực tuyến (PeerJS) |
| `js/auth.js` | Đăng nhập (cục bộ hoặc Firebase Google) |
| `js/app.js` | Sảnh, đội hình, trận đấu |
| `js/config.js` | Cấu hình tên miền, đăng nhập, máy chủ môi giới |

# Chơi trực tuyến trên GitHub Pages

Địa chỉ hiện tại: **https://hgnhn.github.io/CoTuongQuan/**. Link mời giữ đường dẫn `/CoTuongQuan/`, ví dụ `https://hgnhn.github.io/CoTuongQuan/?phong=ABCDE`. Không cần máy chủ web riêng để chạy giao diện.

## Vì sao tạo được mã phòng nhưng không vào được?

Có hai bước khác nhau:

1. **Môi giới**: PeerServer (`0.peerjs.com` mặc định) giúp hai trình duyệt tìm nhau và trao đổi thông tin kết nối.
2. **Đường truyền**: WebRTC mở DataChannel trực tiếp, hoặc qua **TURN** khi NAT/tường lửa không cho nối trực tiếp.

GitHub Pages hay tên miền riêng chỉ phục vụ HTML/JS/CSS, không làm máy chủ chuyển tiếp cho WebRTC. Đổi tên miền không thay thế TURN.

PeerJS đã [ngừng dịch vụ TURN miễn phí cũ](https://github.com/orgs/peers/discussions/1172). Bản thư viện 1.5.4 trong repo vẫn có hai địa chỉ mặc định `eu-0.turn.peerjs.com`, `us-0.turn.peerjs.com`; khi kiểm tra ngày 15/11/2026 chúng không phân giải DNS. Từ 0.5.2, game ghi đè ICE mặc định bằng STUN và dùng TURN do chủ game cấu hình, không dựa vào hai địa chỉ cũ nữa. [FAQ chính thức](https://peerjs.com/client/faq) cũng nêu trường hợp NAT cần TURN.

**Chưa có TURN thì một số cặp mạng vẫn không nối được**, kể cả cả hai cùng mở đúng GitHub Pages. Cùng Wi-Fi hoặc đổi mạng có thể giúp kiểm tra tạm thời, không phải bảo đảm cho tất cả người chơi.

## Lấy cấu hình TURN miễn phí

Ví dụ dùng [Open Relay/Metered](https://www.metered.ca/tools/openrelay/):

Chỉ chủ game cần tạo và cấu hình tài khoản này một lần cho website; bạn bè vào chơi không cần tài khoản TURN riêng.

1. Mở [đăng ký tài khoản](https://dashboard.metered.ca/signup), tạo ứng dụng khi được yêu cầu.
2. Vào **TURN Server**; chọn gói **Free** nếu giao diện yêu cầu chọn gói. Tài liệu hiện công bố 20 GB/tháng miễn phí; kiểm tra giới hạn đang hiển thị trong dashboard của bạn.
3. Chọn **Generate Your First Credential** (hoặc tạo credential), rồi mở **Instructions**.
4. Sao chép **toàn bộ mảng `iceServers`**, gồm `urls`, `username`, `credential`. Nên giữ cả các lựa chọn UDP, TCP và **`turns:…:443?transport=tcp`** do dịch vụ trả về để hỗ trợ mạng chặn UDP.
5. Trong `js/config.js`, thay `iceServers: null` bằng `iceServers: [ /* các phần tử dịch vụ đã cấp */ ]`. Dùng mảng thật, không dán ví dụ có dấu `…` hoặc placeholder. Nếu cần hỗ trợ, gửi mảng này cho người sửa game; không cần gửi mật khẩu đăng nhập hay API key quản trị.
6. Tăng phiên bản trong changelog, chạy `node scripts/version-assets.cjs`, commit và deploy GitHub Pages. Cả chủ phòng và khách tải lại bản mới rồi tạo phòng mới.

`js/config.js` là file công khai: chỉ dùng credential TURN được cấp cho client WebRTC, có hạn mức/quyền phù hợp. Không đưa API key quản trị hay khóa service account vào file này. Với dịch vụ cấp credential ngắn hạn, cần backend cấp mới trước khi hết hạn; không commit credential tạm rồi coi đó là cấu hình lâu dài.

Không dùng lại cặp `openrelayproject/openrelayproject` từ ví dụ cũ. [Tài liệu nhà cung cấp](https://www.metered.ca/tools/openrelay/stun-servers-and-friends/) hiện đánh dấu chúng là ví dụ, cần tạo tài khoản để lấy cấu hình thật. Một PeerServer tự dựng chỉ thay bước môi giới, không tự giải quyết NAT nếu thiếu TURN.

## Cấu hình được hỗ trợ

- `CTQ.CONFIG.peer`: tuỳ chọn máy chủ môi giới PeerJS (`host`, `port`, `path`, `secure`…). Giữ `null` để dùng PeerServer công khai.
- `CTQ.CONFIG.iceServers`: mảng ICE do dịch vụ TURN cấp cho toàn bộ client; ưu tiên hơn `peer.config.iceServers`.
- Cấu hình cũ trong `peer.config.iceServers` vẫn được giữ nếu chưa đặt mảng cấp trên.
- `iceServers: null`: dùng STUN Google và Cloudflare, chỉ thử kết nối trực tiếp. Đây là trạng thái mặc định khi chưa có tài khoản TURN.
- `iceServers: []`: chủ động tắt ICE server, chỉ dùng địa chỉ máy; dành cho kiểm thử nội bộ.

Nếu bật đăng nhập Google, thêm **`hgnhn.github.io`** vào Firebase Authentication → Authorized domains. Tài khoản/điểm lưu trên tên miền cũ không tự xuất hiện ở origin mới; đây là lưu trữ trình duyệt, không phải lỗi mã phòng.

## Lỗi và cách phân biệt

| Thông báo | Ý nghĩa |
|---|---|
| Không kết nối được máy chủ phòng | Chưa hoàn thành kết nối tới máy chủ môi giới; kiểm tra mạng/chặn WebSocket |
| Không tìm thấy phòng đang mở | Mã sai, phòng đóng hoặc chủ phòng mất đăng ký với máy chủ |
| Hai máy chưa mở được kết nối trực tiếp, chưa cấu hình TURN | Chưa mở được DataChannel; cần cấu hình TURN để hỗ trợ mạng chặt |
| Cần kiểm tra máy chủ chuyển tiếp | Có khai báo TURN nhưng vẫn chưa mở được kết nối; kiểm tra URL, credential, hạn dùng, hạn mức và TCP/TLS |
| Phòng đã đủ hai người | Đã có khách hoặc một khách khác đang bắt tay; không thay thế người đang chơi |
| Hai bên khác phiên bản game | DataChannel đã mở nhưng hai bản luật khác nhau; hai bên tải lại |

Khách chưa mở được DataChannel sẽ được giải phóng khỏi phòng khi đóng, báo lỗi hoặc quá 25 giây. Có thể thử lại cùng mã khi chủ phòng vẫn chờ. Sau khi khách đã vào hẳn rồi rời trận, chủ phòng cần tạo phòng mới thay vì cho người khác chen vào trận cũ. Huỷ phòng cũng huỷ peer đang tạo, các kết nối chờ và bộ đếm; sự kiện cũ không được đóng phòng mới.

## Kiểm tra

```bash
node tests/net.test.js
```

Bộ test dùng đồng hồ giả để kiểm tra hết giờ, huỷ, thử lại, phòng đầy, ICE lỗi và cấu hình, không gọi TURN của ai khác. Khi kiểm tra cấu hình thực, dùng [Trickle ICE của WebRTC](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) với mảng được cấp; cần thấy candidate **relay**. Sau đó thử hai thiết bị ở hai mạng khác nhau và cả luồng tạo phòng → sẵn sàng → đi quân.

Đã kiểm thử nội bộ bằng PeerServer cục bộ (`peer` npm), coturn và các trình duyệt Chromium độc lập với `iceTransportPolicy: 'relay'`, bắt buộc đi qua TURN/TCP: DataChannel thật mở, trao đổi nước đi hai chiều, phòng chuẩn bị/kết quả/thông thạo hoạt động, khách thứ ba bị báo phòng đầy. Không thay transport bằng mock. Kết quả cục bộ không thay cho việc kiểm tra credential dịch vụ và thử qua hai mạng thực tế.

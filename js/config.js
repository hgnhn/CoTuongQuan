/* Cờ Tướng Quân — cấu hình.
 *
 * ĐĂNG NHẬP
 * - Để bật đăng nhập Google thật, tạo một dự án Firebase (miễn phí), bật
 *   Authentication > Sign-in method > Google, thêm tên miền chạy game
 *   (cotuongquan.bananalab.id.vn) vào Authorized domains, rồi dán cấu hình web app vào `firebase` bên dưới.
 * - Khi `firebase` để null, game dùng hồ sơ cục bộ: người chơi đặt tên kỳ thủ
 *   và tài khoản chỉ lưu trên trình duyệt này (phù hợp để thử nghiệm).
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});
  CTQ.CONFIG = {
    // Địa chỉ chính thức, dùng để tạo link mời khi mở game từ file cục bộ
    siteUrl: 'https://cotuongquan.bananalab.id.vn/',
    // Máy chủ môi giới PeerJS cho chế độ trực tuyến. null = máy chủ công khai miễn phí
    // của PeerJS. Có thể tự dựng (npx peer --port 9000) rồi khai báo:
    // peer: { host: 'peer.example.com', port: 443, path: '/', secure: true },
    peer: null,
    firebase: null,
    // Ví dụ:
    // firebase: {
    //   apiKey: '...',
    //   authDomain: 'ten-du-an.firebaseapp.com',
    //   projectId: 'ten-du-an',
    //   appId: '...',
    // },
  };
})(typeof window !== 'undefined' ? window : globalThis);

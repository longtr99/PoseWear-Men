# PoseWear Men (v1.0) · Thư viện Tư thế & Thời trang Nam (Song ngữ Việt/Anh) + AI Try-On Studio

Phiên bản web tĩnh **thuần HTML/CSS/JS** dành riêng cho **Nam giới**, xây dựng dựa trên kiến trúc giao diện và luồng thử đồ BYOK của dự án mã nguồn mở `atuizz/posewear` (MIT), không cần cài Node hay chạy bước build phức tạp.

## Điểm nổi bật

- **24 Tư thế Nam × 5 góc máy 3D SVG (120 góc nhìn):** Động cơ chiếu 3D-to-2D dựng sẵn khối cơ thể nam vai rộng, thắt lưng V-taper, xoay thật theo 5 góc (*Chính diện, Góc 3/4, Góc nghiêng, Từ trên, Từ dưới*). Hỗ trợ xuất trực tiếp ảnh **PNG độ phân giải cao (900×1200)** hoặc đưa thẳng làm ảnh tham chiếu vào AI Studio.
- **24 Trang phục Nam (SVG Vector):** Đủ 6 nhóm phong cách (*Streetwear, Smart Casual, Vest/Công sở, Thể thao/Gym, Tối giản, Workwear*), lọc theo phong cách, màu sắc và món đồ.
- **12 Mẫu Tóc & Chân dung Nam:** *Undercut, Side Part 7/3, Middle Part 5/5, Buzz Cut, Wolf Cut/Mullet, Classic Taper + Râu, Wavy Perm, Slick Back, Textured Crop, Short Quiff, Long Layered, Ivy League*.
- **Công cụ Tải ảnh cục bộ & Nhập/Xuất JSON (`+ Tải ảnh / JSON`):**
  - Kéo thả 1 hoặc nhiều ảnh thật (JPG/PNG/WebP/SVG) lưu vĩnh viễn trên trình duyệt bằng **IndexedDB**.
  - Nhập file JSON theo định dạng **PoseWear Men (VI/EN)** hoặc file JSON từ repo gốc (`poses.json`, `costumes.json`, `items.json`), tự động ánh xạ và chống trùng ID.
- **AI Try-On Studio (3 cột · BYOK):** Hỗ trợ **OpenAI** (`gpt-image-1`), **Gemini** (`gemini-2.5-flash-image`), **Doubao Seedream**, và **Custom / xAI Relay**. Tích hợp sẵn so sánh trước/sau, tạo nhiều ảnh, tải ZIP, lịch sử IndexedDB và bộ lọc giảm chặn nhầm kiểm duyệt.
- **Song ngữ VI/EN hoàn chỉnh + Dark/Light Mode + Ghép Combo Prompt 1 chạm.**

## Cách chạy & Deploy

### 1. Mở xem thử ngay trên máy (không cần server)
- Giải nén và mở trực tiếp tệp `posewear-men-standalone.html` bằng trình duyệt (Chrome/Edge/Safari).

### 2. Deploy lên GitHub Pages (miễn phí, chạy ngay)
1. Tạo repository mới trên GitHub và đẩy toàn bộ file trong thư mục gốc (`index.html`, `style.css`, `data-men.js`, `app.js`, `studio.js`, `zip.js`, `sw.js`, `manifest.webmanifest`, `favicon.svg`).
2. Vào **Settings → Pages → Source: Deploy from a branch (`main` / `root`)**.
3. Sau 1 phút web sẽ chạy ngay.

### 3. Deploy lên Cloudflare Pages (hỗ trợ cả `/api/proxy` chống CORS)
```bash
npx wrangler pages deploy . --project-name posewear-men
```
Thư mục `functions/api/proxy.js` sẽ tự động kích hoạt endpoint `/api/proxy` cho Seedream và Custom Relay.

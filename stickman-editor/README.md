# Que Studio – Agent dựng video người que tự động

Công cụ chạy **hoàn toàn trên trình duyệt** (không cần cài đặt, không cần máy chủ): nhập kịch bản → các trợ lý AI tự chia cảnh, dựng nhân vật người que, thêm hiệu ứng, âm thanh, phụ đề → chỉnh trên timeline → xuất video.

Mở `stickman-editor/index.html` bằng Chrome/Edge (hoặc đưa lên GitHub Pages: `/stickman-editor/`).

## Các trợ lý
| Trợ lý | Việc làm |
|---|---|
| **Đạo diễn** | Đọc kịch bản (Việt/Anh), tách câu → cảnh, ước lượng thời lượng. Tuỳ chọn gọi Claude API để hiểu kịch bản sâu hơn |
| **Nhịp cắt** | Tách cảnh quá dài, gộp cảnh quá ngắn, xếp chuyển cảnh (trượt, đẩy, zoom xuyên, mở vòng tròn, loé sáng…) |
| **Nhân vật & bối cảnh** | Chọn tư thế (13 kiểu), đạo cụ (29 icon), phông nền (9 kiểu) theo nghĩa câu |
| **Màu phim** | Tông màu từng cảnh (cảnh báo / tiền / đêm / ấm / lạnh) + grading tổng, vignette, hạt phim |
| **Âm thanh** | SFX tự gắn (whoosh, ting, đập, tiền rơi…), nhạc nền tự sinh 4 phong cách, tự hạ nhạc khi có giọng |
| **Phụ đề** | Phụ đề chạy từng từ, tô màu từ khoá, 3 kiểu chữ |
| **Zoom & chữ** | Zoom vào/ra, cú nhấn zoom theo từ khoá, thẻ số liệu, sticker, thẻ chương, rung màn hình |
| **QA** | Sửa khoảng trắng/viết hoa, kiểm tốc độ đọc, tránh lặp tư thế, lọc SFX chồng, khớp giọng đọc |

## Tính năng chính
- Timeline 6 track (Hiệu ứng · Văn bản · Video · Phụ đề · Giọng đọc · Nhạc nền): kéo mép để đổi thời lượng, cắt/nhân đôi/dời/xoá cảnh, thu phóng, tua.
- **Khớp cảnh theo giọng đọc**: tải file mp3/wav, hệ thống dò khoảng lặng để chia cảnh khớp từng câu.
- Chỉnh từng cảnh: lời thoại, tư thế, nền, tông màu, đạo cụ, chip, sticker, chương, zoom, SFX; nút “Đạo diễn làm lại cảnh”.
- Khung hình 16:9, 9:16, 1:1, 4:5. Hoàn tác/làm lại, tự lưu trong trình duyệt.
- Xuất **.mp4/.webm** (hình + tiếng), phụ đề **.srt**, dự án **.json**, ảnh PNG.
- **Gói đăng bài**: tiêu đề, mô tả có mốc chương, hashtag, caption Facebook.

## Cú pháp kịch bản
```
# Tiêu đề video
## Chương 1 · Mở đầu
Câu thoại bình thường, mỗi câu là một cảnh.
Ép trợ lý bằng lệnh cuối câu {pose:smash prop:rocket,star tone:danger bg:city badge:SIÊU HOT chip:Top 1 tr:flash dur:4 sfx:hit flip:1}
```

## Ghi chú
- Xuất video quay hình theo thời gian thực: giữ tab ở phía trước cho tới khi xong. Chrome mới xuất được `.mp4`; nếu ra `.webm` có thể đổi bằng CapCut hoặc `ffmpeg -i in.webm out.mp4`.
- Giọng đọc cần tải file (trình duyệt không thu được giọng đọc TTS). Nhạc nền và SFX tự sinh, không dính bản quyền.
- Chế độ Claude API: key chỉ lưu trong trình duyệt của bạn, kịch bản gửi thẳng tới api.anthropic.com. Lỗi thì tự quay về chế độ offline.

## Cấu trúc
```
index.html, style.css
js/core.js     mô hình dự án, thời gian, từ
js/figure.js   nhân vật + 13 tư thế
js/props.js    29 đạo cụ + 9 phông nền
js/render.js   dựng khung hình, chuyển cảnh, phụ đề, màu phim
js/audio.js    SFX, nhạc tự sinh, giọng đọc, dò khoảng lặng
js/agents.js   các trợ lý
js/app.js      giao diện, timeline, phát, xuất
```

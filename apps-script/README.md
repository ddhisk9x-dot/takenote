# Teacher Note Assistant - Apps Script Backend (không dùng Google Sheets API)

## Mục tiêu
- App web/app điện thoại **không cần API key**.
- Giáo viên chỉ cần: **1 file Google Sheet** + **1 Web App Apps Script** để app đọc/ghi dữ liệu.

## Cách cài đặt (5 phút)
1) Tạo 1 Google Sheet mới bằng file mẫu hoặc tự tạo 3 tab:
   - **Students**
   - **Timetable**
   - **Events**

2) Vào: **Extensions → Apps Script**
   - Dán toàn bộ nội dung file `apps-script/Code.gs`.
   - (Tùy chọn) vào **Project Settings → Script Properties**:
     - Key: `TNA_TOKEN`
     - Value: (mật khẩu bạn tự đặt, ví dụ `tna-123`)

3) Bấm **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy
   - Copy link kết thúc bằng **/exec**

4) Mở app → tab **Cài đặt**
   - Dán link /exec vào ô "Link Web App Apps Script"
   - Nếu bạn đặt `TNA_TOKEN`, dán token vào ô Token
   - Bấm **Đồng bộ ngay**

## Lưu ý quan trọng (kỹ thuật)
Apps Script Web App thường không trả header CORS cho trình duyệt.
App dùng:
- JSONP (GET) để đọc Students/Timetable
- POST `no-cors` để ghi Events / xóa mềm / ghi đè Students/Timetable

Vì POST `no-cors` không đọc được phản hồi, nếu mạng yếu bạn bấm **Đồng bộ ngay** thêm 1 lần để chắc chắn.

## Action hỗ trợ
GET:
- `?action=ping`
- `?action=getStudents`
- `?action=getTimetable`

POST (body JSON):
- `appendEvents`
- `softDeleteEvents`
- `replaceStudents`
- `replaceTimetable`

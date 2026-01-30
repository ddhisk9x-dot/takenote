# Teacher Note Assistant (Ghi chú tiết học) — Offline + Google Sheet (Apps Script)

## Chạy local
1) Cài Node.js (LTS).
2) Mở thư mục project và chạy:
```bash
npm install
npm run dev
```
Mở: http://localhost:3000

## Cách dùng nhanh
- App hoạt động **offline-first**: nhập ghi chú ngay cả khi mất mạng.
- Khi có mạng, vào **Cài đặt → Đồng bộ ngay** để đẩy dữ liệu lên Google Sheet.

## Kết nối Google Sheet bằng Apps Script (không cần Google Sheets API)
1) Tạo/copy **Google Sheet mẫu** (3 tab): Students, Timetable, Events  
2) Extensions → Apps Script → dán code ở `apps-script/Code.gs`  
3) Deploy → Web app:
   - Execute as: **Me**
   - Who has access: **Anyone**
4) Copy link **/exec** → dán vào app (Cài đặt)

(Tùy chọn) Bảo vệ bằng token:
- Script Properties: `TNA_TOKEN = ...`
- Nhập token vào app.

## Template Google Sheet
Trong gói zip có file Excel mẫu để upload lên Google Drive rồi mở bằng Google Sheets.

## Gợi ý triển khai cho nhiều giáo viên
- Mỗi giáo viên copy 1 bản Google Sheet mẫu, tự deploy Web App (link /exec riêng).
- App chỉ cần dán link /exec của mình.

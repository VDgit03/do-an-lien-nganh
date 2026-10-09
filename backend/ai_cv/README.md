# ai_cv – module phân tích CV (Python)

Được Node gọi qua `child_process` (xem `backend/services/analysis/analysisService.js`),
không chạy độc lập. File vào/ra là `analyze_cv.py`.

## Cài đặt
```bash
pip install -r backend/ai_cv/requirements.txt   # cần Python 3.9+
```

## Biến môi trường tuỳ chọn (.env)
| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PYTHON_BIN` | `python` (Windows) / `python3` | lệnh chạy Python, vd `py` hoặc đường dẫn venv |
| `AI_CV_TIMEOUT_MS` | `60000` | quá thời gian này thì huỷ |
| `AI_CV_MAX_CONCURRENT` | `2` | số lượt phân tích chạy song song |

## Chạy thử bằng tay
```bash
cd backend/ai_cv
python analyze_cv.py --pdf cv.pdf --role frontend --level junior --jd-file jd.txt
```
Bỏ `--jd-file` để so với career framework theo role + level.

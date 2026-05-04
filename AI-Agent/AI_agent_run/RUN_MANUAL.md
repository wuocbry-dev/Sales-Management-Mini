# Huong Dan Chay Thu Cong

File nay huong dan chay project `AI_agent_run` bang terminal VS Code, PowerShell hoac CMD.

## 1. Mo dung thu muc backend

Tu PowerShell:

```powershell
cd D:\GitHup-wuocbry-dev\AI-Agent\AI_agent_run\backend
```

Tu CMD:

```cmd
cd /d D:\GitHup-wuocbry-dev\AI-Agent\AI_agent_run\backend
```

## 2. Kiem tra file moi truong

Project dung file:

```text
backend\.env
```

Can co Gemini API key:

```env
LLM_PROVIDER=google
GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-2.5-flash
```

Khong dat key that trong `.env.example`.

## 3. Chay backend bang PowerShell

```powershell
$env:DEBUG="true"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Sau do mo trinh duyet:

```text
http://127.0.0.1:8000
```

## 4. Chay backend bang CMD

```cmd
set DEBUG=true
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Sau do mo:

```text
http://127.0.0.1:8000
```

## 5. Dang ky va dang nhap

Tren giao dien web:

1. Nhap email, vi du `demo@example.com`.
2. Nhap password toi thieu 8 ky tu, vi du `password123`.
3. Bam `Register` de tao tai khoan moi.
4. Neu email da ton tai, bam `Login`.
5. Khi trang thai hien `Online`, nhap tin nhan va bam `Send`.

## 6. Neu port 8000 bi chiem

Loi thuong gap:

```text
[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)
```

Nghia la port `8000` da co server khac dang chay.

Chay bang port khac:

```powershell
$env:DEBUG="true"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Mo:

```text
http://127.0.0.1:8001
```

Hoac tat process dang chiem port `8000`:

```powershell
Get-NetTCPConnection -LocalPort 8000
```

Lay gia tri o cot `OwningProcess`, roi dung:

```powershell
Stop-Process -Id <PID> -Force
```

Vi du:

```powershell
Stop-Process -Id 25484 -Force
```

## 7. Database

Project nay dung SQLite, database nam tai:

```text
backend\data\AI_agent_run.db
```

Duong dan database duoc cau hinh trong `.env`:

```env
SQLITE_PATH=./data/AI_agent_run.db
```

Neu database da duoc tao va migrate roi thi chi can chay server.

## 8. File backend chinh

Entry point cua FastAPI la:

```text
backend\app\main.py
```

Lenh `uvicorn` can tro toi object:

```text
app.main:app
```

Khong can bam Run truc tiep file `main.py`; nen chay bang lenh:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## 9. Dung server

Trong terminal dang chay server, bam:

```text
Ctrl + C
```


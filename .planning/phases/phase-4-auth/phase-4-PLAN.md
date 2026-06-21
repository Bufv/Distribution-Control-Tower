# PLAN — Phase 4: Auth & RBAC

phase: 4
plan: phase-4-auth
type: implementation
wave: 1
depends_on: []
files_modified:
  - backend/app/models/user.py
  - backend/app/models/__init__.py
  - backend/alembic/versions/002_add_users.py
  - backend/app/dependencies.py
  - backend/app/routers/auth.py
  - backend/app/main.py
  - backend/app/routers/__init__.py
  - frontend/src/LoginPage.jsx
  - frontend/src/AuthContext.jsx
  - frontend/src/App.jsx
  - frontend/src/main.jsx
autonomous: true
must_haves:
  truths:
    - User dapat login dengan username/password dan menerima JWT token
    - Semua endpoint API (kecuali /login, /docs, /health) dilindungi JWT
    - Role manager dan director tercantum di token dan tampil di UI
    - Frontend redirect ke login jika token tidak valid/kedaluwarsa
    - Password di-hash dengan bcrypt
  artifacts:
    - backend/app/models/user.py — User SQLAlchemy model
    - backend/alembic/versions/002_add_users.py — migration users table + seed
    - backend/app/dependencies.py — get_current_user() dependency
    - backend/app/routers/auth.py — POST /api/login, GET /api/me
    - frontend/src/LoginPage.jsx — login form UI
    - frontend/src/AuthContext.jsx — React context for auth state
  key_links:
    - PRD Section 4.3 — JWT auth specification
    - ROADMAP Phase 4 — success criteria
    - backend/app/config.py — SECRET_KEY, ALGORITHM config stubs

---

## Wave 1: Backend Auth Infrastructure

### Task 1: User Model
- name: Create User SQLAlchemy model
- files: backend/app/models/user.py, backend/app/models/__init__.py
- action: Buat model User dengan kolom id (UUID), username (unique), hashed_password, role (manager/director), full_name, is_active, created_at, updated_at. Update __init__.py.
- verify: Run `python -c "from app.models.user import User; print(User.__tablename__)"`
- done: Model User terdefinisi dengan tabel `users`

### Task 2: Migration + Seed Data
- name: Create Alembic migration for users table with seed data
- files: backend/alembic/versions/002_add_users.py
- action: Buat migration 002_add_users.py yang create tabel users dan seed 3 user: admin (director, pass: admin123), manager1 (manager, pass: manager123), dir1 (director, pass: director123). Gunakan passlib bcrypt untuk hash.
- verify: `alembic upgrade head` sukses + query tabel users berisi 3 baris
- done: Tabel users terbuat dengan 3 seed user

## Wave 2: Backend Auth Endpoints

### Task 3: Auth Dependency
- name: Create auth dependency
- files: backend/app/dependencies.py
- action: Buat fungsi get_current_user() yang decode JWT dari Authorization header, validasi token, return user data. Gunakan config.SECRET_KEY dan config.ALGORITHM. Raise 401 jika token invalid/expired.
- verify: `python -c "from app.dependencies import get_current_user; print(get_current_user)"`
- done: Auth dependency siap digunakan di router

### Task 4: Auth Router
- name: Create auth router
- files: backend/app/routers/auth.py
- action: Buat router dengan POST /api/login (validasi username+password, return JWT) dan GET /api/me (return current user info). Gunakan python-jose untuk JWT creation, passlib bcrypt untuk verify password.
- verify: `curl -X POST http://localhost:8000/api/login -H "Content-Type: application/json" -d '{"username":"manager1","password":"manager123"}'` return token
- done: Auth endpoints berfungsi

### Task 5: Protect Existing Routers
- name: Add auth dependency to all routers
- files: backend/app/main.py
- action: Tambah auth router ke app. Tambah daftar public_paths. Tambah middleware/dependency ke semua router yang sudah ada. Exclude /login, /docs, /openapi.json, /health dari proteksi.
- verify: Akses /api/sales tanpa token → 401. Akses dengan token valid → 200.
- done: Semua endpoint terproteksi

## Wave 3: Frontend Auth

### Task 6: Login Page
- name: Create login page component
- files: frontend/src/LoginPage.jsx
- action: Buat komponen LoginPage dengan form username + password. POST ke /api/login. Simpan token di AuthContext (localStorage). Redirect ke dashboard setelah sukses. Tampilkan error jika login gagal.
- verify: Render login page di browser, login sukses redirect ke dashboard
- done: Halaman login berfungsi

### Task 7: Auth Context
- name: Create auth context provider
- files: frontend/src/AuthContext.jsx
- action: Buat React context dengan user state, login/logout functions. Simpan token di localStorage. Parse JWT untuk dapat user info. Provide ke seluruh app.
- verify: Context tersedia di komponen anak
- done: AuthContext siap digunakan

### Task 8: App Rewrite with Auth
- name: Update App.jsx with auth flow
- files: frontend/src/App.jsx, frontend/src/main.jsx
- action: Bungkus App dengan AuthProvider. Jika tidak authenticated → render LoginPage. Jika authenticated → render dashboard. Tampilkan user info (nama + role) di sidebar. Tambah tombol logout.
- verify: App redirect ke login jika belum login. Setelah login, dashboard muncul dengan user info di sidebar.
- done: Auth flow end-to-end berfungsi

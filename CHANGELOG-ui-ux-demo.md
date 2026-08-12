# Changelog — branch `ui-ux-demo`

Catatan perubahan UI/UX yang dibuat di branch ini sebagai contoh untuk vendor. Belum ada yang di-commit ke git; branch `main` (dan versi live di port 3000) tidak diubah.

## 2026-08-11

### Navigasi Sidebar — [src/components/Sidebar.jsx](src/components/Sidebar.jsx)
- Grup menu **"GOVERN"** diganti nama menjadi **"Administration"**.
- Menu **"Users"** ditambahkan ke grup Administration (sebelumnya "Members", hanya bisa diakses lewat halaman Settings) → mengarah ke `/settings/members`, ikon `UserCog`.
- Menu **"Roles"** ditambahkan ke grup Administration (sebelumnya "Role & Permissions", hanya bisa diakses lewat halaman Settings) → mengarah ke `/rbac`, ikon `Shield`.
- Ikon menu **"Audit Log"** diganti dari `ShieldCheck` menjadi `ScrollText`, supaya tidak sama/bentrok dengan ikon menu **"Lisensi"** (yang tetap memakai `ShieldCheck`).

### Halaman Settings — [src/pages/main/SettingsScreen.jsx](src/pages/main/SettingsScreen.jsx)
- Card **"Role & Permissions"** dihapus dari halaman Settings (fungsinya sudah bisa diakses lewat menu sidebar "Roles").
- Card **"Members"** dihapus dari halaman Settings (fungsinya sudah bisa diakses lewat menu sidebar "Users").
- Import ikon yang jadi tidak terpakai (`Shield`, `Users`) dibersihkan.

### Rombak halaman Settings menjadi sub-menu bergrup (mengikuti referensi UI "Smart E-View")
`src/pages/main/SettingsScreen.jsx` dihapus, diganti struktur baru di `src/pages/main/settings/`:
- **[SettingsLayout.jsx](src/pages/main/settings/SettingsLayout.jsx)** — layout baru: sub-menu kiri berkelompok (NOTIFICATIONS, APPEARANCE, GENERAL, SYSTEM) + area konten kanan (`<Outlet/>`), gaya dark theme menyesuaikan aplikasi (bukan tema terang seperti referensi).
- Grup **NOTIFICATIONS** dibuat penuh (fungsional, belum terhubung ke backend — masih data/aksi demo):
  - **[SmtpSettings.jsx](src/pages/main/settings/SmtpSettings.jsx)** (`/settings/notifications/smtp`) — form host/port/username/password/from address, toggle TLS/SSL, template subject & body HTML dengan placeholder token, tombol Preview (modal render sample), tombol Save Changes, form Send Test Email.
  - **[TelegramSettings.jsx](src/pages/main/settings/TelegramSettings.jsx)** (`/settings/notifications/telegram`) — bot token, info cara setup lewat @BotFather, template pesan dengan placeholder, Preview, Save Changes, Send Test Message.
  - **[OfflineReminderSettings.jsx](src/pages/main/settings/OfflineReminderSettings.jsx)** (`/settings/notifications/offline-reminder`) — toggle enable, interval reminder (menit), pilihan channel notifikasi (Email/Telegram). Belum ada referensi desain untuk ini, dibuat estimasi sederhana.
  - Helper bersama: **[ToggleSwitch.jsx](src/pages/main/settings/ToggleSwitch.jsx)**, **[TemplatePreviewModal.jsx](src/pages/main/settings/TemplatePreviewModal.jsx)**, **[templateUtils.js](src/pages/main/settings/templateUtils.js)** (data sample + fungsi render placeholder).
- Grup **APPEARANCE** (Branding, Login Page), **GENERAL** (Export Settings, Security, Audit Log, Detector Types), **SYSTEM** (System Info) baru sebatas *menu* + halaman placeholder **[PlaceholderSettings.jsx](src/pages/main/settings/PlaceholderSettings.jsx)** ("Belum dibuat — menyusul di iterasi berikutnya") — menyusul di iterasi selanjutnya, termasuk halaman "Audit Log" berisi konfigurasi retention.
- Routing di [App.jsx](src/App.jsx) diubah: `/settings` sekarang parent route dengan nested children di atas; `/settings/members` dan `/settings/license` (link lama) tidak berubah.

### Penyesuaian struktur & isi Settings (round 2)
- Subtitle "Manage system-wide settings..." di bawah judul **Settings** dihapus ([SettingsLayout.jsx](src/pages/main/settings/SettingsLayout.jsx)).
- Urutan grup menu diubah: **GENERAL** dipindah ke paling atas, di atas Notifications dan Appearance.
- Menu **"Lisensi"** dipindah dari sidebar utama (grup Administration) ke **Settings > General** (route tetap `/settings/license`, isinya tetap `LicenseScreen.jsx` yang sudah ada, cuma pindah lokasi menu). Item ini dihapus dari [Sidebar.jsx](src/components/Sidebar.jsx) beserta import `ShieldCheck` yang jadi tak terpakai.
- Grup **APPEARANCE**: menu **"Login Page"** dihapus (sesuai arahan).
- Grup **GENERAL**: menu **"Export Settings"** dan **"Detector Types"** dihapus.
- Grup **SYSTEM**: dihapus seluruhnya (isinya hanya "System Info", yang juga dihapus).
- Halaman **[BrandingSettings.jsx](src/pages/main/settings/BrandingSettings.jsx)** (`/settings/appearance/branding`) dibuat penuh — nama aplikasi, browser tab title (default "Primacom Middleware", sesuai `index.html` saat ini), upload logo sidebar & favicon (preview lokal via file picker, belum wired ke backend).
- Halaman **[SecuritySettings.jsx](src/pages/main/settings/SecuritySettings.jsx)** (`/settings/general/security`) dibuat penuh — Session Timeout, Max Login Attempts, Save Changes.
- **[OfflineReminderSettings.jsx](src/pages/main/settings/OfflineReminderSettings.jsx)** dirombak total mengikuti referensi baru: interval reminder + preset cepat (15m/30m/1h/2h/4h/8h), Maximum Reminders per Outage, info box dinamis. Redaksi disesuaikan ke **pEdge** (bukan "camera/device/NVR" seperti referensi, karena entitas di aplikasi ini adalah pEdge, bukan kamera/NVR terpisah) — bagian "Apply To: Cameras / Devices-NVR servers" dari referensi tidak diikutkan karena tidak relevan dengan model data aplikasi ini.
- Menu **"Audit Log"** di General masih placeholder (isi retention config belum dibuat, menyusul).

### Halaman Audit Log Retention + hapus gap layout global
- **[AuditLogRetentionSettings.jsx](src/pages/main/settings/AuditLogRetentionSettings.jsx)** (`/settings/general/audit-log`) dibuat penuh — field Retention Period (days), default 90, helper text, Save Changes. Deskripsi disesuaikan ke aplikasi ini: diganti dari "Activity, Event Status, and Notification logs" (istilah referensi) menjadi "user activity across sites, routes, tenants, and other modules", karena backend (`model/Logs.cs`, `AuditScreen.jsx`) hanya punya satu jenis log aktivitas umum, belum ada pemisahan kategori Event Status/Notification.
- `PlaceholderSettings.jsx` sudah tidak dipakai lagi (semua menu Settings sudah punya halaman asli) — dihapus.
- **[Layout.jsx](src/components/Layout.jsx)**: menghapus elemen `<header className="h-16 ...">` yang kosong (isinya cuma komentar mati) di shared layout — ini penyebab gap/padding ±64px yang muncul konsisten di bagian atas hampir semua halaman, karena Layout ini membungkus semua route lewat `<Outlet/>`.

### Tombol Logout footer sidebar → panel "My Account"
- **[Sidebar.jsx](src/components/Sidebar.jsx)**: tombol "Logout" di footer diganti jadi baris identitas user yang sedang login (avatar inisial nama, nama lengkap, role) + ikon titik tiga (`MoreVertical`). Klik baris ini membuka panel akun, bukan langsung logout.
- **[AccountPanel.jsx](src/components/AccountPanel.jsx)** (baru) — side panel kanan (overlay + drawer), mengikuti referensi yang dilampirkan tapi warna & font disesuaikan konsisten dengan tema gelap aplikasi (bukan panel putih seperti referensi):
  - Header panel: avatar besar, nama, badge role, tombol close.
  - Tab **Edit Profile** (Full Name, Email, Telegram Chat ID + helper text) dan **Change Password** (Current/New/Confirm Password), gaya tab mengikuti pola yang sudah ada di `SiteSettingScreen.jsx` (border-bottom biru saat aktif).
  - Data nama/email/role diisi dari data user yang sudah di-fetch Sidebar lewat `/auth/verifySessions` (sama seperti yang dipakai `Account.jsx`) — bukan data dummy statis.
  - Tombol "Sign out" di bagian bawah panel memanggil fungsi logout yang sama seperti sebelumnya (`handleLogout`).
  - Save Profile / Save Password masih aksi demo (alert), belum wired ke endpoint backend.
  - Tidak menampilkan nomor versi app (referensi punya "v0.18.0") karena `package.json` versi aplikasi ini masih `0.0.0` — dihilangkan saja daripada menampilkan angka yang tidak bermakna.
- Panel akun dipindah ke sisi **kiri** layar (drawer + overlay), sesuai arahan lanjutan.

### Halaman Tenants — [TenantsScreen.jsx](src/pages/main/TenantsScreen.jsx)
- Tombol **"SSO config"** di header dihapus, beserta import ikon `Shield` yang jadi tak terpakai.
- Semua **metric stat cards** (Tenants, Active Users, Routes, Throughput · Live) di atas tabel dihapus, beserta kalkulasi `totalUsers`/`totalRoutes` yang jadi tak terpakai.
- Kolom tabel **CONNS** dan **THROUGHPUT** dihapus, diganti kolom **EXPIRED DATE** — saat ini masih tampil "—" untuk semua tenant karena belum ada field expiry per-tenant di backend (`model/Tenant.cs` tidak punya field ini; `LicenseEntitlementModal.jsx` juga masih pakai `validUntil` demo statis, belum benar-benar per-tenant). Tinggal disambungkan ke `item.expiredAt` begitu backend menyediakan datanya.
- Kolom **"ROUTES"** diganti nama jadi **"pRoutes"**, kolom **"INSTANCES"** diganti nama jadi **"pEdge"** — penamaan ini sudah konsisten dengan istilah yang sudah dipakai di `LicenseEntitlementModal.jsx` (Max pEdge / Max pRoutes).
- Urutan kolom ditukar: **pEdge** sekarang tampil sebelum **pRoutes** (sebelumnya Routes lebih dulu daripada Instances).

### Popup Create/Edit Tenant disederhanakan
- Field **Plan**, **Environment**, **Region**, **Seats/users**, dan **Accent colour** dihapus dari tampilan form (sesuai contoh terlampir). Field **Tenant name** dan **Code** tetap dipertahankan karena masih jadi identifier utama yang dipakai di badge/kode tenant pada tabel.
- ⚠️ **Catatan penting soal data**: nilai Plan/Env/Region/Users/Accent tenant yang sudah ada **tidak dihapus/dihilangkan** — nilainya tetap tersimpan diam-diam di state form (tidak ditampilkan sebagai input) lalu tetap dikirim ke backend saat submit. Ini sengaja, karena `UpdateTenant` di [Service.cs](../ESB-CORE-BACKEND/api/tenant/Service.cs) langsung men-`.Set()` kelima field itu dari payload — kalau field ini benar-benar dihapus dari payload, setiap kali tenant di-edit lewat form baru ini, data Plan/Env/Region/Users/Accent tenant yang sudah ada akan ter-reset ke kosong/default. Jadi field-nya disembunyikan dari UI tapi datanya tetap aman.
- Field baru ditambahkan sesuai contoh: **Description** (dipindah lebih ke atas, tepat di bawah nama), **Email**, **Phone**, **Address**, **PIC**, **Status** (dropdown Active/Inactive).
- Field-field baru ini (Email, Phone, Address, PIC) **belum tersimpan ke backend** — `model/Tenant.cs` dan DTO `CreateTenant` belum punya kolom untuk ini, jadi nilainya akan terkirim di request tapi diabaikan backend sampai model/DTO-nya ditambahkan.
- **Status** (Active/Inactive) di-map ke field `isActive` yang sudah ada, tapi perlu diketahui: backend `UpdateTenant` saat ini **tidak** ikut men-`.Set()` `IsActive` sama sekali (jadi mengubah Status lewat form ini belum berefek nyata saat edit), dan saat create, `IsActive` di-hardcode `true` oleh backend terlepas dari payload. Jadi dropdown Status ini murni tampilan untuk sekarang — perlu penyesuaian di `Service.cs` kalau mau benar-benar fungsional.

## 2026-08-12

### Popup Create/Edit Tenant — [TenantsScreen.jsx](src/pages/main/TenantsScreen.jsx)
- Urutan field disusun ulang: **Tenant name & Code** → **PIC & Status** → **Email & Phone** → **Address** → **Description** (sebelumnya Description tampil kedua, Address berupa `input` satu baris di antara Email/Phone dan PIC/Status).
- Field **Address** diubah dari `input` satu baris menjadi `textarea` 2 baris.
- Info box "Routes, instances and connections are assigned per route..." di bagian bawah form dihapus, beserta import ikon `Info` yang jadi tak terpakai.

### Halaman Tenants — [TenantsScreen.jsx](src/pages/main/TenantsScreen.jsx)
- Kolom tabel **PLAN** dan **ENV** dihapus (datanya `item.plan`/`item.env` tetap ada di backend, cuma tidak lagi ditampilkan sebagai kolom).
- Ikon di header popup Create/Edit Tenant diganti dari `Users` menjadi `Building2`.

### Halaman Users (Member Management) — [MemberScreen.jsx](src/pages/main/MemberScreen.jsx)
- Semua teks UI **"Member"** diganti menjadi **"User"**: judul halaman ("User Management"), tombol "Add User", label "Total Users", pesan tabel kosong, judul popup ("Add New User" / "Edit User"), tombol submit ("Save User" / "Update User"), teks konfirmasi hapus. Nama variabel/fungsi internal (`members`, `selectedMemberId`, endpoint `/user/members`, dst.) tidak diubah karena itu kontrak dengan backend, di luar scope frontend-only.
- Field **Address** dihapus dari popup Add/Edit User, diganti field baru **Telegram ID** (icon `Send`, menggantikan `MapPin` yang jadi tak terpakai).
- ⚠️ **Catatan backend**: field **Telegram ID** ini belum ada di model backend (`model/User.cs`) maupun `PostMemberDto` — nilainya akan terkirim di request tapi diabaikan backend sampai kolomnya ditambahkan. Sebaliknya, field **Address** aman dihapus dari form karena `UpdateUser` di [Service.cs](../ESB-CORE-BACKEND/api/users/Service.cs) memang tidak pernah men-`.Set()` field `Address` — jadi menghapusnya dari form ini tidak berisiko menimpa data address user yang sudah ada.

### Navigasi Sidebar — [Sidebar.jsx](src/components/Sidebar.jsx)
- Ikon menu **"Tenants"** diganti dari `Users` menjadi `Building2`.
- Ikon menu **"Users"** diganti dari `UserCog` menjadi `Users` (ikon yang sebelumnya dipakai oleh menu Tenants).

### Penyeragaman judul halaman (title + icon, hapus subtitle deskripsi)
Supaya konsisten dengan pola judul halaman Users (`<Icon/> Nama Halaman`, tanpa subtitle deskripsi di bawahnya):
- **[TenantsScreen.jsx](src/pages/main/TenantsScreen.jsx)**: judul "Tenants" → **"Tenant Management"**, ditambah ikon `Building2` (sama seperti ikon menu sidebar Tenants), subtitle "Multi-tenant isolation, quotas and billing..." dihapus.
- **[MemberScreen.jsx](src/pages/main/MemberScreen.jsx)**: subtitle "Kelola pengguna, penetapan role, dan akses tenant" di bawah judul "User Management" dihapus.
- **[RbacScreen.jsx](src/pages/main/RbacScreen.jsx)**: judul "RBAC Management" → **"Role Management"**, ditambah ikon `Shield` (sama seperti ikon menu sidebar Roles), subtitle "Role-based access control policies" dihapus.
- **[AuditScreen.jsx](src/pages/main/AuditScreen.jsx)**: judul halaman "Audit Trail" → **"Audit Log"**, ditambah ikon `ScrollText` (sama seperti ikon menu sidebar Audit Log), subtitle "Immutable, signed activity log" dihapus. Sub-judul "Audit Trail" di dalam card tabel (label section, bukan judul halaman) sengaja tidak diubah karena di luar scope permintaan.
- **[SettingsLayout.jsx](src/pages/main/settings/SettingsLayout.jsx)**: judul "Settings" ditambah ikon `Settings` (sama seperti ikon menu sidebar Settings) — subtitle-nya sendiri sudah dihapus di iterasi sebelumnya.

### Popup Add/Edit User — [MemberScreen.jsx](src/pages/main/MemberScreen.jsx)
- Layout form disusun ulang: **Full Name** jadi 1 baris penuh (sebelumnya sebaris dengan Email) → baris **Email & Password** → baris **Telegram ID & Phone** (sebelumnya Phone & Password satu baris, Telegram ID sendirian di baris terpisah paling bawah).

### Halaman Role Management — [RbacScreen.jsx](src/pages/main/RbacScreen.jsx)
- Lebar kolom list role diperbaiki: kolom Role dikasih `min-w-0` (supaya nama role panjang bisa truncate dengan benar, bukan mendorong kolom lain), kolom Permissions/Users/Actions dikasih `shrink-0` (supaya lebarnya tetap, tidak ikut menyempit).
- Kolom **Permissions**: sebelumnya menampilkan daftar nama fitur yang diizinkan (mis. `dashboard.read · traffic.read`) atau `"all"`/`"no access"`. Sekarang menampilkan **jumlah izin yang di-allow**: `"Full access"` kalau semua permission tercentang, `"No access"` kalau kosong, atau format `X / Y` (mis. `5 / 30`) untuk sebagian — `Y` (total permission) dihitung otomatis dari `PERMISSION_TREE` (setiap fitur = 1 "read" + jumlah `actions`-nya), bukan angka tetap.
- Kolom **Users**: sebelumnya menampilkan `role.usersCount`, yaitu angka yang diisi manual lewat field "Assigned Users" saat create/edit role (field ini sendiri sudah lama disembunyikan/di-comment di form, jadi datanya bisa basi/tidak sinkron). Sekarang dihitung langsung dari data live `/user/members` — jumlah user yang `idRole`-nya sama dengan role tersebut.

### Penyesuaian lanjutan (round 2)
- **[RbacScreen.jsx](src/pages/main/RbacScreen.jsx)**: List role diubah dari layout flex manual menjadi `<table>` sungguhan (mengikuti pola tabel Users/Tenants) — ini sekaligus memperbaiki lebar kolom Role yang sebelumnya kebesaran (karena `flex-1` mengambil semua sisa ruang), dan header section "Roles Management" diganti jadi **"Total Roles: {count}"** (konsisten dengan "Total Users"/"Total Tenants").
- **[RbacScreen.jsx](src/pages/main/RbacScreen.jsx)**: Icon action (edit/hapus) di tabel Roles sebelumnya `opacity-0` sampai baris di-hover — sekarang selalu tampil, konsisten dengan tabel Users & Tenants.
- **[TenantsScreen.jsx](src/pages/main/TenantsScreen.jsx)**: Ditambah header **"Total Tenants: {count}"** di atas tabel, style thead/th (`bg-[#0e1420]`, padding `p-3.5`) dan tombol action disamakan persis dengan tabel Users, termasuk pesan saat data kosong.
- **[RbacScreen.jsx](src/pages/main/RbacScreen.jsx)**: Kolom **Users** sekarang bisa diklik — membuka popup daftar user (avatar inisial, nama, email) yang memakai role tersebut, diambil dari data `/user/members` yang sama dipakai untuk hitung jumlahnya.
- **[SettingsLayout.jsx](src/pages/main/settings/SettingsLayout.jsx)** / **[App.jsx](src/App.jsx)**: Redirect default `/settings` (index route) diubah dari `notifications/smtp` menjadi **`license`** — supaya sub-menu yang aktif pertama kali dibuka konsisten dengan sub-menu paling atas (grup GENERAL sudah dipindah ke atas sejak iterasi sebelumnya, tapi redirect index-nya belum ikut disesuaikan).
- **Logo sidebar — [Sidebar.jsx](src/components/Sidebar.jsx)** + **[logo.png](src/assets/logo.png)**: File `logo.png` ternyata berisi icon + wordmark "PrimaSphere" penuh, tapi dengan banyak ruang transparan kosong di kanan/atas/bawah kanvas (rasio asli konten ~4.45:1, sedangkan CSS memaksa `140x55` ≈ 2.5:1 lewat inline `style`) — hasilnya logo yang tampil kecil dan sedikit gepeng. File gambar di-crop pas ke bounding box kontennya (pakai `sharp`, tanpa mengubah desain logo itu sendiri), lalu CSS diganti dari `style={{width:"140px",height:"55px"}}` menjadi className `h-8 w-auto object-contain` (tinggi tetap 32px, lebar menyesuaikan rasio asli) supaya proporsional dan tidak gepeng. Padding header brand (`px-1` → `px-4`) juga disamakan dengan section lain di sidebar.

### Penyesuaian lanjutan (round 3)
- **[RbacScreen.jsx](src/pages/main/RbacScreen.jsx)**: Kolom **Users** yang bisa diklik sebelumnya cuma teks bergaris bawah (kurang terlihat sebagai tombol) — diganti jadi bentuk pill/button (border, background, icon `UserCheck`) yang berubah warna biru saat hover, supaya lebih jelas kalau itu bisa diklik untuk membuka popup daftar user.
- **[AuditScreen.jsx](src/pages/main/AuditScreen.jsx)**: Filter rentang waktu Audit Log sekarang default ke **24 jam terakhir** dengan presisi menit (sebelumnya default kosong = tampilkan semua log). Input filter diganti dari `type="date"` (cuma tanggal) menjadi `type="datetime-local"` (tanggal + jam) supaya rentang 24 jam bisa direpresentasikan akurat, dan logika filter tidak lagi dibulatkan ke awal/akhir hari kalender (`setHours(0,0,0,0)`/`23:59:59`) — langsung membandingkan timestamp. Tombol "Reset" diganti jadi **"Last 24h"** yang mengembalikan ke rentang default tersebut.
- **[AuditScreen.jsx](src/pages/main/AuditScreen.jsx)**: Halaman diubah jadi punya **4 tab menyamping** ala referensi "System Activity" yang dilampirkan (tab style mengikuti pola yang sudah ada di `SiteSettingScreen.jsx` — border-bottom biru saat aktif): **Audit Log** (tetap fungsional, data live dari `/logs/logs`), **Event Status Log**, **Notification Log**, **Live Sessions**. Tiga tab terakhir masih berisi **data demo statis** (ditandai badge kuning "Demo data — belum terhubung ke backend") karena backend (`ESB-CORE-BACKEND`) saat ini belum punya pencatatan sama sekali untuk status pEdge online/offline, log notifikasi terkirim, atau riwayat sesi live streaming — endpoint `/logs/logs` yang ada cuma untuk audit aksi user. Perlu model/endpoint backend baru kalau mau tab-tab ini jadi fungsional beneran.

### Penyesuaian lanjutan (round 4)
- **[AuditScreen.jsx](src/pages/main/AuditScreen.jsx)**: Judul halaman "Audit Log" → **"System Activity"** (di judul utama halaman maupun label menu sidebar). Tab **Live Sessions** dihapus (belum ada rencana implementasi jelas, beda dari Event Status Log/Notification Log yang sudah ada contoh datanya). Teks "signed · immutable logs" di section Audit Trail dihapus.
- **[AuditScreen.jsx](src/pages/main/AuditScreen.jsx)**: Nama device pada data demo Event Status Log & Notification Log diganti dari nama lokasi (mis. "Lobby Depan (Resepsionis)") menjadi nama pEdge yang jelas (mis. **pEdge Berau**, **pEdge Nusaraya-1**, **pEdge Nusaraya-2**) — lebih relevan karena konteksnya memang status pEdge, bukan lokasi.
- **[AuditScreen.jsx](src/pages/main/AuditScreen.jsx)**: Filter rentang waktu, tombol **Refresh** (baru ditambahkan, ikon berputar saat memuat), dan **Export CSV** dipindah dari dalam card "Audit Trail" ke satu toolbar bersama di atas tab content — jadi dipakai bersama oleh ketiga tab (sebelumnya Event Status Log & Notification Log tidak punya filter/export sama sekali). Export CSV kini mengekspor data sesuai tab yang sedang aktif (kolom & nama file menyesuaikan). Data demo di Event Status Log/Notification Log yang sebelumnya berupa string tanggal Indonesia (`"12/08/2026 02:10:05"`, ambigu untuk di-parse) diubah ke format ISO lokal (`"2026-08-12T02:10:05"`) supaya filter rentang waktu bekerja benar.
- **Logo halaman Login — [Login.jsx](src/pages/auth/Login.jsx)**: Pakai `import logo` yang sama dengan Sidebar, jadi ikut terdampak saat file `logo.png` di-crop (lihat catatan round 2) — style-nya juga masih hardcode `width:140px,height:55px` peninggalan lama, bikin logo di halaman Login gepeng juga. Diganti ke `height:36px, width:auto, objectFit:contain` (pola sama seperti perbaikan di Sidebar).
- **Tab title & favicon — [index.html](index.html)**: `<title>` diganti dari "Primacom Middleware" menjadi **"PrimaSphere - Dashboard"** (default value di form demo [BrandingSettings.jsx](src/pages/main/settings/BrandingSettings.jsx) turut disesuaikan). Favicon diganti dari `favicon.svg` bawaan template (ikon ungu abstrak, tidak relevan) menjadi **[favicon.png](public/favicon.png)** — di-crop dari asset logo PrimaSphere yang sama (hexagon icon saja, tanpa wordmark), di-generate pakai `sharp` supaya proporsional persegi tanpa distorsi.

### Penyesuaian lanjutan (round 5)
- **Copyright halaman Login — [Login.jsx](src/pages/auth/Login.jsx)**: Teks footer "© 2026 Enterprise Service Bus Designer." diganti menjadi **"© 2026 PrimaSphere."**.
- **[AuditScreen.jsx](src/pages/main/AuditScreen.jsx)**: Ditambahkan **pagination** di ketiga tab (Audit Log, Event Status Log, Notification Log) — 10 baris per halaman, kontrol "Menampilkan X–Y dari Z" + tombol Prev/Next di bawah tiap tabel (komponen `Pagination` baru, dipakai bersama). Halaman otomatis reset ke 1 saat ganti tab atau ubah filter rentang waktu. Container scroll `max-h-[520px] overflow-y-auto` pada Audit Trail dihapus karena sudah tidak diperlukan (jumlah baris per halaman sudah dibatasi oleh pagination).

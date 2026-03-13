// Set tanggal otomatis
document.getElementById('date-info').innerText = "DATA TERKINI: " + new Date().toLocaleDateString('id-ID');
function handleLogin() {
    const userField = document.getElementById('user-input');
    const keyField = document.getElementById('key-input');
    const schoolField = document.getElementById('school-select');

    // Ambil nilai dan bersihkan spasi
    const user = userField.value.trim().toLowerCase();
    const keyInput = keyField.value.trim(); // Jangan di-lowercase dulu karena key bisa Case Sensitive
    const school = schoolField.value; // Harus 'tonggalan' atau 'klaten2'

    console.log("Sekolah yang dipilih:", school);

    // Logika penentuan Key yang benar
    const isChatMode = keyInput.endsWith('/c');
    const actualKey = isChatMode ? keyInput.replace('/c', '') : keyInput;

    const keyTonggalan = "TGL5-CEO-A3";
    const keyKlaten2 = "KLT2-SAM-AR";

    // STEP 1: Cek apakah Key sesuai dengan Sekolah yang dipilih
    let keyValid = false;
    if (school === "tonggalan" && actualKey === keyTonggalan) keyValid = true;
    if (school === "klaten2" && actualKey === keyKlaten2) keyValid = true;

    if (!keyValid) {
        alert("Classroom Key salah atau tidak sesuai dengan sekolah yang dipilih!");
        return; // Berhenti di sini kalau key salah
    }

    // STEP 2: Jika Key benar, cek nama di Database sekolah tersebut
    // Pastikan path-nya benar: users/[nama_sekolah]/[nama_user]
    db.ref(`Users/${school}/${user}`).once('value')
    .then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("Login Berhasil:", userData);

            // Jalankan logika masuk (Tutup login, buka dashboard)
            executeEntry(user, school, isChatMode, userData);
        } else {
            alert(`Nama '${user}' belum terdaftar di ${school}. Silakan register dulu!`);
        }
    })
    .catch((error) => {
        console.error("Firebase Error:", error);
        alert("Koneksi gagal. Cek internet atau konfigurasi Firebase kamu.");
    });
}
// Fungsi pembantu biar rapi
function enterPublicMode(school, isReadOnly) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('public-homework').style.display = 'block';
    document.getElementById('school-view-title').innerText = "Log Tugas " + school;
    
    // Kalau read-only, sembunyikan fitur tambah/edit PR (jika ada)
    if (isReadOnly) {
        const adminBtn = document.getElementById('admin-only-feature');
        if (adminBtn) adminBtn.style.display = 'none';
    }
    
    loadHomeworkToTable(school);
}
function sendMsg() {
    const msg = document.getElementById('msg-input').value;
    const chat = document.getElementById('chat-content');
    if(msg.trim() !== "") {
        const p = document.createElement('p');
        p.innerHTML = "<b style='color:#1a4a7a'>Admin:</b> " + msg;
        p.style.fontSize = "13px";
        p.style.margin = "8px 0";
        p.style.borderBottom = "1px solid #f1f3f5";
        chat.appendChild(p);
        document.getElementById('msg-input').value = "";
        chat.scrollTop = chat.scrollHeight;
    }
}
// Fungsi untuk mengambil data PR berdasarkan sekolah yang dipilih saat login
function loadHomeworkToTable(school) {
    // 1. Pastikan Path Firebase-nya dinamis mengikuti pilihan sekolah
    const homeworkRef = db.ref(`homework/${school}`); 
    
    // 2. Ambil elemen tabelnya (Pastikan ID 'homework-list' ada di <tbody> atau <table> kamu)
    const tableBody = document.getElementById('homework-list');
    
    if (!tableBody) {
        console.error("Error: Elemen 'homework-list' tidak ditemukan!");
        return;
    }

    homeworkRef.on('value', (snapshot) => {
        tableBody.innerHTML = ""; // Bersihkan list lama biar gak numpuk
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                
                // 3. Gunakan variabel tableBody yang konsisten
                const row = `
                    <tr>
                        <td>${data.subject}</td>
                        <td>${data.task}</td>
                        <td><span class="status-badge">AKTIF</span></td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } else {
            tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center'>Belum ada tugas tercatat untuk " + school + ".</td></tr>";
        }
    });
}

// Cek apakah ada parameter 'guest' di URL
const urlParams = new URLSearchParams(window.location.search);
const guestSchool = urlParams.get('guest');

if (guestSchool) {
    // Jalankan mode tamu
    enterPublicMode(guestSchool);
    // Sembunyikan tombol reply atau fitur interaksi
    document.getElementById('admin-features').style.display = 'none'; 
    alert("Mode Tamu: Anda hanya bisa melihat data. Fitur penuh terbuka setelah verifikasi.");
}

function executeEntry(userName, userSchool, isChatMode, userData) {
    document.getElementById('login-page').style.display = 'none';

    const isVerified = !userData.status;

    if (isChatMode) {
        if ((userName === "Azfarhhh" || userName === "Gelishhh") && isVerified) {
            document.getElementById('secret-chat').style.display = 'block';
            if (typeof listenChat === "function") listenChat();
        } else {
            alert("Akses Chat Ditolak: Hanya untuk CEO Terverifikasi.");
            document.getElementById('public-homework').style.display = 'block';
            loadHomeworkToTable(userSchool);
        }
    } else {
        document.getElementById('public-homework').style.display = 'block';
        
        // Pastikan baris ini aman
        const titleElement = document.getElementById('school-view-title');
        if (titleElement) {
            const displayName = userSchool === "tonggalan" ? "SDN 1 TONGGALAN" : "SDN 2 KLATEN";
            titleElement.innerText = "Log Tugas " + displayName;
        }

        // Jalankan fungsi load data PR
        loadHomeworkToTable(userSchool);
        
        // BAGIAN ANNOUNCEMENT DIHAPUS/KOMENTAR DULU (POST-RELEASE)
        // if (typeof loadAnnouncement === "function") loadAnnouncement();
    }
}
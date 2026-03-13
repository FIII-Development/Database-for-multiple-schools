// Set tanggal otomatis
document.getElementById('date-info').innerText = "DATA TERKINI: " + new Date().toLocaleDateString('id-ID');

// 1. Masukkan Config (Ganti dengan data asli dari Firebase Console kamu)
const firebaseConfig = {
      apiKey: "AIzaSyDE1tJF3p4t-wOFQWLJlQr2eU12KG5_NAc",
      authDomain: "database-pr-sekolah.firebaseapp.com",
      databaseURL: "https://database-pr-sekolah-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "database-pr-sekolah",
      storageBucket: "database-pr-sekolah.firebasestorage.app",
      messagingSenderId: "699468097429",
      appId: "1:699468097429:web:197f697f86e6176e49b89c"
    };
// 2. Nyalakan Mesin Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 3. Kenalkan variabel 'db' dan 'auth' (Biar gak error "not defined" lagi)
const db = firebase.database();
const auth = firebase.auth();

// --- BARU LANJUT KE KODE KAMU DI BAWAH ---
document.getElementById('date-info').innerText = "DATA TERKINI: " + new Date().toLocaleDateString('id-ID');

function handleLogin() {
    const userField = document.getElementById('user-input');
    const keyField = document.getElementById('key-input');
    const schoolField = document.getElementById('school-select');

    const user = userField.value.trim().toLowerCase();
    const keyInput = keyField.value.trim().toUpperCase(); 
    const school = schoolField.value; 

    console.log(school)

    // Logika Key
    const isChatMode = keyInput.endsWith('/c');
    const actualKey = isChatMode ? keyInput.replace('/c', '') : keyInput;

    const keyTonggalan = "TGL5-CEO-A3";
    const keyKlaten2 = "KLT2-SAM-AR";

    let keyValid = false;
    if (school === "tonggalan" && actualKey === keyTonggalan) keyValid = true;
    if (school === "klaten2" && actualKey === keyKlaten2) keyValid = true;

    if (!keyValid) {
        alert("Classroom Key salah atau tidak sesuai sekolah!");
        return;
    }

    // --- BAGIAN BARU: LOGIN AUTH OTOMATIS ---
    // Kita buat email & password virtual dari input user
    const virtualEmail = user + "@sekolah.com";
    const virtualPassword = user + "password1248bit"; // Password ini harus kamu samakan saat buat user di Console

    firebase.auth().signInWithEmailAndPassword(virtualEmail, virtualPassword)
    .then(() => {
        // Jika Auth Berhasil, baru cek database Users
        return db.ref(`Users/${school}/${user}`).once('value');
    })
    .then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("Login & Auth Berhasil!");
            executeEntry(user, school, isChatMode, userData);
        } else {
            alert(`Nama '${user}' belum terverifikasi di ${school}.`);
            firebase.auth().signOut(); // Logout lagi kalau ternyata ga ada di DB
        }
    })
    .catch((error) => {
        console.error("Auth Error:", error.message);
        alert("Akses Ditolak: Akun belum aktif atau koneksi bermasalah.");
    });
}

// Fungsi executeEntry dan lainnya tetap sama seperti milikmu
function executeEntry(userName, userSchool, isChatMode, userData) {
    document.getElementById('login-page').style.display = 'none';
    
    const isVerified = !userData.status;

    if (isChatMode) {
        if ((userName === "azfarhhh" || userName === "gelishhh") && isVerified) {
            document.getElementById('secret-chat').style.display = 'block';
            if (typeof listenChat === "function") listenChat();
        } else {
            alert("Akses Chat Khusus CEO.");
            document.getElementById('public-homework').style.display = 'block';
            loadHomeworkToTable(userSchool);
        }
    } else {
        document.getElementById('public-homework').style.display = 'block';
        
        // --- BAGIAN YANG DIPERBAIKI: Judul Dinamis ---
        // Ganti logika Luau tadi jadi ini:
        const titleElement = document.getElementById('school-view-title');

        if (userSchool === "tonggalan") {
            titleElement.innerText = "Log Tugas SDN 1 Tonggalan";
        } else {
            titleElement.innerText = "Log Tugas SDN 2 Klaten";
        }

        // Pastikan load data sesuai sekolah yang dipilih saat login
        loadHomeworkToTable(userSchool);
    }
}

// Fungsi loadHomeworkToTable tetap sama
function loadHomeworkToTable(school) {
    const homeworkRef = db.ref(`homework/${school}`); 
    const tableBody = document.getElementById('homework-list');
    
    if (!tableBody) return;

    homeworkRef.on('value', (snapshot) => {
        tableBody.innerHTML = ""; 
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
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
            tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center'>Belum ada tugas.</td></tr>";
        }
    });
}
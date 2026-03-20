document.getElementById('date-info').innerText = "DATA TERKINI: " + new Date().toLocaleDateString('id-ID');
window.onload = () => {
    document.getElementById('login-btn').onclick = handleLogin;
};
const input = document.getElementById("comment-input");
commentsList = document.getElementById("comments-list");
const tableBody = document.getElementById("homework-list");
tableBody.addEventListener("click", function(event) {
    let tr = event.target.closest("tr");
    if (!tr) return;
    currentHomeworkKey = tr.dataset.key;
    document.getElementById("homework-reply").style.display = "block";
    loadComments(currentHomeworkKey);
});
input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        const text = input.value.trim();
        if (!text || !currentHomeworkKey) return;
        const user = firebase.auth().currentUser;
        if (!user) {
            alert("Silakan login terlebih dahulu untuk berkomentar.");
            return;
        }
        const username = user.displayName || user.email.split("@")[0];
        addCommentToDOM(username, text, false);
        db.ref(`HomeworkReplies/${school}/${currentHomeworkKey}/chat/${username}`).set({
            comment: text,
            pin: false
        });
        input.value = "";
    }
});

function addCommentToDOM(username, commentText, pin = false) {
        const div = document.createElement("div");
        div.className = "container comment";
        if (pin) div.dataset.pin = "true";

        const pinLabel = pin ? '<span class="pin-label">📌 Pinned</span>' : '';
        div.innerHTML = `
            <label>${username}:</label> ${pinLabel}
            <p>${commentText.replace(/\n/g, "<br>")}</p>
        `;

        if (pin) {
            commentsList.prepend(div); // pinned: top
        } else {
            commentsList.appendChild(div); // normal: bottom
        }
    }

const firebaseConfig = {
      apiKey: "AIzaSyDE1tJF3p4t-wOFQWLJlQr2eU12KG5_NAc",
      authDomain: "database-pr-sekolah.firebaseapp.com",
      databaseURL: "https://database-pr-sekolah-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "database-pr-sekolah",
      storageBucket: "database-pr-sekolah.firebasestorage.app",
      messagingSenderId: "699468097429",
      appId: "1:699468097429:web:197f697f86e6176e49b89c"
    };
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const auth = firebase.auth();


function handleLogin() {
    if (typeof grecaptcha === "undefined") {
        alert("CAPTCHA belum siap, tunggu sebentar!");
        return;
    } 

    const captchaResponse = grecaptcha.getResponse();
    if (captchaResponse.length === 0) {
        alert("Silakan centang CAPTCHA sebelum login!");
        location.reload();
        return;
    }

    const userField = document.getElementById('user-input');
    const keyField = document.getElementById('key-input');
    
    const user = userField.value.trim().toLowerCase();
    const keyInput = keyField.value.trim().toUpperCase(); 

    const keyTonggalan = "TGL5-CEO-A3";
    const keyKlaten2 = "KLT2-SAM-AR";

    let keyValid = false;
    school = "";
    if (keyInput === keyTonggalan) {
        keyValid = true;
        school = "tonggalan";
    } else if (keyInput === keyKlaten2) {
        keyValid = true;
        school = "klaten2";
    }

    if (!keyValid) {
        alert("Classroom Key salah atau tidak sesuai sekolah!");
        location.reload();
        return;
    }

    const virtualEmail = user + "@sekolah.com";
    const virtualPassword = user + "password1248bit";

    firebase.auth().signInWithEmailAndPassword(virtualEmail, virtualPassword)
    .then(() => {
        return db.ref(`Users/${school}/${user}`).once('value');
    })
    .then((snapshot) => {
        if (!snapshot.exists()) {
            window.location.href = "register.html";
            firebase.auth().signOut();
            return;
        }

        const userData = snapshot.val();
        if (userData.status === "unverified") {
            alert("Tolong tunggu 1x24 jam sebelum akun anda dicek");
            firebase.auth().signOut();
            location.reload();
            return;
        }

        console.log("Login & Auth Berhasil!");
        executeEntry(user, school, userData);
    })
    .catch((error) => {
        if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
            alert(`${user} tidak dikenal`);
        } else {
            console.error("Auth Error:", error.message);
            alert("Akses Ditolak: Akun belum aktif atau koneksi bermasalah.");
        }
        location.reload();
    });
}

// Fungsi executeEntry dan lainnya tetap sama seperti milikmu
function executeEntry(userName, userSchool, userData) {
    document.getElementById('login-page').style.display = 'none';
    
    const isVerified = !userData.status;

    document.getElementById('public-homework').style.display = 'block';
    
    const titleElement = document.getElementById('school-view-title');
    if (userSchool === "tonggalan") {
        titleElement.innerText = "Log Tugas SDN 1 Tonggalan";
    } else {
        titleElement.innerText = "Log Tugas SDN 1 Klaten";
    }
    loadHomeworkToTable(userSchool);
}

function loadHomeworkToTable(school) {
    const homeworkRef = db.ref(`Homework/${school}`); 
    const tableBody = document.getElementById('homework-list');
    
    if (!tableBody) return;

    homeworkRef.on('value', (snapshot) => {
        tableBody.innerHTML = ""; 
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                const homeworkKey = childSnapshot.key;
                const row = document.createElement("tr");
                row.dataset.key = homeworkKey;
                row.innerHTML = `
                    <td>${data.subject}</td>
                    <td>${data.task}</td>
                    <td><span class="status-badge">AKTIF</span></td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center'>Belum ada tugas.</td></tr>";
        }
    });
}

let currentHomeworkKey = null;

function loadComments(homeworkKey) {
    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = "";

    db.ref(`HomeworkReplies/${school}/${homeworkKey}/chat`)
    .on("value", snapshot => {
        snapshot.forEach(child => {
            const data = child.val();
            const username = child.key;
            addCommentToDOM(username, data.comment, data.pin);
        });
    });
}
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

const changeAvatarBtn = document.getElementById("change-avatar-btn");
const viewAvatar = document.getElementById("view-avatar");
const db = firebase.database();
const auth = firebase.auth();

async function fileToDataURL(file, maxWidth = 512, maxHeight = 512, outputType = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed reading file"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
        const w = Math.round(img.naturalWidth * ratio);
        const h = Math.round(img.naturalHeight * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL(outputType, quality));
      };
      img.onerror = () => reject(new Error("Gambar tidak valid"));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function setAvatar(user, school, dataUrl) {
  if (!user || !school || !dataUrl) throw new Error("Data tidak ditemukan");
  const ref = db.ref(`UserAvatar/${school}/${user}`);
  await ref.set(dataUrl);
  return dataUrl;
}

function updateAvatarUI(dataUrl) {
  if (!viewAvatar) return;
  viewAvatar.style.backgroundImage = `url("${dataUrl}")`;
  viewAvatar.style.backgroundSize = "cover";
  viewAvatar.style.backgroundPosition = "center";
  viewAvatar.style.backgroundRepeat = "no-repeat";
}

async function chooseAndUploadAvatar(school, user) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();
  input.onchange = async () => {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      const dataUrl = await fileToDataURL(file, 512, 512, "image/png", 0.92);
      await setAvatar(user, school, dataUrl);
      updateAvatarUI(dataUrl);
      alert("Avatar telah diupdate!");
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui avatar. Silakan coba gambar lain.");
    }
  };
}

auth.onAuthStateChanged((user) => {
  if (!user) {
    console.log("Sepertinya kamu belum masuk. Arahkan ke halaman login.");
    location.href = "index.html";
    return;
  }

  const username = (user.displayName || user.email.split("@")[0]).toLowerCase();
  const school = localStorage.getItem("school") || "tonggalan";
  const cleanedUsername = username.charAt(0).toUpperCase() + username.slice(1);

  db.ref(`UserAvatar/${school}/${username}`).once("value")
    .then(snapshot => {
      const val = snapshot.val();
      if (typeof val === "string" && val.trim() !== "") {
        updateAvatarUI(val);
      }
    })
    .catch(err => console.warn("Could not load avatar:", err));

  changeAvatarBtn.addEventListener("click", () => chooseAndUploadAvatar(school, username));
});
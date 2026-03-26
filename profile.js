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
const resetbtn = document.getElementById("reset-btn");
const settingbtn = document.getElementById("setting-btn");

let profileName = null;
let viewAvatar = null;

async function loadImageToBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function compressBase64Image(dataUrl, outputType = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL(outputType, quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function setDefaultAvatarIfMissing(user, school) {
  if (!user || !school) return;
  const avatarRef = db.ref(`UserAvatar/${school}/${user}`);
  const snap = await avatarRef.once("value");
  const value = snap.val();

  if (!value || value.trim() === "") {
    try {
      const guestBase = await loadImageToBase64("guest.png");
      const compressed = await compressBase64Image(guestBase, "image/png", 0.92);
      await avatarRef.set(compressed);
      console.log("Guest-avatar default set for", user);
    } catch (err) {
      console.error("Avatar default set failed:", err);
    }
  }
}

async function applyAvatarFromDB(user, school) {
  if (!viewAvatar) viewAvatar = document.getElementById("view-avatar");
  if (!viewAvatar) return;

  const snap = await db.ref(`UserAvatar/${school}/${user}`).once("value");
  const value = (snap.val() || "").toString().trim();
  const final = value || (await db.ref(`UserAvatar/${school}/guest`).once("value")).val();

  if (!final) return;
  viewAvatar.style.backgroundImage = `url("${final}")`;
  viewAvatar.style.backgroundSize = "cover";
  viewAvatar.style.backgroundPosition = "center";
  viewAvatar.style.backgroundRepeat = "no-repeat";
  viewAvatar.style.backgroundColor = "transparent";
}

async function initProfile() {
  profileName = document.getElementById("profile-name");
  viewAvatar = document.getElementById("view-avatar");

  const school = localStorage.getItem("school");
  const userFromStorage = localStorage.getItem("user");

  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    const username = (user.displayName || user.email.split("@")[0]).toLowerCase();
    const cleaned = username.charAt(0).toUpperCase() + username.slice(1);

    profileName.textContent = cleaned;

    const schoolToUse = school || localStorage.getItem("school") || "tonggalan";
    await setDefaultAvatarIfMissing(username, schoolToUse);
    await applyAvatarFromDB(username, schoolToUse);
  });
}

window.onload = initProfile;

resetbtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("school");
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("Sign out error:", error);
  });
});

settingbtn.addEventListener("click", () => {
  window.location.href = "settings.html";
});
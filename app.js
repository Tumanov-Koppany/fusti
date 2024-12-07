// Cloudflare R2 konfiguráció
const r2AccessKey = "a146328ee63abd38ae9af06a1b76ba44";  // Cloudflare R2 Access Key ID
const r2SecretKey = "7f854295eda50890ea3aa2059aa5ca34cab52541eb8d34231f356b479b15dedd";  // Cloudflare R2 Secret Access Key
const bucketName = "fusti";  // A Cloudflare R2 bucket neve
const region = "auto";  // A Cloudflare R2 régiója

// Az API URL és az alapértelmezett endpoint
const endpoint = `https://${bucketName}.r2.cloudflarestorage.com`;

// Firebase konfiguráció
const firebaseConfig = {
  apiKey: "AIzaSyDX-ZAxMmcLmYkCMHJeEBiyhh9GsUw4xGs",
  authDomain: "fusti-weboldal.firebaseapp.com",
  projectId: "fusti-weboldal",
  storageBucket: "fusti-weboldal.firebasestorage.app",
  messagingSenderId: "864091708031",
  appId: "1:864091708031:web:fa6d5fd5f05e3ccdcdfd4a"
};

// Firebase inicializálása
firebase.initializeApp(firebaseConfig);

// Firebase szolgáltatások
const auth = firebase.auth();
const db = firebase.firestore();

// Adminisztrátor e-mail cím
const adminEmail = "admin@example.com";

// Bejegyzések betöltése
function loadPosts() {
  fetch(`${endpoint}/uploads`)
    .then(response => response.json())
    .then(data => {
      const postsContainer = document.getElementById('posts');
      postsContainer.innerHTML = ''; // Törli a régi bejegyzéseket
      data.files.forEach(file => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        postElement.innerHTML = `<p>${file.content}</p>`;
        if (file.fileURL) {
          const fileLink = document.createElement('a');
          fileLink.href = `${endpoint}/uploads/${file.name}`;
          fileLink.textContent = `Letöltés: ${file.name}`;
          fileLink.target = '_blank';
          postElement.appendChild(fileLink);
        }
        postsContainer.appendChild(postElement);
      });
    })
    .catch(error => console.error('Hiba történt a fájlok lekérésekor:', error));
}

// Bejelentkezés funkció
document.getElementById('login')?.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      if (user.email === adminEmail) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('admin-container').style.display = 'block';
        document.getElementById('user-container').style.display = 'none';
        alert('Sikeres adminisztrátori bejelentkezés');
      } else {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('admin-container').style.display = 'none';
        document.getElementById('user-container').style.display = 'block';
        alert('Sikeres bejelentkezés felhasználóként');
      }
    })
    .catch(err => alert('Hiba történt a bejelentkezés során: ' + err.message));
});

// Figyelni, hogy van-e már bejelentkezett felhasználó
auth.onAuthStateChanged(user => {
  if (user) {
    // Ha be van jelentkezve, ellenőrizzük, hogy admin vagy felhasználó
    if (user.email === adminEmail) {
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('admin-container').style.display = 'block';
      document.getElementById('user-container').style.display = 'none';
    } else {
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('admin-container').style.display = 'none';
      document.getElementById('user-container').style.display = 'block';
    }
  } else {
    // Ha nincs bejelentkezve, akkor a bejelentkezési formot mutatjuk
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('admin-container').style.display = 'none';
    document.getElementById('user-container').style.display = 'none';
  }
});

// Új bejegyzés létrehozása (felhasználóként)
document.getElementById('submitPost')?.addEventListener('click', () => {
  const content = document.getElementById('postContent').value;
  const file = document.getElementById('fileUpload').files[0];

  if (!auth.currentUser) {
    alert("Be kell jelentkezned a bejegyzés létrehozásához!");
    return;
  }

  const formData = new FormData();
  formData.append("content", content);
  if (file) {
    const fileUrl = `${endpoint}/uploads/${file.name}`;

    // Fájl feltöltése a Cloudflare R2-be
    fetch(fileUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${r2AccessKey}:${r2SecretKey}`,
      },
      body: formData
    })
    .then(response => {
      if (response.ok) {
        console.log("Fájl sikeresen feltöltve");
        loadPosts();
      } else {
        alert("Hiba történt a fájl feltöltésekor");
      }
    })
    .catch(error => console.error("Fájl feltöltése hiba:", error));
  } else {
    // Ha nincs fájl, csak a bejegyzés szövegét küldjük el
    fetch(`${endpoint}/uploads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content,
        timestamp: new Date().toISOString()
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Bejegyzés hozzáadva:", data);
      loadPosts();
    })
    .catch(err => console.error("Bejegyzés hozzáadása hiba:", err));
  }
});

// Kijelentkezés
document.getElementById('logout')?.addEventListener('click', () => {
  auth.signOut().then(() => {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('admin-container').style.display = 'none';
    document.getElementById('user-container').style.display = 'none';
  }).catch(err => alert('Hiba történt a kijelentkezés során: ' + err.message));
});

// Bejegyzések betöltése kezdetben
loadPosts();

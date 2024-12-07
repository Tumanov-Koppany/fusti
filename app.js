// Firebase konfiguráció
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase inicializálása
firebase.initializeApp(firebaseConfig);

// Firebase szolgáltatások
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Adminisztrátor e-mail cím
const adminEmail = "admin@example.com";

// Bejegyzések betöltése
function loadPosts() {
  db.collection('posts').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
    const postsContainer = document.getElementById('posts');
    postsContainer.innerHTML = ''; // Törli a régi bejegyzéseket
    snapshot.forEach(doc => {
      const post = doc.data();
      const postElement = document.createElement('div');
      postElement.classList.add('post');
      postElement.innerHTML = `<p>${post.content}</p>`;
      if (post.fileURL) {
        const fileLink = document.createElement('a');
        fileLink.href = post.fileURL;
        fileLink.textContent = `Letöltés: ${post.fileName}`;
        fileLink.target = '_blank';
        postElement.appendChild(fileLink);
      }
      postsContainer.appendChild(postElement);
    });
  });
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

  if (file) {
    const storageRef = storage.ref(`uploads/${file.name}`);
    storageRef.put(file).then(snapshot => {
      snapshot.ref.getDownloadURL().then(downloadURL => {
        db.collection('posts').add({
          content,
          fileURL: downloadURL,
          fileName: file.name,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
    });
  } else {
    db.collection('posts').add({
      content,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  loadPosts(); // Bejegyzés betöltése azonnal
});

// Bejegyzések betöltése kezdetben
loadPosts();

// Kijelentkezés
document.getElementById('logout')?.addEventListener('click', () => {
  auth.signOut().then(() => {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('admin-container').style.display = 'none';
    document.getElementById('user-container').style.display = 'none';
  }).catch(err => alert('Hiba történt a kijelentkezés során: ' + err.message));
});

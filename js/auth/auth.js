import { auth, db } from '../firebase/firebaseConfig.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

//resmi metne çevir (base64)
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

//seçiciler
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const fileInput = document.getElementById('regPic');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const navLoginBtn = document.getElementById('navLoginBtn');
const navUserProfile = document.getElementById('navUserProfile');
const headerUsername = document.getElementById('headerUsername');
const headerAvatar = document.getElementById('headerAvatar');
const logoutBtn = document.getElementById('logoutBtn');

//şifre göster/gizle
document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('input');
        if (input) {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            this.classList.toggle('fa-eye-slash');
            this.classList.toggle('fa-eye');
        }
    });
});

//temel oturum takibi ve yönlendirmeler
onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";
    
    // index.html bazen boş string ("") olarak gelebilir, onu düzeltiyoruz
    const isHomePage = page === "index.html" || page === "" || page === "index";

    if (user) {
        console.log("Kullanıcı giriş yapmış:", user.email);

        //navbar düzenleme
        if (navLoginBtn) navLoginBtn.style.display = 'none';
        if (navUserProfile) {
            navUserProfile.style.display = 'flex';
            navUserProfile.style.alignItems = 'center'; // Görsel kaymasın
        }

        try {
            //Firestore'dan veri çekme
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                //navbar ı güncelleme
                if (headerUsername) headerUsername.innerText = data.username;
                if (headerAvatar) headerAvatar.src = data.photoURL;
            }
        } catch (e) {
            console.error("Firestore verisi çekilirken hata:", e);
        }

    } else {
        //giriş yapılmamışsa
        if (navLoginBtn) navLoginBtn.style.display = 'block';
        if (navUserProfile) navUserProfile.style.display = 'none';
        
        //korumalı sayfalar kontrolü
        const protectedPages = ['library.html', 'profile.html', 'book-detail.html', 'stats.html'];
        if (protectedPages.includes(page)) {
            window.location.href = 'login.html';
        }
    }
});

//giriş yapma işlemi
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginBtn = loginForm.querySelector('.btn-primary');
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPass').value;

        try {
            loginBtn.innerText = "Giriş yapılıyor...";
            await signInWithEmailAndPassword(auth, email, pass);
            //başarılı girişte index.html'e git
            window.location.href = 'index.html';
        } catch (error) {
            loginBtn.innerText = "Giriş Yap";
            console.error("Giriş hatası:", error);
            alert("E-posta veya şifre hatalı.");
        }
    });
}

//kayıt olma işlemi
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        fileNameDisplay.innerText = e.target.files[0] ? e.target.files[0].name : "Henüz dosya seçilmedi";
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = registerForm.querySelector('.btn-primary');
        const username = document.getElementById('regUser').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('loginPass').value;
        const profileFile = fileInput.files[0];

        if (!profileFile) return alert("Lütfen bir profil fotoğrafı seçin.");

        try {
            submitBtn.innerText = "Hesap Oluşturuluyor...";
            submitBtn.disabled = true;

            //Firebase Auth üzerinde kullanıcı oluştur
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            //resmi metne çevir
            const photoBase64 = await toBase64(profileFile);

            //auth profilini güncelle (sadece isim)
            await updateProfile(user, { displayName: username });

            //tüm verileri Firestore'a kaydet (resim dahil)
            await setDoc(doc(db, "users", user.uid), {
                username: username,
                photoURL: photoBase64,
                email: email,
                createdAt: new Date()
            });

            //başarılı kayıtta index.html'e git
            window.location.href = 'index.html';
        } catch (error) {
            submitBtn.innerText = "Kayıt Ol";
            submitBtn.disabled = false;
            console.error("Kayıt hatası:", error);
            alert("Hata: " + error.message);
        }
    });
}

//çıkış yapma işlemi
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (confirm("Çıkış yapmak istediğinize emin misiniz?")) {
            try {
                await signOut(auth);
                window.location.href = 'login.html';
            } catch (error) {
                console.error("Çıkış hatası:", error);
                alert("Çıkış yapılırken bir hata oluştu.");
            }
        }
    });
}
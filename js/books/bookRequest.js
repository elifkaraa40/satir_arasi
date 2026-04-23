import { db, auth } from "../firebase/firebaseConfig.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
console.log("BookRequest dosyası başarıyla yüklendi!");

export class BookRequest {
    constructor() {
        this.section = document.getElementById('request-book-section');
        this.form = document.getElementById('book-request-form');
        this.showBtn = document.getElementById('show-request-form-btn');
        this.submitBtn = document.getElementById('submit-request-btn');
        
        this.init();
    }

    init() {
        // Formu açma butonu
        this.showBtn?.addEventListener('click', () => {
            this.form.style.display = 'flex';
            this.showBtn.style.display = 'none';
        });

        // Gönderme butonu
        this.submitBtn?.addEventListener('click', () => this.handleRequest());
    }

    async handleRequest() {
        const user = auth.currentUser;
        if (!user) return alert("İstek göndermek için giriş yapmalısınız!");

        const title = document.getElementById('req-title').value.trim();
        const author = document.getElementById('req-author').value.trim();
        const year = document.getElementById('req-year').value.trim();

        if (!title || !author) return alert("Kitap adı ve yazar alanları zorunludur!");

        try {
            await addDoc(collection(db, "kitapIstekleri"), {
                userId: user.uid,
                userEmail: user.email,
                bookTitle: title,
                bookAuthor: author,
                publishYear: year || "Belirtilmedi",
                status: "Beklemede",
                createdAt: serverTimestamp()
            });

            alert("İsteğiniz başarıyla kaydedildi!");
            this.form.reset();
            this.section.style.display = 'none';
        } catch (error) {
            console.error("Hata:", error);
            alert("İstek gönderilemedi.");
        }
    }

    // library.js'den çağırılacak fonksiyon
    toggleVisibility(show) {
        if (this.section) {
          this.section.style.setProperty('display', show ? 'flex' : 'none', 'important');
    }
    }
}
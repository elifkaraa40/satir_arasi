import { auth, db } from '../firebase/firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    let allBooks = []; 
    const headerUsername = document.getElementById('headerUsername');
    const headerAvatar = document.getElementById('headerAvatar');
    const navUserProfile = document.getElementById('navUserProfile');
    const navLoginBtn = document.getElementById('navLoginBtn');
    const welcomeNameSpan = document.querySelector('.user-name-span');
    const logoutBtn = document.getElementById('logoutBtn');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();

                    // 1. HEDEFİ LOCALSTORAGE'DAN AL (my-library ile tam uyum)
                    const userGoals = JSON.parse(localStorage.getItem('myUserGoals')) || { "2026": 8, "2025": 12, "2024": 15 };
                    const currentYear = new Date().getFullYear().toString();
                    const hedef = userGoals[currentYear] || 8;

                    // 2. SADECE BU YIL OKUNANLARI SAY
                    const libraryRef = collection(db, "users", user.uid, "library");
                    const qRead = query(libraryRef, where("status", "==", "Okuduklarım"));
                    const readSnap = await getDocs(qRead);
                    
                    let okunan = 0;
                    readSnap.forEach(doc => {
                        const d = doc.data();
                        if(d.readYear === currentYear || (!d.readYear && currentYear === "2026")) {
                            okunan++;
                        }
                    });

                    // 3. Arayüzü ve Çemberi Güncelle
                    updateReadingGoal(okunan, hedef);

                    fetchCurrentBooks(user.uid);
                    if (welcomeNameSpan) welcomeNameSpan.innerText = data.username || "Okur";
                }
            } catch (e) {
                console.error("Dashboard veri hatası:", e);
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    const profileDropdown = document.querySelector('.user-profile-dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (profileDropdown && dropdownMenu) {
        let timeout;
        profileDropdown.addEventListener('mouseenter', () => {
            clearTimeout(timeout);
            dropdownMenu.style.opacity = '1';
            dropdownMenu.style.visibility = 'visible';
            dropdownMenu.style.transform = 'translateY(0)';
        });

        profileDropdown.addEventListener('mouseleave', () => {
            timeout = setTimeout(() => {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
                dropdownMenu.style.transform = 'translateY(10px)';
            }, 300);
        });

        dropdownMenu.addEventListener('mouseenter', () => clearTimeout(timeout));
    }

    async function fetchCurrentBooks(userId) {
        const container = document.getElementById('current-books-container');
        if (!container) return;

        try {
            const q = query(collection(db, "users", userId, "library"), where("status", "==", "Okunuyor"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                container.innerHTML = `
                <div style="text-align:center; padding:20px; color:#666;">
                    <p>Şu an aktif bir okumanız bulunmuyor.</p>
                    <a href="library.html" style="color:#4a6b6f; font-size:0.9rem;">Kitap eklemek için tıkla</a>
                </div>`;
                return;
            }

            const books = [];
            querySnapshot.forEach((doc) => books.push({ id: doc.id, ...doc.data() }));

            container.innerHTML = books.map(book => {
                const progress = book.progress || Math.round(((book.currentPage || 0) / (book.totalPages || 1)) * 100);
                return `
            <div class="book-item" onclick="window.location.href='book-detail.html?id=${book.id}'" style="cursor: pointer;">
                <img src="${book.cover || 'img/default-book.jpg'}" alt="${book.title}">
                <div class="book-info">
                    <h4>${book.title}</h4>
                    <p>${book.author}</p>
                    <div class="progress-bar"><span style="width: ${progress}%;"></span></div>
                    <span>%${progress} tamamlandı</span>
                </div>
            </div>`;
            }).join('');
        } catch (error) {
            console.error("Dashboard kitap yükleme hatası:", error);
            container.innerHTML = '<p>Veriler yüklenirken bir hata oluştu.</p>';
        }
    }

    const searchInput = document.getElementById('searchInput');
    const suggestionsPanel = document.getElementById('searchSuggestions');

    if (searchInput && suggestionsPanel) {
        searchInput.addEventListener('input', async (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (term.length < 2) {
                suggestionsPanel.style.display = 'none';
                return;
            }
            try {
                const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${term}&printType=books&orderBy=relevance&langRestrict=tr&maxResults=8`);
                const data = await response.json();
                renderSearchSuggestions(data.items || []);
            } catch (error) { console.error("Arama hatası:", error); }
        });
    }

    function renderSearchSuggestions(books) {
        if (books.length === 0) {
            suggestionsPanel.innerHTML = '<div style="padding:15px; font-size:0.9rem; color: #666;">Sonuç bulunamadı.</div>';
        } else {
            suggestionsPanel.innerHTML = books.map(item => `
            <div class="suggestion-item" onclick="window.location.href='book-detail.html?id=${item.id}'">
                <img src="${item.volumeInfo.imageLinks?.thumbnail || 'img/default-book.jpg'}" alt="">
                <div class="suggestion-info">
                    <h5>${item.volumeInfo.title}</h5>
                    <p>${item.volumeInfo.authors?.join(', ') || 'Bilinmeyen Yazar'}</p>
                </div>
            </div>`).join('');
        }
        suggestionsPanel.style.display = 'block';
    }

    document.addEventListener('click', (e) => {
        if (suggestionsPanel && !e.target.closest('.search-container')) suggestionsPanel.style.display = 'none';
    });

    const recContainer = document.getElementById('rec-container');
    const showMoreBtn = document.getElementById('show-more-btn');

    async function fetchRecommendations() {
        if (!recContainer) return;
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=subject:fiction+modern+edebiyat+roman&printType=books&orderBy=relevance&langRestrict=tr&maxResults=40`);
            const data = await response.json();
            const forbiddenKeywords = ['yıllığı', 'ansiklopedisi', 'sözlüğü', 'araştırmaları', 'dergisi', 'fakültesi', 'eğitim', 'ders', 'tez', 'makale', 'sempozyum', 'tarihi', 'rehberi', 'kılavuzu', 'incelemesi', 'üzerine', 'rapor'];
            
            const literaryBooks = (data.items || []).filter(item => {
                const title = item.volumeInfo.title?.toLowerCase() || "";
                return item.volumeInfo.imageLinks?.thumbnail && !forbiddenKeywords.some(word => title.includes(word));
            });

            const selected = literaryBooks.sort(() => 0.5 - Math.random()).slice(0, 6);
            renderRecommendations(selected);
        } catch (error) { console.error("Öneriler çekilemedi:", error); }
    }
    
    function renderRecommendations(books) {
        if (!recContainer) return;
        recContainer.innerHTML = books.map(item => {
            const info = item.volumeInfo;
            const safeTitle = info.title.replace(/"/g, '&quot;');
            const safeAuthor = (info.authors?.join(', ') || 'Bilinmeyen Yazar').replace(/"/g, '&quot;');
            return `
            <div class="recommendation-item" onclick="location.href='book-detail.html?id=${item.id}'" style="cursor: pointer;">
                <img src="${info.imageLinks?.thumbnail || 'img/default-book.jpg'}" alt="${safeTitle}">
                <div class="rec-info">
                    <h4>${safeTitle}</h4>
                    <p>${safeAuthor}</p>
                    <div class="tags"><span>${info.categories?.[0] || 'Genel'}</span></div>
                </div>
            </div>`;
        }).join('');
    }

    // --- HEDEF ÇEMBERİNİ GÜNCELLEME VE KESKİN BOYAMA ---
    function updateReadingGoal(read, total) {
        if (!total || total <= 0) total = 8; // Sıfıra bölünmeyi engelle
        
        let percent = Math.round((read / total) * 100);
        const safePercent = percent > 100 ? 100 : percent;
        const degree = (safePercent / 100) * 360;

        const targetPercentEl = document.getElementById('target-percent');
        const booksReadEl = document.getElementById('books-read');
        const totalTargetEl = document.getElementById('total-target');
        
        if (targetPercentEl) targetPercentEl.innerText = `%${safePercent}`;
        if (booksReadEl) booksReadEl.innerText = read;
        if (totalTargetEl) totalTargetEl.innerText = total;

        const circularProgress = document.querySelector('.circular-progress');
        if (circularProgress) {
            // "0deg" taktiği ile renklerin birbirine karışmasını engelliyoruz
            circularProgress.style.background = `conic-gradient(#4a6b6f ${degree}deg, rgba(74, 107, 111, 0.2) 0deg)`;
        }
    }

    if (showMoreBtn) showMoreBtn.addEventListener('click', fetchRecommendations);
    fetchRecommendations();
});
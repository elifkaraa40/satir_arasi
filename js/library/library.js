//kullanıcının kitaplığını gösterme
// js/library/library.js

// Sayfa yüklendiğinde çalışacak kısım
window.addEventListener('DOMContentLoaded', () => {
    // URL'deki ?search=kelime kısmını oku
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');

    if (searchQuery) {
        // Arama kutusuna gelen kelimeyi yaz
        const inputField = document.getElementById('searchInput');
        if(inputField) inputField.value = searchQuery;

        // Otomatik aramayı başlat
        fetchBooks(searchQuery); 
    }
});



const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const booksContainer = document.getElementById('books-container');

// Arama butonuna tıklama olayı
searchBtn.addEventListener('click', () => {
    const query = searchInput.value;
    if (query) {
        fetchBooks(query);
    }
});

async function fetchBooks(query) {
    booksContainer.innerHTML = '<p>Kitaplar aranıyor...</p>';
    
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=20`);
        const data = await response.json();
        
        displayBooks(data.items);
    } catch (error) {
        console.error("Hata oluştu:", error);
        booksContainer.innerHTML = '<p>Bir hata oluştu, lütfen tekrar deneyin.</p>';
    }
}

function displayBooks(books) {
    booksContainer.innerHTML = ''; // İçeriği temizle

    if (!books) {
        booksContainer.innerHTML = '<p>Maalesef kitap bulunamadı.</p>';
        return;
    }

    books.forEach(book => {
        const info = book.volumeInfo;
        const thumbnail = info.imageLinks ? info.imageLinks.thumbnail : 'https://via.placeholder.com/128x192?text=Kapak+Yok';
        
        const bookCard = `
            <div class="book-card">
                <img src="${thumbnail}" alt="${info.title}">
                <div class="book-info">
                    <h3>${info.title}</h3>
                    <p>${info.authors ? info.authors.join(', ') : 'Bilinmeyen Yazar'}</p>
                    <button class="add-btn" onclick="addToMyLibrary('${book.id}', '${info.title}')">
                        Kitaplığıma Ekle
                    </button>
                </div>
            </div>
        `;
        booksContainer.innerHTML += bookCard;
    });
}

// Şimdilik sadece konsola yazdıralım, sonra Firebase'e bağlayacağız
function addToMyLibrary(id, title) {
    alert(title + " yakında kitaplığına eklenecek! (Firebase entegrasyonu sıradaki adım)");
}


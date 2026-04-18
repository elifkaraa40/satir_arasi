//okuma durumu güncelleme
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { db, auth } from "../firebase/firebaseConfig.js";

export const updateUserReadingGoal = async (newGoal) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Oturum bulunamadı.");

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { readingGoal: newGoal }, { merge: true });
};

// Kitap durumunu güncellemek istersen (Okunuyor -> Okundu gibi)
export const updateBookStatus = async (bookId, newData) => {
    const user = auth.currentUser;
    const bookRef = doc(db, "users", user.uid, "kullaniciKitapligi", bookId);
    await setDoc(bookRef, newData, { merge: true });
};
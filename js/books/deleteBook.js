import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { db, auth } from "../firebase/firebaseConfig.js";

export const deleteBookFromLibrary = async (bookId) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Kullanıcı oturumu açmamış.");

    try {
        const docRef = doc(db, "users", user.uid, "kullaniciKitapligi", bookId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Silme hatası:", error);
        throw error;
    }
};
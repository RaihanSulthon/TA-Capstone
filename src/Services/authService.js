import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

import {doc, setDoc} from "firebase/firestore";
import { auth, db } from "../firebase-config";

// Untuk validasi email telkom
const isValidTelkomEmail = (email) => {
    return (
      email.endsWith("@student.telkomuniversity.ac.id") || 
      email.endsWith("@telkomuniversity.ac.id") ||
      email === "admin@capstone.ac.id"
    );
  };

// SignUp User
export const registerUser = async (email, password, userData) => {
    try{
        // Validate email format first
        if (!isValidTelkomEmail(email)) {
            return { 
                success: false, 
                error: "Email must be from Telkom University (@student.telkomuniversity.ac.id for students, @telkomuniversity.ac.id for lecturers)" 
            };
        }
        
        // Validate password length
        if (password.length < 6) {
            return { 
                success: false, 
                error: "Password must be at least 6 characters" 
            };
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        let role = "student";
        if (email.endsWith("@telkomuniversity.ac.id")) {
          role = "lecturer";
        } else if (email === "admin@capstone.ac.id") {
          role = "admin";
        }

        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: role,
            ...userData,
            createdAt: new Date()
        });

        return {success: true, user};
    }catch(error){
        console.error("Registration error:", error.code, error.message);
        let errorMessage = error.message;
    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = "Email/Password sign-up is not enabled. Please contact administrator.";
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = "This email is already registered.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Password should be at least 6 characters.";
    }
    
    return { success: false, error: errorMessage, code: error.code };
    };
};

//Login User
export const loginUser = async (email, password) => {
    try{
        const userCredential = await signInWithEmailAndPassword(auth,email,password);
        return{success: true, user: userCredential.user};
    }catch(error){
        return{success: false, error: error.message};
    }
};

//Logout User
export const logoutUser = async ()=> {
    try{
        await signOut(auth);
        return {success: true};
    }catch (error){
        return {success: false, error: error.message};
    }
};

// Get current auth state
export const getCurrentUser = () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  };
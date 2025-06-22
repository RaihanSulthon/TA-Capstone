// src/services/authService.js - Fixed to set role correctly
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
      email.endsWith("@adminhelpdesk.ac.id")
    );
  };
  
  // SignUp User
  export const registerUser = async (email, password, userData) => {
    try{
        // Validate email format first
        if (!isValidTelkomEmail(email)) {
            return { 
                success: false, 
                error: "Email must contain (@student.telkomuniversity.ac.id or @telkomuniversity.ac.id)" 
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
        if (email.endsWith("@adminhelpdesk.ac.id")) {
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {success: true, user: userCredential.user};
  }catch(error){
    console.error("Login error: ", error.code, error.message);
    let errorMessage = "Login gagal. Silahkan coba lagi";
  
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      errorMessage = "Email atau password yang Anda masukkan salah.";
    } else if (error.code === 'auth/user-disabled') {
        errorMessage = "Akun Anda telah dinonaktifkan. Silakan hubungi administrator.";
    } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Terlalu banyak percobaan login. Silakan coba lagi nanti.";
    } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Format email tidak valid.";
    } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Gagal terhubung ke server. Periksa koneksi internet Anda.";
    }
    
    return {success: false, error: errorMessage, code: error.code};
  }
  }
  
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
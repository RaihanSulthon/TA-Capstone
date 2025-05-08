import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

import {doc, setDoc} from "firebase/firestore";
import { auth, db } from "../firebase-config";

// SignUp User
export const registerUser = async (email, password, userData) => {
    try{
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            email: email,
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
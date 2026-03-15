// firebase-config.js
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged 
} from "firebase/auth";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy,
    serverTimestamp 
} from "firebase/firestore";
import { 
    getDatabase, 
    ref, 
    set, 
    get,
    push,
    onValue,
    remove 
} from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCvrU7BvAZNL7wMuJh0oQ9-8HuiFOmwVIo",
    authDomain: "eh-gen-x.firebaseapp.com",
    databaseURL: "https://eh-gen-x-default-rtdb.firebaseio.com",
    projectId: "eh-gen-x",
    storageBucket: "eh-gen-x.firebasestorage.app",
    messagingSenderId: "702774027026",
    appId: "1:702774027026:web:e290bfadd3aa99f41549cb",
    measurementId: "G-BDQ340MS33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app); // Firestore
const rtdb = getDatabase(app); // Realtime Database

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Analytics functions
export const logPageView = (pageName) => {
    logEvent(analytics, 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname
    });
};

export const logUserAction = (actionName, actionData = {}) => {
    logEvent(analytics, 'user_action', {
        action: actionName,
        ...actionData,
        timestamp: new Date().toISOString()
    });
};

// Authentication functions
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        logUserAction('sign_in', { method: 'google', userId: result.user.uid });
        return { success: true, user: result.user };
    } catch (error) {
        console.error("Sign in error:", error);
        logUserAction('sign_in_error', { error: error.message });
        return { success: false, error: error.message };
    }
};

export const signOutUser = async () => {
    try {
        await signOut(auth);
        logUserAction('sign_out');
        return { success: true };
    } catch (error) {
        console.error("Sign out error:", error);
        return { success: false, error: error.message };
    }
};

export const getCurrentUser = () => {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            resolve(user);
        });
    });
};

// Firestore functions - Posts
export const addPost = async (postData) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const docRef = await addDoc(collection(db, "posts"), {
            ...postData,
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userEmail: user.email,
            timestamp: serverTimestamp(),
            likes: 0,
            views: 0
        });
        
        logUserAction('add_post', { postId: docRef.id });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Add post error:", error);
        return { success: false, error: error.message };
    }
};

export const getPosts = async () => {
    try {
        const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(postsQuery);
        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, posts };
    } catch (error) {
        console.error("Get posts error:", error);
        return { success: false, error: error.message };
    }
};

// Realtime Database functions - Comments
export const addComment = async (postId, commentText) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const commentsRef = ref(rtdb, `comments/${postId}`);
        const newCommentRef = push(commentsRef);
        
        await set(newCommentRef, {
            text: commentText,
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userPhoto: user.photoURL || '',
            timestamp: Date.now(),
            likes: 0
        });

        logUserAction('add_comment', { postId });
        return { success: true, id: newCommentRef.key };
    } catch (error) {
        console.error("Add comment error:", error);
        return { success: false, error: error.message };
    }
};

export const getComments = (postId, callback) => {
    const commentsRef = ref(rtdb, `comments/${postId}`);
    
    onValue(commentsRef, (snapshot) => {
        const data = snapshot.val();
        const comments = [];
        if (data) {
            Object.keys(data).forEach(key => {
                comments.push({ id: key, ...data[key] });
            });
            // Sort by timestamp descending
            comments.sort((a, b) => b.timestamp - a.timestamp);
        }
        callback(comments);
    });
};

// Like post function
export const likePost = async (postId) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const likesRef = ref(rtdb, `likes/${postId}/${user.uid}`);
        const postLikesRef = ref(rtdb, `postLikes/${postId}`);
        
        // Check if already liked
        const likeSnapshot = await get(likesRef);
        
        if (likeSnapshot.exists()) {
            // Unlike
            await remove(likesRef);
            await set(postLikesRef, (await get(postLikesRef)).val() - 1);
            logUserAction('unlike_post', { postId });
            return { success: true, action: 'unliked' };
        } else {
            // Like
            await set(likesRef, {
                timestamp: Date.now(),
                userName: user.displayName || 'Anonymous'
            });
            
            const currentLikes = await get(postLikesRef);
            await set(postLikesRef, (currentLikes.val() || 0) + 1);
            
            logUserAction('like_post', { postId });
            return { success: true, action: 'liked' };
        }
    } catch (error) {
        console.error("Like post error:", error);
        return { success: false, error: error.message };
    }
};

export const getPostLikes = (postId, callback) => {
    const postLikesRef = ref(rtdb, `postLikes/${postId}`);
    onValue(postLikesRef, (snapshot) => {
        callback(snapshot.val() || 0);
    });
};

// Track post view
export const trackPostView = async (postId) => {
    try {
        const viewsRef = ref(rtdb, `postViews/${postId}`);
        const currentViews = await get(viewsRef);
        await set(viewsRef, (currentViews.val() || 0) + 1);
    } catch (error) {
        console.error("Track view error:", error);
    }
};

// Export all modules
export { 
    app, 
    analytics, 
    auth, 
    db, 
    rtdb 
};
import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app;
  private auth;
  private firestore;
  
  public currentUser: any = null;

  constructor(
    private router: Router,
    private storage: Storage
  ) {
    // 1. Initialize Firebase
    this.app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
    
    // 2. Listen for auth state changes
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        console.log('User logged in:', user.uid);
        await this.storage.set('userId', user.uid);
      } else {
        console.log('User logged out');
        await this.storage.remove('userId');
      }
    });
    
    // 3. Initialize storage
    this.storage.create();
  }

  // === AUTHENTICATION METHODS ===
  
  async signInAnonymously(userName: string): Promise<any> {
    try {
      // Sign in to Firebase anonymously
      const authResult = await signInAnonymously(this.auth);
      const userId = authResult.user.uid;
      
      // Create user document in Firestore
      const userDocRef = doc(this.firestore, 'users', userId);
      await setDoc(userDocRef, {
        name: userName,
        photoURL: this.generateAvatarUrl(userName),
        online: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      // Store user data locally
      this.currentUser = {
        id: userId,
        name: userName,
        photoURL: this.generateAvatarUrl(userName)
      };
      
      console.log('User created:', this.currentUser);
      
      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
      
      return this.currentUser;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }
  
  async signOut(): Promise<void> {
    try {
      // Update user status to offline
      if (this.currentUser?.id) {
        const userDocRef = doc(this.firestore, 'users', this.currentUser.id);
        await updateDoc(userDocRef, {
          online: false,
          lastSeen: serverTimestamp()
        });
      }
      
      // Sign out from Firebase
      await signOut(this.auth);
      this.currentUser = null;
      
      // Navigate to welcome page
      this.router.navigate(['/welcome']);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
  
  // === FIRESTORE REAL-TIME METHODS ===
  
  // Get all users except current user (REAL Firestore query)
  async getUsers(excludeUserId: string): Promise<any[]> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('__name__', '!=', excludeUserId));
      const querySnapshot = await getDocs(q);
      
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('Real users loaded:', users.length);
      return users;
    } catch (error) {
      console.error('Error loading users from Firestore:', error);
      // Fallback to mock users if Firestore fails
      return this.getMockUsers(excludeUserId);
    }
  }
  
  // REAL-TIME: Subscribe to users (for dashboard)
  subscribeToUsers(excludeUserId: string, callback: (users: any[]) => void): () => void {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('__name__', '!=', excludeUserId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      callback(users);
    });
    
    return unsubscribe;
  }
  
  // REAL-TIME: Subscribe to messages in a chat
  subscribeToMessages(userId1: string, userId2: string, callback: (messages: any[]) => void): () => void {
    const chatId = [userId1, userId2].sort().join('_');
    const messagesRef = collection(this.firestore, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: any[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages);
    });
    
    return unsubscribe;
  }
  
  // Send message (REAL Firestore)
  async sendMessage(senderId: string, receiverId: string, text: string): Promise<void> {
    try {
      const chatId = [senderId, receiverId].sort().join('_');
      const messagesRef = collection(this.firestore, 'chats', chatId, 'messages');
      
      // Add the message
      await addDoc(messagesRef, {
        text: text,
        senderId: senderId,
        receiverId: receiverId,
        timestamp: serverTimestamp(),
        read: false
      });
      
      console.log('Message sent to Firestore');
      
      // Update the chat document with last message info
      const chatDocRef = doc(this.firestore, 'chats', chatId);
      await setDoc(chatDocRef, {
        participants: [senderId, receiverId],
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: senderId
      }, { merge: true });
      
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  // Get user by ID (for chat room)
  async getUser(userId: string): Promise<any> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
  
  // === HELPER METHODS ===
  
  // Check if user is already logged in
  async checkExistingUser(): Promise<any> {
    const storedUserId = await this.storage.get('userId');
    if (storedUserId) {
      try {
        const userDocRef = doc(this.firestore, 'users', storedUserId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          this.currentUser = { id: storedUserId, ...userDoc.data() };
          console.log('Existing user found:', this.currentUser);
          return this.currentUser;
        }
      } catch (error) {
        console.log('No existing user found in Firestore');
      }
    }
    return null;
  }
  
  private generateAvatarUrl(name: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const firstLetter = name.charAt(0).toUpperCase();
    const colorIndex = firstLetter.charCodeAt(0) % colors.length;
    const color = colors[colorIndex];
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${color}" rx="50"/>
      <text x="50" y="60" text-anchor="middle" fill="white" font-size="40" font-family="Arial">${firstLetter}</text>
    </svg>`;
    
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }
  
  // Fallback mock users
  private getMockUsers(excludeUserId: string): any[] {
    const mockUsers = [
      { id: 'user1', name: 'Alex', online: true, photoURL: this.generateAvatarUrl('Alex') },
      { id: 'user2', name: 'Jordan', online: true, photoURL: this.generateAvatarUrl('Jordan') },
      { id: 'user3', name: 'Taylor', online: false, photoURL: this.generateAvatarUrl('Taylor') }
    ];
    return mockUsers.filter(user => user.id !== excludeUserId);
  }
}
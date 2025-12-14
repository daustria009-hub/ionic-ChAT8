import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ImageService } from './image.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: any;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private storage: Storage,
    private router: Router,
    private imageService: ImageService
  ) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
  }

  // Initialize user (called on app start)
  async initUser() {
    const storedUserId = await this.storage.get('userId');
    
    if (storedUserId) {
      try {
        // User exists, get from Firestore
        const userDoc = await firstValueFrom(
          this.firestore.collection('users').doc(storedUserId).get()
        );
        
        const userData = userDoc.data() as any;
        
        if (userData) {
          // Get profile image from local storage
          const localImage = await this.imageService.getImageFromStorage(storedUserId);
          
          // Generate avatar if photoURL doesn't exist
          let photoURL = userData.photoURL;
          if (!photoURL || photoURL === '') {
            photoURL = this.imageService.generateAvatarFromName(userData.name || 'User');
          }
          
          this.currentUser = { 
            id: storedUserId, 
            ...userData,
            localPhotoURL: localImage || photoURL,
            photoURL: photoURL
          };
          
          return this.currentUser;
        }
      } catch (error) {
        console.error('Error loading user from Firestore:', error);
      }
    }
    
    return null;
  }

  // Create new user (first time)
  async createUser(name: string, photoBase64?: string): Promise<any> {
    try {
      console.log('Creating user with name:', name);
      
      // Create anonymous auth user
      const authResult = await this.afAuth.signInAnonymously();
      const userId = authResult.user?.uid;

      if (!userId) {
        throw new Error('No user ID generated');
      }

      console.log('Firebase anonymous user created with ID:', userId);
      
      // Generate SVG avatar
      const avatarSvg = this.imageService.generateAvatarFromName(name);
      
      const userData = {
        name,
        photoURL: avatarSvg,
        online: true,
        lastSeen: new Date(),
        createdAt: new Date()
      };

      console.log('Saving user to Firestore...');
      
      // Save to Firestore
      await this.firestore.collection('users').doc(userId).set(userData);
      
      console.log('User saved to Firestore');
      
      // Store locally
      await this.storage.set('userId', userId);
      
      // Save profile image locally if provided
      if (photoBase64 && photoBase64.startsWith('data:image')) {
        await this.imageService.saveImageToStorage(userId, photoBase64);
      }
      
      this.currentUser = { 
        id: userId, 
        ...userData,
        localPhotoURL: photoBase64 || avatarSvg
      };

      console.log('User creation complete:', this.currentUser);
      
      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
      
      return this.currentUser;
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Check console for details.');
      throw error;
    }
  }

  // Update user with new profile picture
  async updateProfilePicture(photoBase64: string): Promise<void> {
    if (this.currentUser?.id && photoBase64) {
      await this.imageService.saveImageToStorage(this.currentUser.id, photoBase64);
      this.currentUser.localPhotoURL = photoBase64;
      await this.firestore.collection('users').doc(this.currentUser.id).update({
        hasCustomPhoto: true
      });
    }
  }

  // Update user status
  async updateUserStatus(online: boolean) {
    if (this.currentUser?.id) {
      await this.firestore.collection('users').doc(this.currentUser.id).update({
        online,
        lastSeen: new Date()
      });
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async logout() {
    await this.updateUserStatus(false);
    await this.storage.remove('userId');
    await this.afAuth.signOut();
    this.currentUser = null;
    this.router.navigate(['/welcome']);
  }

  // Get user by ID
  getUser(userId: string) {
    return this.firestore.collection('users').doc(userId).valueChanges();
  }

}
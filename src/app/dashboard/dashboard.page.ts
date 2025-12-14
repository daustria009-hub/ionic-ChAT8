import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit, OnDestroy {
  users: any[] = [];
  currentUser: any;
  private unsubscribeUsers: (() => void) | null = null;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private imageService: ImageService
  ) {}

  async ngOnInit() {
    console.log('Dashboard loaded');
    
    // Get current user
    this.currentUser = this.firebaseService.currentUser;
    
    if (!this.currentUser) {
      const existingUser = await this.firebaseService.checkExistingUser();
      if (!existingUser) {
        this.router.navigate(['/welcome']);
        return;
      }
      this.currentUser = existingUser;
    }

    // Subscribe to real-time users list
    this.unsubscribeUsers = this.firebaseService.subscribeToUsers(
      this.currentUser.id,
      (users) => {
        console.log('Real-time users update:', users.length);
        
        // Process users
        this.users = users.map((user: any) => {
          if (!user.photoURL || user.photoURL === '') {
            user.photoURL = this.imageService.generateAvatarFromName(user.name || 'User');
          }
          return {
            ...user,
            displayPhoto: user.photoURL
          };
        });
        
        // If no users, show mock users for testing
        if (this.users.length === 0) {
          console.log('No users found, showing mock data');
          this.users = [
            { 
              id: 'user1', 
              name: 'Alex', 
              online: true, 
              displayPhoto: this.imageService.generateAvatarFromName('Alex') 
            },
            { 
              id: 'user2', 
              name: 'Jordan', 
              online: true, 
              displayPhoto: this.imageService.generateAvatarFromName('Jordan') 
            },
            { 
              id: 'user3', 
              name: 'Taylor', 
              online: false, 
              displayPhoto: this.imageService.generateAvatarFromName('Taylor') 
            }
          ];
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.unsubscribeUsers) {
      this.unsubscribeUsers();
    }
  }

  openChat(user: any) {
    console.log('Opening chat with:', user.name);
    this.router.navigate(['/chat-room', user.id]);
  }

  async logout() {
    console.log('Logging out');
    await this.firebaseService.signOut();
  }

}

import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase.service'; // NEW
import { ImageService } from '../services/image.service'; // Keep this
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: false,
})
export class WelcomePage {
  userName: string = '';
  profilePic: string = ''; // ADD this property
  
  constructor(
    private firebaseService: FirebaseService, // REPLACE AuthService
    private imageService: ImageService,
    private loadingCtrl: LoadingController
  ) {}
  
  // ADD these methods back
  ngOnInit() {
    this.updatePlaceholderAvatar();
  }
  
  updatePlaceholderAvatar() {
    if (this.userName.trim()) {
      this.profilePic = this.imageService.generateAvatarFromName(this.userName);
    } else {
      this.profilePic = this.imageService.generateAvatarFromName('User');
    }
  }
  
  selectImage() {
    this.updatePlaceholderAvatar();
    alert('Avatar generated from your name. Camera support coming soon!');
  }
  
  async startChatting() {
    if (this.userName.trim()) {
      const loading = await this.loadingCtrl.create({
        message: 'Creating account...',
      });
      await loading.present();
      
      try {
        await this.firebaseService.signInAnonymously(this.userName.trim());
      } catch (error) {
        console.error('Error:', error);
        alert('Could not create account.');
      } finally {
        await loading.dismiss();
      }
    }
  }

}
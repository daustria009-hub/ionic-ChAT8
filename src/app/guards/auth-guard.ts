import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private storage: Storage
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      // First initialize storage
      await this.storage.create();
      
      // Check if user exists in storage
      const userId = await this.storage.get('userId');
      
      if (userId) {
        // User is logged in
        return true;
      } else {
        // No user found, redirect to welcome
        this.router.navigate(['/welcome']);
        return false;
      }
    } catch (error) {
      console.error('AuthGuard error:', error);
      this.router.navigate(['/welcome']);
      return false;
    }
  }
}

import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  constructor(private storage: Storage) {}

  // Generate SVG avatar from name (no assets needed)
  generateAvatarFromName(name: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    
    const firstLetter = name.charAt(0).toUpperCase();
    const colorIndex = firstLetter.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${backgroundColor}" rx="50"/>
        <text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-family="Arial, sans-serif">${firstLetter}</text>
      </svg>
    `;
    
    return 'data:image/svg+xml;base64,' + btoa(svgContent);
  }

  // Save image to local storage
  async saveImageToStorage(userId: string, base64Image: string): Promise<void> {
    const key = `profile_image_${userId}`;
    await this.storage.set(key, base64Image);
  }

  // Get image from local storage
  async getImageFromStorage(userId: string): Promise<string | null> {
    const key = `profile_image_${userId}`;
    return await this.storage.get(key);
  }

}
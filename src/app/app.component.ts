import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FirebaseService } from './services/firebase.service'; // NEW IMPORT

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  currentUrl: string = '';
  
  constructor(
    private router: Router,
    private firebaseService: FirebaseService // REPLACE AuthService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        console.log('Route changed to:', event.url);
        this.currentUrl = event.url;
      }
    });
  }

  async ngOnInit() {
    // Check for existing user on app start
    await this.firebaseService.checkExistingUser();
  }
}
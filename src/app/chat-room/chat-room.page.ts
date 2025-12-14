import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.page.html',
  styleUrls: ['./chat-room.page.scss'],
  standalone: false,
})
export class ChatRoomPage implements OnInit, OnDestroy {
  @ViewChild('content') content!: ElementRef;
  
  newMessage: string = '';
  messages: any[] = [];
  receiverId: string = '';
  receiverUser: any = null;
  currentUser: any;
  
  private unsubscribeMessages: (() => void) | null = null;

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService
  ) {}

  async ngOnInit() {
    this.receiverId = this.route.snapshot.paramMap.get('id') || '';
    this.currentUser = this.firebaseService.currentUser;
    
    console.log('Chat with user ID:', this.receiverId);

    if (this.currentUser && this.receiverId) {
      // Get receiver user info
      this.receiverUser = await this.firebaseService.getUser(this.receiverId);
      
      if (!this.receiverUser) {
        // Create a mock user if not found
        const receiverName = this.getUserNameFromId(this.receiverId);
        this.receiverUser = {
          id: this.receiverId,
          name: receiverName,
          photoURL: this.generateAvatarUrl(receiverName)
        };
      }

      // Subscribe to real-time messages
      this.unsubscribeMessages = this.firebaseService.subscribeToMessages(
        this.currentUser.id,
        this.receiverId,
        (messages) => {
          console.log('New messages received:', messages.length);
          
          this.messages = messages.map(msg => ({
            text: msg.text,
            sender: msg.senderId === this.currentUser.id ? 'me' : 'them',
            time: this.formatTime(msg.timestamp?.toDate()),
            timestamp: msg.timestamp
          }));
          
          // Scroll to bottom after messages load
          setTimeout(() => this.scrollToBottom(), 100);
        }
      );
    }
  }

  ngOnDestroy() {
    if (this.unsubscribeMessages) {
      this.unsubscribeMessages();
    }
  }

  async sendMessage() {
    if (this.newMessage.trim() && this.currentUser && this.receiverId) {
      try {
        await this.firebaseService.sendMessage(
          this.currentUser.id,
          this.receiverId,
          this.newMessage.trim()
        );
        this.newMessage = '';
        this.scrollToBottom();
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  }

  private formatTime(date: Date | undefined): string {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom() {
    if (this.content) {
      const element = this.content.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  private getUserNameFromId(id: string): string {
    const nameMap: {[key: string]: string} = {
      'user1': 'Alex',
      'user2': 'Jordan', 
      'user3': 'Taylor'
    };
    return nameMap[id] || 'Chat User';
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
}
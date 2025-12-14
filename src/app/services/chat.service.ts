import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    private firestore: AngularFirestore
  ) {}

  // Get all users except current user
  getUsers(currentUserId: string): Observable<any[]> {
    return this.firestore.collection('users', ref => 
      ref.where('__name__', '!=', currentUserId)
    ).valueChanges({ idField: 'id' });
  }

  // Get messages between two users
  getMessages(userId1: string, userId2: string): Observable<any[]> {
    const chatId = this.generateChatId(userId1, userId2);
    return this.firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages', ref => ref.orderBy('timestamp', 'asc'))
      .valueChanges({ idField: 'id' });
  }

  // Send message
  async sendMessage(senderId: string, receiverId: string, text: string) {
    const chatId = this.generateChatId(senderId, receiverId);
    const message = {
      text,
      senderId,
      receiverId,
      timestamp: new Date(),
      read: false
    };
    
    // Add message to chat
    await this.firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add(message);

    // Update last message in chat document
    await this.firestore.collection('chats').doc(chatId).set({
      participants: [senderId, receiverId],
      lastMessage: text,
      lastMessageTime: new Date(),
      lastMessageSenderId: senderId
    }, { merge: true });
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string) {
    const messagesSnapshot = await firstValueFrom(
      this.firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages', ref => 
          ref.where('receiverId', '==', userId).where('read', '==', false)
        )
        .get()
    );

    const batch = this.firestore.firestore.batch();
    messagesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    if (messagesSnapshot.docs.length > 0) {
      await batch.commit();
    }
  }

  private generateChatId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

}
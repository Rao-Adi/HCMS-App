import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: Date;
}

@Component({
  selector: 'app-aireport',
  imports: [CommonModule, FormsModule],
  templateUrl: './aireport.html',
  styleUrl: './aireport.css',
})
export class AIReport {
  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'aireport';

  messages: Message[] = [
    { role: 'assistant', content: 'Hi! How can I help you today?', time: new Date() },
  ];

  input = '';
  loading = false;

  send() {
    if (!this.input.trim()) return;

    this.messages.push({
      role: 'user',
      content: this.input,
      time: new Date(),
    });

    const userText = this.input;
    this.input = '';
    this.loading = true;

    // Mock assistant reply (replace with API call)
    setTimeout(() => {
      this.messages.push({
        role: 'assistant',
        content: `You said: ${userText}`,
        time: new Date(),
      });
      this.loading = false;
    }, 800);
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notfound.html',
  styleUrls: ['./notfound.css']
})
export class Notfound implements OnInit {
  private router = inject(Router);
  attemptedUrl = '';

  ngOnInit(): void {
    // If this component is rendered directly on the '**' route,
    // this shows the *original* bad URL; if you redirect to /404,
    // you'll only see '/404'.
    this.attemptedUrl = this.router.url;
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigateByUrl('/dashboard');
    }
  }
}

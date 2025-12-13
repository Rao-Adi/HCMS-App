import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- 1. Import FormsModule
import { UtilitiesService } from '@app/core/services/utilities.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule // <-- 2. Add FormsModule here
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  EmpName: string = '';
  welcomeMessage: string = '';
  

  constructor(private _utilityService: UtilitiesService,) { }

  ngOnInit(): void {
    this.EmpName = this._utilityService.GetEmpName() || '';
    this.welcomeMessage = `Welcome back, ${this.EmpName}!`;
  }

  // --- Hardcoded data for your presentation ---

  

  // Data for Widget 1: Leave Balances
  leaveBalances = [
    { type: 'Annual', days: 15.5, color: '#005f9e' },
    { type: 'Sick', days: 8, color: '#e67e22' },
    { type: 'Personal', days: 2, color: '#27ae60' }
  ];

  // Data for Widget 2: Action Items
  actionItems = [
    { id: 1, text: 'Approve timesheet for J. Smith', type: 'Approval' },
    { id: 2, text: 'Complete "New Security Policy" training', type: 'Training' },
    { id: 3, text: 'Sign your annual performance review', type: 'Task' }
  ];

  // Data for Widget 3: Quick Links
  quickLinks = [
    { name: 'View My Payslip', icon: '📄' }, // Using emojis for icons
    { name: 'Request Time Off', icon: '✈️' },
    { name: 'Update Personal Info', icon: '👤' },
    { name: 'My Benefits', icon: '❤️' }
  ];

  // --- Click Handlers (for demo) ---

  onActionClick(item: any) {
    console.log('Clicked on action:', item.text);
    // You can show a simple alert for the presentation
    alert('This would navigate to the task: "' + item.text + '"');
  }

  onLinkClick(linkName: string) {
    alert('This would navigate to the "' + linkName + '" page.');
  }
   

}

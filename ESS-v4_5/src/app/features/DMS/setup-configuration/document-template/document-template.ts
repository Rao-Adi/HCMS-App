import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MedicalReimbursementService } from '@app/features/personnel/medical-reimbursement-service';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NZ_ICONS, NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconService } from 'ng-zorro-antd/icon';
import { DownloadOutline } from '@ant-design/icons-angular/icons';
import { BehaviorSubject, catchError, debounceTime, map, Observable, of, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';


const icons = [DownloadOutline, { ...DownloadOutline, name: 'download-o' }];


interface MockUser {
  name: {
    first: string;
  };
}

@Component({
  selector: 'app-document-template',
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule, NzInputModule,
    SafeTranslatePipe,
    NzDatePickerModule,
    NzUploadModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCheckboxModule,
  ],
  providers: [
    MedicalReimbursementService,
    DatePipe,
    DecimalPipe,
    { provide: NZ_ICONS, useValue: icons },
  ],
  templateUrl: './document-template.html',
  styleUrl: './document-template.css',
})
export class DocumentTemplate {
  randomUserUrl = 'https://api.randomuser.me/?results=5';
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser?: string;
  loading = false;

  onSearch(value: string): void {
    this.loading = true;
    this.searchChange$.next(value);
  }

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe,
    private iconService: NzIconService
  ) {
    this.iconService.addIcon(DownloadOutline);
    this.iconService.addIcon({ ...DownloadOutline, name: 'download-o' });
  }

  ngOnInit(): void {
    this.searchChange$
      .pipe(
        debounceTime(500),
        switchMap((name) => this.getRandomNameList(name))
      )
      .subscribe((data) => {
        this.optionList = data;
        this.loading = false;
      });
  }

  onfiscalYearchange() {}

  getRandomNameList(name: string): Observable<string[]> {
    return this.http.get<{ results: MockUser[] }>(`${this.randomUserUrl}`).pipe(
      map((res) => res.results),
      catchError(() => of<MockUser[]>([])),
      map((list) => list.map((item) => `${item.name.first} ${name}`))
    );
  }
}

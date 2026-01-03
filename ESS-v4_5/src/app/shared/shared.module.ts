import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { QuillModule } from 'ngx-quill';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzUploadModule } from 'ng-zorro-antd/upload';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AgGridModule,
    QuillModule.forRoot(),
    NzCheckboxModule,
    NzUploadModule
  ],
  exports: []
})

export class SharedModule {}
import { Routes } from '@angular/router';
import { UploadOldDocuments } from './upload-old-documents/upload-old-documents';
import { AGGridInlineEditingTest } from './aggrid-inline-editing-test/aggrid-inline-editing-test';
import { EditableUploadDocument } from './editable-upload-document/editable-upload-document';

const routes: Routes = [
  {
    path: 'upload-old-documents',
    component: UploadOldDocuments,
  },
  {
    path: 'aggridinlineediting',
    component: AGGridInlineEditingTest,
  },
    {
    path: 'upload-old-documents-edit',
    component: EditableUploadDocument,
  },
];

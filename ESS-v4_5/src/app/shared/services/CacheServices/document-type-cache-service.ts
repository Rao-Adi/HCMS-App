 
import { Injectable } from '@angular/core';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { DocumentType } from '@app/shared/interfaces/interfaces';
import { Observable } from 'rxjs'; 
import { DocumentTypeService } from '../documentType.service';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

@Injectable({ providedIn: 'root' })
export class DocumentTypeCacheService {
  private readonly CACHE_KEY = MASTER_CACHE_KEYS.DOCUMENT_TYPES;

  constructor(private masterCache: Mastercacheservice, private documentTypeService: DocumentTypeService) {}

  getDocumentTypes(): Observable<DocumentType[]> {
    return this.masterCache.getMasterData<DocumentType>({
      cacheKey: this.CACHE_KEY,
      getCount$: () => this.documentTypeService.getDocumentTypeCount(),
      getData$: () => this.documentTypeService.GetAllDocumentTypes('', 'ASC', 'Name', true, 1, 1000),
      mapFn: (item) => ({
        Id: item.Id || item.id,
        Code: item.Code || item.code,
        Name: item.Name || item.name,
        CreatedBy: item.CreatedBy || item.createdBy || '',
        CreatedAt: new CustomDateFormatPipe().transform(item.CreatedAt || item.createdAt || ''),
        LastModifiedBy: item.LastModifiedBy || item.lastModifiedBy || '',
        LastModifiedAt: new CustomDateFormatPipe().transform(item.LastModifiedAt || item.lastModifiedAt || ''),
      }),
    });
  }

  clearCache() {
    this.masterCache.clear(this.CACHE_KEY);
  }
}

import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config';
import { HttpContextToken } from '@angular/common/http';
import { throwError } from 'rxjs';
export const BYPASS_INTERCEPTORS = new HttpContextToken(() => false);

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public _TokenKey: string = '';
  public currentFormId = "";

  // --- THIS IS THE FIX ---
  // We inject these, but we *don't* access config.apiUrl yet
  private _httpClient = inject(HttpClient);
  private injector = inject(Injector);
  private _config = inject(AppConfigService);

  // We make apiUrl a getter. It's only called when needed.
  private get apiUrl(): string {
    if (!this._config.baseUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return ''; // Failsafe
    }
    return this._config.baseUrl;
  }
  // --- END FIX ---

  public get router(): Router {
    return this.injector.get(Router);
  }

  // --- Core TYPE-SAFE HTTP Methods ---

  get<T>(url: string): Observable<T> {
    const fullUrl = `${this.apiUrl}/${url}`; // <-- Uses the getter
    return this._httpClient.get<T>(fullUrl, { withCredentials: true });
  }

  post<T>(url: string, model: any): Observable<T> {
    const fullUrl = `${this.apiUrl}/${url}`;
    return this._httpClient.post<T>(fullUrl, model, { withCredentials: true });
  }

  put<T>(url: string, id: number | string, model: any): Observable<T> {
    const fullUrl = `${this.apiUrl}/${url}/${id}`;
    return this._httpClient.put<T>(fullUrl, model, { withCredentials: true });
  }

  delete<T>(url: string, id: number | string): Observable<T> {
    const fullUrl = `${this.apiUrl}/${url}/${id}`;
    return this._httpClient.delete<T>(fullUrl, { withCredentials: true });
  }

  // --- Special Case Methods (Unchanged) ---

  getEmployeeImage(url: string, empId: number): Observable<Blob> {
    const fullUrl = `${this.apiUrl}/${url}/${empId}`;
    return this._httpClient.get(fullUrl, {
      withCredentials: true,
      responseType: 'blob'
    });
  }

  getExcelData(url: string, jsonData: string): Observable<Blob> {
    const fullUrl = `${this.apiUrl}/${url}`;
    return this._httpClient.post(fullUrl, jsonData, {
      withCredentials: true,
      responseType: 'blob'
    });
  }

  postForm(url: string, form: FormData): Observable<any> {
    const fullUrl = `${this.apiUrl}/${url}`;
    return this._httpClient.post(fullUrl, form, { withCredentials: true });
  }

  uploadFileWithProgress(
    url: string,
    file: File,
    fieldName: string = 'file',
    extraFields?: Record<string, string | Blob>
  ): Observable<HttpEvent<any>> {
    const form = new FormData();
    form.append(fieldName, file, file.name);
    if (extraFields) {
      Object.keys(extraFields).forEach(k => form.append(k, extraFields[k]));
    }
    const fullUrl = `${this.apiUrl}/${url}`;
    const req = new HttpRequest('POST', fullUrl, form, {
      withCredentials: true,
      reportProgress: true
    });
    return this._httpClient.request(req);
  }

  getWthOutHeader(url: string): Observable<any> {
    const fullUrl = `${this.apiUrl}/${url}`;
    return this._httpClient.get<any>(fullUrl, {
      context: new HttpContext().set(BYPASS_INTERCEPTORS, true)
    });
  }
  isNetworkAvailable(): boolean {
    if (!navigator.onLine) {
      // alert("Connection with the server is lost, please try again.");
      return false;
    }
    return true;
  }
  generateUniqueName() {
    var uniqueNum: any = Math.floor(100000 + Math.random() * 900000);
    uniqueNum = 'app' + uniqueNum;
    return uniqueNum;
  }
  getUserAgent(name: string): string | null {
    const ua = navigator.userAgent.toLowerCase();
    let currentNavigator = '';
    let match: RegExpMatchArray | null;
    if ((match = ua.match(/msie/))) {
      currentNavigator = match[0];
    } else if ((match = ua.match(/firefox/))) {
      currentNavigator = match[0];
    } else if ((match = ua.match(/chrome/))) {
      currentNavigator = match[0];
    } else if ((match = ua.match(/opera/))) {
      currentNavigator = match[0];
    } else if ((match = ua.match(/safari/))) {
      currentNavigator = match[0];
    } else {
      currentNavigator = 'unknown'; 
    }

    const nameEQ = encodeURIComponent(name) + "=";
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      const c = ca[i].trim();

      if (c.indexOf(nameEQ) === 0) {
        const cookieVal = decodeURIComponent(c.substring(nameEQ.length, c.length));
        return `${currentNavigator}-${cookieVal}`;
      }
    }

    return null;
  }
  getXSRFToken(name: string): string | null {
    const nameEQ = encodeURIComponent(name) + "=";
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      const c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    return null;
  }
  downloadFileXHR(url: string, fileName: string): Observable<Blob> {
    if (!this.isNetworkAvailable()) {
      return throwError(() => new Error('Network not available'));
    }

    let uniqueName = this.generateUniqueName(); 
    return new Observable<Blob>((observer) => {
      const fullUrl = this.apiUrl + '/' + url;
     // const fullUrl = this._config.environment.baseUrl + url;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', fullUrl, true); 
      const userAgent = this.getUserAgent("login");
      if (userAgent) {
        xhr.setRequestHeader("login", userAgent);
      }
      if (this._TokenKey) {
        const token = localStorage.getItem(this._TokenKey); 
        const xsrf = this.getXSRFToken("xsrftoken");
        if (token) {
          xhr.setRequestHeader('Token', token);
        }
        if (xsrf) {
          xhr.setRequestHeader('xsrftoken', xsrf);
        }
      }
     
      xhr.responseType = 'blob'; 

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) { 
          if (xhr.status === 200) { 
            const blob = xhr.response as Blob;

            observer.next(blob); 
            observer.complete(); 
          } else { 
            let errorResponse = xhr.response;
            try {
              if (xhr.responseType === 'blob' && xhr.response) {
               
                const reader = new FileReader();
                reader.onload = () => {
                  console.error("XHR Error Response Text:", reader.result);
                  observer.error({ status: xhr.status, statusText: xhr.statusText, response: reader.result });
                };
                reader.onerror = () => {
                  observer.error({ status: xhr.status, statusText: xhr.statusText, response: "Could not read error blob." });
                };
                reader.readAsText(xhr.response);
                return; 
              } else {
                errorResponse = xhr.responseText || xhr.statusText;
              }
            } catch (e) {
              errorResponse = xhr.statusText;
            }
            console.error("XHR Error:", xhr.status, errorResponse);
            observer.error({ status: xhr.status, statusText: xhr.statusText, response: errorResponse });
          }
        }
      };

      xhr.onerror = () => { 
        
        console.error("XHR Network Error");
        observer.error({ status: 0, statusText: 'Network Error or CORS issue', response: null });
      };

      xhr.send(null); 
    });
  }
}

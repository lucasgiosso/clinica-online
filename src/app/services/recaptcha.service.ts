import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecaptchaService {

  private baseUrl = 'https://api.2captcha.com/createTask';

  constructor(private http: HttpClient) {
  }

  generateCaptcha(): Observable<{ captchaText: string, captchaData: string }> {
    const url = `${this.baseUrl}`;
    return this.http.get<{ captchaText: string, captchaData: string }>(url);
  }
  
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable()
export class ApiService {
  apiDo = environment.apiDomain;

  constructor(private http: HttpClient) {}
}

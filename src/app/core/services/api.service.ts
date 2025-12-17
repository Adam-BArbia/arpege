import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Instrument } from '../models/instrument.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/instruments';

  constructor(private http: HttpClient) {}

  getInstruments(): Observable<Instrument[]> {
    return this.http.get<Instrument[]>(this.baseUrl);
  }

  getInstrument(id: number): Observable<Instrument> {
    return this.http.get<Instrument>(`${this.baseUrl}/${id}`);
  }

  addInstrument(payload: Omit<Instrument, 'id'>): Observable<Instrument> {
    return this.http.post<Instrument>(this.baseUrl, payload);
  }

  updateInstrument(id: number, payload: Partial<Instrument>): Observable<Instrument> {
    return this.http.put<Instrument>(`${this.baseUrl}/${id}`, payload);
  }

  deleteInstrument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface PreviewData {
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
}

@Injectable({ providedIn: 'root' })
export class PreviewService {
  private http = inject(HttpClient);

  getPreview(url: string): Observable<PreviewData> {
    return this.http.get<PreviewData>(`/api/preview?url=${encodeURIComponent(url)}`);
  }
}

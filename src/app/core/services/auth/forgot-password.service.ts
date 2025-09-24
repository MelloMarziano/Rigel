import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { SnackbarService } from '../snackbar.service';

interface ForgotPasswordRequest {
  email: string;
}

interface ValidateTokenRequest {
  email: string;
  token: string;
}

interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

interface RequestPasswordResetResponse {
  message: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordService {
  private backendUrl: string;

  constructor(
    private http: HttpClient,
    private snackbar: SnackbarService
  ) {
    this.backendUrl = environment.backendUrl;
  }

  requestPasswordReset(email: string): Observable<RequestPasswordResetResponse> {
    const payload: ForgotPasswordRequest = { email };
    return this.http.post<RequestPasswordResetResponse>(`${this.backendUrl}api/profile/forgot-password`, payload)
      .pipe(catchError(error => this.handleError(error)));
  }

  validateResetToken(email: string, token: string): Observable<any> {
    const payload: ValidateTokenRequest = { email, token };
    return this.http.post(`${this.backendUrl}api/profile/validate-code`, payload)
      .pipe(catchError(error => this.handleError(error)));
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    const payload: ResetPasswordRequest = { email, token, newPassword };
    return this.http.post(`${this.backendUrl}api/profile/update-password`, payload)
      .pipe(catchError(error => this.handleError(error)));
  }

  private handleError(errorResponse: HttpErrorResponse) {
    if (errorResponse.error instanceof ErrorEvent) {
      console.error('An error occurred:', errorResponse.error.message);
    } else {
      switch (errorResponse.status) {
        case 0:
          this.snackbar.presentToastDanger('There is no connection to the server, check your internet connection.');
          break;
        case 403:
        case 404:
          this.snackbar.presentToastDanger(errorResponse.error);
          break;
        default:
          console.log(
            `Backend returned code ${errorResponse.status}, ` +
            `body was: ${errorResponse.error}`);
          this.snackbar.presentToastDanger('We are currently unable to complete your request. Please try again later.');
          break;
      }
    }
    return throwError(() => errorResponse);
  }
}


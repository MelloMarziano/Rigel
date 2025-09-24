import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SidebarService {
    private sidebarVisible = new BehaviorSubject<boolean>(false);
    sidebarVisible$ = this.sidebarVisible.asObservable();

    toggleSidebar(forceState?: boolean): void {
        this.sidebarVisible.next(
            forceState !== undefined ? forceState : !this.sidebarVisible.value
        );
    }
}
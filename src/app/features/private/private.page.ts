import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from './components/services/sidebar.service';

@Component({
  selector: 'app-private',
  templateUrl: './private.page.html',
  styleUrls: ['./private.page.scss'],
})
export class PrivatePage {
  isSidebarVisible = true;

  // toggleSidebar(): void {
  //   this.isSidebarVisible = !this.isSidebarVisible;
  // }

  constructor(private sidebarService: SidebarService) { }

  ngOnInit(): void {
    this.sidebarService.sidebarVisible$.subscribe(
      (visible) => (this.isSidebarVisible = visible)
    );
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }



}
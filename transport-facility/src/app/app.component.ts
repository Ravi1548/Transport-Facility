import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { EmployeeService } from './services/employee.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Transport Facility';
  currentRoute = '';
  currentEmployeeId: string | null = null;

  constructor(
    private router: Router,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        // Update current employee on route change
        this.currentEmployeeId = this.employeeService.getCurrentEmployee();
      });

    this.currentEmployeeId = this.employeeService.getCurrentEmployee();
  }

  navigateToAddRide(): void {
    this.router.navigate(['/add-ride']);
  }

  navigateToSearchRides(): void {
    this.router.navigate(['/search-rides']);
  }


  logout(): void {
    this.employeeService.logout();
    this.currentEmployeeId = null;
    this.router.navigate(['/login']);
  }

  isLoginPage(): boolean {
    return this.currentRoute === '/login';
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute === route;
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
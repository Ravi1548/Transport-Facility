import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RideService } from '../../services/ride.service';
import { EmployeeService } from '../../services/employee.service';
import { Ride } from '../../models/ride.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentEmployee: any;
  myRides: Ride[] = [];
  bookedRides: Ride[] = [];
  canAddRide = true;

  constructor(
    private rideService: RideService,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentEmployee = this.employeeService.getCurrentEmployee();
    
    if (!this.currentEmployee) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Get rides created by current employee
    this.myRides = this.rideService.getRidesByEmployee(this.currentEmployee);
    
    // Get rides booked by current employee
    this.bookedRides = this.rideService.getBookedRidesByEmployee(this.currentEmployee);
    
    // Check if employee can add a ride today
    this.canAddRide = this.rideService.canEmployeeAddRide(this.currentEmployee);
  }

  navigateToAddRide(): void {
    this.router.navigate(['/add-ride']);
  }

  navigateToPickRide(): void {
    this.router.navigate(['/pick-ride']);
  }

  logout(): void {
    this.employeeService.logout();
    this.router.navigate(['/login']);
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getAvailableSeats(ride: Ride): number {
    return ride.vacantSeats - ride.bookedBy.length;
  }

  isToday(dateString: string): boolean {
    const today = new Date().toISOString().split('T')[0]; 
    return dateString === today;
  }

  getTodayRides(rides: Ride[]): Ride[] {
    return rides.filter(ride => this.isToday(ride.date));
  }
}
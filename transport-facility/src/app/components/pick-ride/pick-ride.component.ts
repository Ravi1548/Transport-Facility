import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RideService } from '../../services/ride.service';
import { EmployeeService } from '../../services/employee.service';
import { Ride, VehicleType } from '../../models/ride.model';

@Component({
  selector: 'app-pick-ride',
  templateUrl: './pick-ride.component.html',
  styleUrls: ['./pick-ride.component.css']
})
export class PickRideComponent implements OnInit {
  availableRides: Ride[] = [];
  filteredRides: Ride[] = [];
  currentEmployee: any;
  selectedVehicleType: string = '';
  vehicleTypes = ['All', ...Object.values(VehicleType)];
  isLoading = false;
  successMessage = '';
  errorMessage = '';

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

    this.loadAvailableRides();
  }

  loadAvailableRides(): void {
    this.isLoading = true;
    
    // Get available rides with time matching 
    this.availableRides = this.rideService.getAvailableRides(this.currentEmployee, 60);
    this.filteredRides = [...this.availableRides];
    
    this.isLoading = false;
  }

  onVehicleTypeChange(): void {
    if (this.selectedVehicleType === '' || this.selectedVehicleType === 'All') {
      this.filteredRides = [...this.availableRides];
    } else {
      this.filteredRides = this.availableRides.filter(
        ride => ride.vehicleType === this.selectedVehicleType
      );
    }
  }

  bookRide(ride: Ride): void {
    this.errorMessage = '';
    this.successMessage = '';
    
    const result = this.rideService.bookRide(ride.id, this.currentEmployee);
    
    if (result.success) {
      this.successMessage = `Successfully booked ride to ${ride.destination}!`;
      // Remove the booked ride from available rides
      this.loadAvailableRides();
      
      // Clear success message
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } else {
      this.errorMessage = result.message || 'Failed to book ride. Please try again.';
      // Reload rides 
      this.loadAvailableRides();
    }
  }

  getAvailableSeats(ride: Ride): number {
    return ride.vacantSeats - ride.bookedBy.length;
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  refreshRides(): void {
    this.loadAvailableRides();
    this.successMessage = 'Rides refreshed!';
    setTimeout(() => {
      this.successMessage = '';
    }, 2000);
  }
}
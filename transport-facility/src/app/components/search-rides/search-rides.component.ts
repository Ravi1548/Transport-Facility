import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { RideService } from '../../services/ride.service';
import { EmployeeService } from '../../services/employee.service';
import { Ride } from '../../models/ride.model';

@Component({
  selector: 'app-search-rides',
  templateUrl: './search-rides.component.html',
  styleUrls: ['./search-rides.component.css']
})
export class SearchRidesComponent implements OnInit {
  searchForm: FormGroup;
  availableRides: Ride[] = [];
  filteredRides: Ride[] = [];
  bookedRides: Ride[] = [];
  myRides: Ride[] = [];
  currentEmployeeId: string | null = null;
  isLoading: boolean = false;
  bookingMessage: string = '';
  bookingSuccess: boolean = false;
  showBookingAlert: boolean = false;
  activeTab: string = 'available'; 

  vehicleTypes = ['', 'Bike', 'Car'];
  
  constructor(
    private fb: FormBuilder,
    private rideService: RideService,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      searchTime: [''],
      vehicleType: ['']
    });
  }

  ngOnInit(): void {
    this.currentEmployeeId = this.employeeService.getCurrentEmployee();
    this.loadAvailableRides();
    
    // Subscribe to form changes for real-time filtering
    this.searchForm.valueChanges.subscribe(() => {
      this.filterRides();
    });
  }

  loadAvailableRides(): void {
    this.isLoading = true;
    this.availableRides = this.rideService.getTodaysAvailableRides();
    this.filteredRides = [...this.availableRides];
    
    // Load booked rides and my rides
    if (this.currentEmployeeId) {
      this.bookedRides = this.rideService.getBookedRides(this.currentEmployeeId);
      this.myRides = this.rideService.getMyRides(this.currentEmployeeId);
    }
    
    this.isLoading = false;
  }

  filterRides(): void {
    const { searchTime, vehicleType } = this.searchForm.value;
    this.filteredRides = this.rideService.searchRides(searchTime, vehicleType);
  }

  bookRide(ride: Ride): void {
    if (!this.currentEmployeeId) {
      this.showBookingMessage('Authentication error. Please login again.', false);
      return;
    }

    const result = this.rideService.bookRide(ride.id, this.currentEmployeeId);
    this.showBookingMessage(result.message, result.success);
    
    if (result.success) {
      // Refresh the rides list
      this.loadAvailableRides();
      this.filterRides();
    }
  }

  private showBookingMessage(message: string, success: boolean): void {
    this.bookingMessage = message;
    this.bookingSuccess = success;
    this.showBookingAlert = true;
    
    // Hide message after 5 seconds
    setTimeout(() => {
      this.showBookingAlert = false;
    }, 5000);
  }

  canBookRide(ride: Ride): boolean {
    if (!this.currentEmployeeId) return false;
    if (ride.employeeId === this.currentEmployeeId) return false;
    if (ride.bookedBy.includes(this.currentEmployeeId)) return false;
    if (ride.vacantSeats <= 0) return false;
    if (this.hasTimeConflict(ride.time)) return false;
    return true;
  }

  getRideStatus(ride: Ride): string {
    if (!this.currentEmployeeId) return 'Authentication required';
    if (ride.employeeId === this.currentEmployeeId) return 'Your ride';
    if (ride.bookedBy.includes(this.currentEmployeeId)) return 'Already booked';
    if (ride.vacantSeats <= 0) return 'No seats available';
    if (this.hasTimeConflict(ride.time)) return 'Time conflict';
    return 'Available';
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  goToAddRide(): void {
    this.router.navigate(['/add-ride']);
  }


  clearFilters(): void {
    this.searchForm.reset();
    this.filteredRides = [...this.availableRides];
  }

  closeAlert(): void {
    this.showBookingAlert = false;
  }

  getMyRidesCount(): number {
    if (!this.currentEmployeeId) return 0;
    return this.rideService.getMyRides(this.currentEmployeeId).length;
  }

  getBookedRidesCount(): number {
    if (!this.currentEmployeeId) return 0;
    return this.rideService.getBookedRides(this.currentEmployeeId).length;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getCurrentRides(): Ride[] {
    switch (this.activeTab) {
      case 'available':
        return this.filteredRides;
      case 'booked':
        return this.bookedRides;
      case 'myrides':
        return this.myRides;
      default:
        return this.filteredRides;
    }
  }

  canCancelBooking(ride: Ride): boolean {
    return this.currentEmployeeId ? ride.bookedBy.includes(this.currentEmployeeId) : false;
  }

  cancelBooking(ride: Ride): void {
    if (!this.currentEmployeeId) return;
    
    // Remove employee from  array and increase  seeats
    const rides = JSON.parse(localStorage.getItem('transport_rides') || '[]');
    const rideIndex = rides.findIndex((r: Ride) => r.id === ride.id);
    
    if (rideIndex !== -1) {
      const updatedRide = rides[rideIndex];
      updatedRide.bookedBy = updatedRide.bookedBy.filter((id: string) => id !== this.currentEmployeeId);
      updatedRide.vacantSeats += 1;
      rides[rideIndex] = updatedRide;
      
      localStorage.setItem('transport_rides', JSON.stringify(rides));
      
      // Remove from bookings
      const bookings = JSON.parse(localStorage.getItem('transport_bookings') || '[]');
      const updatedBookings = bookings.filter((booking: any) => 
        !(booking.rideId === ride.id && booking.employeeId === this.currentEmployeeId)
      );
      localStorage.setItem('transport_bookings', JSON.stringify(updatedBookings));
      
      this.showBookingMessage('Booking cancelled successfully', true);
      this.loadAvailableRides();
    }
  }

  hasTimeConflict(rideTime: string): boolean {
    if (!this.currentEmployeeId) return false;
    
    const allRides = JSON.parse(localStorage.getItem('transport_rides') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    // Check if employee has any rides at the same time todayy
    return allRides.some((ride: any) => 
      ride.date === today && 
      ride.time === rideTime && (
        ride.employeeId === this.currentEmployeeId || 
        ride.bookedBy.includes(this.currentEmployeeId) 
      )
    );
  }
}
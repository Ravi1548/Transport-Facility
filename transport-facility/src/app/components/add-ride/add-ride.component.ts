import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RideService } from '../../services/ride.service';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-add-ride',
  templateUrl: './add-ride.component.html',
  styleUrls: ['./add-ride.component.css']
})
export class AddRideComponent implements OnInit {
  rideForm: FormGroup;
  currentEmployeeId: string | null = null;
  hasRideToday: boolean = false;
  isSubmitting: boolean = false;
  submitMessage: string = '';
  submitSuccess: boolean = false;

  vehicleTypes = ['Bike', 'Car'];
  
  //pickup points and destinations
  commonLocations = [
    'Office Main Gate',
    'Metro Station - Sector 18',
    'Metro Station - Rajiv Chowk',
    'Metro Station - Connaught Place',
    'Bus Stand - ISBT',
    'Airport Terminal 1',
    'Airport Terminal 3',
    'Cyber City',
    'Golf Course Road',
    'MG Road',
    'Sector 29 Market',
    'DLF Phase 1',
    'DLF Phase 2',
    'DLF Phase 3',
    'Sohna Road',
    'NH-8'
  ];

  constructor(
    private fb: FormBuilder,
    private rideService: RideService,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.rideForm = this.fb.group({
      employeeId: ['', [Validators.required, Validators.minLength(3)]],
      vehicleType: ['', Validators.required],
      vehicleNo: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/)]],
      vacantSeats: [1, [Validators.required, Validators.min(1), Validators.max(8)]],
      time: ['', [Validators.required, this.timeValidator]],
      pickupPoint: ['', Validators.required],
      destination: ['', Validators.required]
    });

    this.rideForm.get('vehicleType')?.valueChanges.subscribe(vehicleType => {
      this.onVehicleTypeChange(vehicleType);
    });
  }

  ngOnInit(): void {
    this.currentEmployeeId = this.employeeService.getCurrentEmployee();
    
    if (this.currentEmployeeId) {
      this.rideForm.patchValue({ employeeId: this.currentEmployeeId });
      this.checkExistingRide();
    }

    // Set minimum time to current time
    this.setMinTime();
  }

  //  validator for time (must be today and future time)
  timeValidator(control: any) {
    if (!control.value) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = control.value.split(':').map(Number);
    const selectedTime = hours * 60 + minutes;
    
    if (selectedTime <= currentTime) {
      return { pastTime: true };
    }
    
    return null;
  }

  setMinTime(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    const timeInput = document.getElementById('time') as HTMLInputElement;
    if (timeInput) {
      timeInput.min = currentTime;
    }
  }

  checkExistingRide(): void {
    if (this.currentEmployeeId) {
      this.hasRideToday = this.rideService.hasRideForToday(this.currentEmployeeId);
    }
  }

  onEmployeeIdChange(): void {
    const employeeId = this.rideForm.get('employeeId')?.value;
    if (employeeId) {
      this.hasRideToday = this.rideService.hasRideForToday(employeeId);
    }
  }

  onVehicleTypeChange(vehicleType: string): void {
    const vacantSeatsControl = this.rideForm.get('vacantSeats');
    
    if (vehicleType === 'Bike') {
      // For bike, only 1 seat allowed
      vacantSeatsControl?.setValue(1);
      vacantSeatsControl?.setValidators([Validators.required, Validators.min(1), Validators.max(1)]);
    } else if (vehicleType === 'Car') {
      // For car, 1-7 seats allowed
      vacantSeatsControl?.setValidators([Validators.required, Validators.min(1), Validators.max(7)]);
    }
    
    vacantSeatsControl?.updateValueAndValidity();
  }

  isVehicleNumberUnique(vehicleNo: string): boolean {
    const allRides = JSON.parse(localStorage.getItem('transport_rides') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    // Check iff vehicle number is already used 
    return !allRides.some((ride: any) => 
      ride.vehicleNo.toUpperCase() === vehicleNo.toUpperCase() && 
      ride.date === today
    );
  }

  onSubmit(): void {
    if (this.rideForm.valid && !this.hasRideToday) {
      this.isSubmitting = true;
      this.submitMessage = '';

      const formData = this.rideForm.value;
      
      // Set current employee if logged in
      if (this.currentEmployeeId) {
        formData.employeeId = this.currentEmployeeId;
      }

      // Check if vehicle number is unique
      if (!this.isVehicleNumberUnique(formData.vehicleNo)) {
        this.submitSuccess = false;
        this.submitMessage = 'Vehicle number is already in use for today. Please use a different vehicle number.';
        this.isSubmitting = false;
        return;
      }

      const success = this.rideService.addRide(formData);

      if (success) {
        this.submitSuccess = true;
        this.submitMessage = 'Ride added successfully!';
        this.rideForm.reset();
        this.hasRideToday = true;
        
        // Redirect to search rides 
        setTimeout(() => {
          this.router.navigate(['/search-rides']);
        }, 1000);
      } else {
        this.submitSuccess = false;
        if (this.hasRideToday) {
          this.submitMessage = 'You already have a ride for today. Only one ride per day is allowed.';
        } else if (this.hasTimeConflictForEmployee(formData.employeeId, formData.time)) {
          this.submitMessage = 'You already have a ride booked at this time. Cannot create overlapping rides.';
        } else {
          this.submitMessage = 'Failed to add ride. Please check your details and try again.';
        }
        this.checkExistingRide();
      }

      this.isSubmitting = false;
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.rideForm.controls).forEach(key => {
      const control = this.rideForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.rideForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.rideForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['pattern']) return `Invalid ${fieldName} format`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} cannot exceed ${field.errors['max'].max}`;
      if (field.errors['pastTime']) return 'Time must be in the future';
    }
    return '';
  }

  goToSearchRides(): void {
    this.router.navigate(['/search-rides']);
  }

  hasTimeConflictForEmployee(employeeId: string, time: string): boolean {
    const allRides = JSON.parse(localStorage.getItem('transport_rides') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    // Check if employee has any rides (own or booked) at the same time today
    return allRides.some((ride: any) => 
      ride.date === today && 
      ride.time === time && (
        ride.employeeId === employeeId || 
        ride.bookedBy.includes(employeeId)
      )
    );
  }
}
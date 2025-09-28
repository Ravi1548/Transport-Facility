import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchRidesComponent } from './search-rides.component';
import { RideService } from '../../services/ride.service';
import { EmployeeService } from '../../services/employee.service';
import { Ride, VehicleType } from '../../models/ride.model';

describe('SearchRidesComponent', () => {
  let component: SearchRidesComponent;
  let fixture: ComponentFixture<SearchRidesComponent>;
  let mockRideService: jasmine.SpyObj<RideService>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockRide: Ride = {
    id: '1',
    employeeId: 'EMP002',
    vehicleType: VehicleType.CAR,
    vehicleNo: 'DL01AB1234',
    vacantSeats: 3,
    time: '09:00',
    date: '2023-12-25',
    pickupPoint: 'Office Main Gate',
    destination: 'Metro Station',
    bookedBy: []
  };

  beforeEach(() => {
    mockRideService = jasmine.createSpyObj('RideService', [
      'getTodaysAvailableRides',
      'searchRides',
      'getBookedRides',
      'getMyRides',
      'bookRide'
    ]);
    mockEmployeeService = jasmine.createSpyObj('EmployeeService', ['getCurrentEmployee']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [SearchRidesComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: RideService, useValue: mockRideService },
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(SearchRidesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.availableRides).toEqual([]);
    expect(component.filteredRides).toEqual([]);
    expect(component.bookedRides).toEqual([]);
    expect(component.myRides).toEqual([]);
    expect(component.currentEmployeeId).toBeNull();
    expect(component.isLoading).toBe(false);
    expect(component.bookingMessage).toBe('');
    expect(component.bookingSuccess).toBe(false);
    expect(component.showBookingAlert).toBe(false);
    expect(component.activeTab).toBe('available');
  });

  it('should have vehicle types array', () => {
    expect(component.vehicleTypes).toEqual(['', 'Bike', 'Car']);
  });

  describe('Form initialization', () => {
    it('should initialize search form with empty values', () => {
      expect(component.searchForm.get('searchTime')?.value).toBe('');
      expect(component.searchForm.get('vehicleType')?.value).toBe('');
    });
  });

  describe('ngOnInit', () => {
    it('should get current employee and load rides', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('EMP001');
      mockRideService.getTodaysAvailableRides.and.returnValue([mockRide]);
      mockRideService.getBookedRides.and.returnValue([]);
      mockRideService.getMyRides.and.returnValue([]);
      
      component.ngOnInit();
      
      expect(component.currentEmployeeId).toBe('EMP001');
      expect(mockRideService.getTodaysAvailableRides).toHaveBeenCalled();
      expect(mockRideService.getBookedRides).toHaveBeenCalledWith('EMP001');
      expect(mockRideService.getMyRides).toHaveBeenCalledWith('EMP001');
    });

    it('should subscribe to form changes', () => {
      spyOn(component, 'filterRides');
      mockRideService.getTodaysAvailableRides.and.returnValue([]);
      
      component.ngOnInit();
      
      component.searchForm.patchValue({ searchTime: '10:00' });
      
      expect(component.filterRides).toHaveBeenCalled();
    });
  });

  describe('loadAvailableRides', () => {
    beforeEach(() => {
      component.currentEmployeeId = 'EMP001';
    });

    it('should load all ride types', () => {
      const bookedRide = { ...mockRide, id: '2' };
      const myRide = { ...mockRide, id: '3', employeeId: 'EMP001' };
      
      mockRideService.getTodaysAvailableRides.and.returnValue([mockRide]);
      mockRideService.getBookedRides.and.returnValue([bookedRide]);
      mockRideService.getMyRides.and.returnValue([myRide]);
      
      component.loadAvailableRides();
      
      expect(component.availableRides).toEqual([mockRide]);
      expect(component.filteredRides).toEqual([mockRide]);
      expect(component.bookedRides).toEqual([bookedRide]);
      expect(component.myRides).toEqual([myRide]);
      expect(component.isLoading).toBe(false);
    });

    it('should handle null currentEmployeeId', () => {
      component.currentEmployeeId = null;
      mockRideService.getTodaysAvailableRides.and.returnValue([mockRide]);
      
      component.loadAvailableRides();
      
      expect(component.availableRides).toEqual([mockRide]);
      expect(mockRideService.getBookedRides).not.toHaveBeenCalled();
      expect(mockRideService.getMyRides).not.toHaveBeenCalled();
    });
  });

  describe('filterRides', () => {
    it('should call searchRides with form values', () => {
      component.searchForm.patchValue({ searchTime: '10:00', vehicleType: 'Car' });
      mockRideService.searchRides.and.returnValue([mockRide]);
      
      component.filterRides();
      
      expect(mockRideService.searchRides).toHaveBeenCalledWith('10:00', 'Car');
      expect(component.filteredRides).toEqual([mockRide]);
    });
  });

  describe('bookRide', () => {
    beforeEach(() => {
      component.currentEmployeeId = 'EMP001';
      spyOn(component, 'loadAvailableRides');
      spyOn(component, 'filterRides');
    });

    it('should book ride successfully', () => {
      mockRideService.bookRide.and.returnValue({ success: true, message: 'Booked successfully' });
      spyOn(component as any, 'showBookingMessage');
      
      component.bookRide(mockRide);
      
      expect(mockRideService.bookRide).toHaveBeenCalledWith(mockRide.id, 'EMP001');
      expect((component as any).showBookingMessage).toHaveBeenCalledWith('Booked successfully', true);
      expect(component.loadAvailableRides).toHaveBeenCalled();
      expect(component.filterRides).toHaveBeenCalled();
    });

    it('should handle booking failure', () => {
      mockRideService.bookRide.and.returnValue({ success: false, message: 'Booking failed' });
      spyOn(component as any, 'showBookingMessage');
      
      component.bookRide(mockRide);
      
      expect((component as any).showBookingMessage).toHaveBeenCalledWith('Booking failed', false);
    });

    it('should handle authentication error', () => {
      component.currentEmployeeId = null;
      spyOn(component as any, 'showBookingMessage');
      
      component.bookRide(mockRide);
      
      expect((component as any).showBookingMessage).toHaveBeenCalledWith('Authentication error. Please login again.', false);
      expect(mockRideService.bookRide).not.toHaveBeenCalled();
    });
  });

  describe('showBookingMessage', () => {
    it('should show success message and hide after timeout', fakeAsync(() => {
      (component as any).showBookingMessage('Success message', true);
      
      expect(component.bookingMessage).toBe('Success message');
      expect(component.bookingSuccess).toBe(true);
      expect(component.showBookingAlert).toBe(true);
      
      tick(5000);
      expect(component.showBookingAlert).toBe(false);
    }));

    it('should show error message', () => {
      (component as any).showBookingMessage('Error message', false);
      
      expect(component.bookingMessage).toBe('Error message');
      expect(component.bookingSuccess).toBe(false);
      expect(component.showBookingAlert).toBe(true);
    });
  });

  describe('canBookRide', () => {
    beforeEach(() => {
      component.currentEmployeeId = 'EMP001';
      spyOn(component, 'hasTimeConflict').and.returnValue(false);
    });

    it('should return false if no current employee', () => {
      component.currentEmployeeId = null;
      
      expect(component.canBookRide(mockRide)).toBe(false);
    });

    it('should return false if employee owns the ride', () => {
      const ownRide = { ...mockRide, employeeId: 'EMP001' };
      
      expect(component.canBookRide(ownRide)).toBe(false);
    });

    it('should return false if already booked', () => {
      const bookedRide = { ...mockRide, bookedBy: ['EMP001'] };
      
      expect(component.canBookRide(bookedRide)).toBe(false);
    });

    it('should return false if no vacant seats', () => {
      const fullRide = { ...mockRide, vacantSeats: 0 };
      
      expect(component.canBookRide(fullRide)).toBe(false);
    });

    it('should return false if time conflict exists', () => {
      component.hasTimeConflict = jasmine.createSpy().and.returnValue(true);
      
      expect(component.canBookRide(mockRide)).toBe(false);
    });

    it('should return true if all conditions are met', () => {
      expect(component.canBookRide(mockRide)).toBe(true);
    });
  });

  describe('getRideStatus', () => {
    beforeEach(() => {
      component.currentEmployeeId = 'EMP001';
      spyOn(component, 'hasTimeConflict').and.returnValue(false);
    });

    it('should return authentication required if no employee', () => {
      component.currentEmployeeId = null;
      
      expect(component.getRideStatus(mockRide)).toBe('Authentication required');
    });

    it('should return "Your ride" for own rides', () => {
      const ownRide = { ...mockRide, employeeId: 'EMP001' };
      
      expect(component.getRideStatus(ownRide)).toBe('Your ride');
    });

    it('should return "Already booked" for booked rides', () => {
      const bookedRide = { ...mockRide, bookedBy: ['EMP001'] };
      
      expect(component.getRideStatus(bookedRide)).toBe('Already booked');
    });

    it('should return "No seats available" for full rides', () => {
      const fullRide = { ...mockRide, vacantSeats: 0 };
      
      expect(component.getRideStatus(fullRide)).toBe('No seats available');
    });

    it('should return "Time conflict" for conflicting rides', () => {
      component.hasTimeConflict = jasmine.createSpy().and.returnValue(true);
      
      expect(component.getRideStatus(mockRide)).toBe('Time conflict');
    });

    it('should return "Available" for bookable rides', () => {
      expect(component.getRideStatus(mockRide)).toBe('Available');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      expect(component.formatTime('09:30')).toBe('9:30 AM');
      expect(component.formatTime('14:45')).toBe('2:45 PM');
      expect(component.formatTime('00:00')).toBe('12:00 AM');
      expect(component.formatTime('12:00')).toBe('12:00 PM');
    });
  });

  describe('Navigation and utility methods', () => {
    it('should navigate to add ride', () => {
      component.goToAddRide();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/add-ride']);
    });

    it('should clear filters', () => {
      component.searchForm.patchValue({ searchTime: '10:00', vehicleType: 'Car' });
      component.availableRides = [mockRide];
      
      component.clearFilters();
      
      expect(component.searchForm.get('searchTime')?.value).toBeNull();
      expect(component.searchForm.get('vehicleType')?.value).toBeNull();
      expect(component.filteredRides).toEqual([mockRide]);
    });

    it('should close alert', () => {
      component.showBookingAlert = true;
      
      component.closeAlert();
      
      expect(component.showBookingAlert).toBe(false);
    });
  });

  describe('Tab management', () => {
    it('should set active tab', () => {
      component.setActiveTab('booked');
      expect(component.activeTab).toBe('booked');
    });

    it('should return correct rides for active tab', () => {
      component.filteredRides = [mockRide];
      component.bookedRides = [{ ...mockRide, id: '2' }];
      component.myRides = [{ ...mockRide, id: '3' }];
      
      component.activeTab = 'available';
      expect(component.getCurrentRides()).toEqual(component.filteredRides);
      
      component.activeTab = 'booked';
      expect(component.getCurrentRides()).toEqual(component.bookedRides);
      
      component.activeTab = 'myrides';
      expect(component.getCurrentRides()).toEqual(component.myRides);
    });
  });

  describe('Ride counts', () => {
    beforeEach(() => {
      component.currentEmployeeId = 'EMP001';
    });

    it('should get my rides count', () => {
      mockRideService.getMyRides.and.returnValue([mockRide, { ...mockRide, id: '2' }]);
      
      expect(component.getMyRidesCount()).toBe(2);
    });

    it('should get booked rides count', () => {
      mockRideService.getBookedRides.and.returnValue([mockRide]);
      
      expect(component.getBookedRidesCount()).toBe(1);
    });

    it('should return 0 for counts when no employee', () => {
      component.currentEmployeeId = null;
      
      expect(component.getMyRidesCount()).toBe(0);
      expect(component.getBookedRidesCount()).toBe(0);
    });
  });

  describe('Booking cancellation', () => {
    beforeEach(() => {
      component.currentEmployeeId = 'EMP001';
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify([mockRide]));
      spyOn(localStorage, 'setItem');
      spyOn(component, 'loadAvailableRides');
      spyOn(component as any, 'showBookingMessage');
    });

    it('should check if booking can be cancelled', () => {
      const bookedRide = { ...mockRide, bookedBy: ['EMP001'] };
      
      expect(component.canCancelBooking(bookedRide)).toBe(true);
    });

    it('should cancel booking successfully', () => {
      const bookedRide = { ...mockRide, bookedBy: ['EMP001'], vacantSeats: 2 };
      
      component.cancelBooking(bookedRide);
      
      expect(localStorage.setItem).toHaveBeenCalledTimes(2); // rides and bookings
      expect((component as any).showBookingMessage).toHaveBeenCalledWith('Booking cancelled successfully', true);
      expect(component.loadAvailableRides).toHaveBeenCalled();
    });
  });

  describe('hasTimeConflict', () => {
    beforeEach(() => {
      component.currentEmployeeId = 'EMP001';
      const mockRides = [
        {
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          employeeId: 'EMP001',
          bookedBy: ['EMP002']
        }
      ];
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockRides));
    });

    it('should return true for time conflict', () => {
      expect(component.hasTimeConflict('10:00')).toBe(true);
    });

    it('should return false for no conflict', () => {
      expect(component.hasTimeConflict('11:00')).toBe(false);
    });

    it('should return false when no employee', () => {
      component.currentEmployeeId = null;
      
      expect(component.hasTimeConflict('10:00')).toBe(false);
    });
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PickRideComponent } from './pick-ride.component';
import { RideService } from '../../services/ride.service';
import { EmployeeService } from '../../services/employee.service';
import { Ride, VehicleType } from '../../models/ride.model';

describe('PickRideComponent', () => {
  let component: PickRideComponent;
  let fixture: ComponentFixture<PickRideComponent>;
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
    mockRideService = jasmine.createSpyObj('RideService', ['getAvailableRides', 'bookRide']);
    mockEmployeeService = jasmine.createSpyObj('EmployeeService', ['getCurrentEmployee']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [PickRideComponent],
      providers: [
        { provide: RideService, useValue: mockRideService },
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(PickRideComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.availableRides).toEqual([]);
    expect(component.filteredRides).toEqual([]);
    expect(component.selectedVehicleType).toBe('');
    expect(component.isLoading).toBe(false);
    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toBe('');
  });

  it('should have vehicle types array with All option', () => {
    expect(component.vehicleTypes).toContain('All');
    expect(component.vehicleTypes).toContain('Bike');
    expect(component.vehicleTypes).toContain('Car');
  });

  describe('ngOnInit', () => {
    it('should redirect to login if no current employee', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue(null);
      
      component.ngOnInit();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should load available rides if employee is logged in', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('EMP001');
      mockRideService.getAvailableRides.and.returnValue([mockRide]);
      
      component.ngOnInit();
      
      expect(component.currentEmployee).toBe('EMP001');
      expect(mockRideService.getAvailableRides).toHaveBeenCalledWith('EMP001', 60);
      expect(component.availableRides).toEqual([mockRide]);
      expect(component.filteredRides).toEqual([mockRide]);
    });
  });

  describe('loadAvailableRides', () => {
    beforeEach(() => {
      component.currentEmployee = 'EMP001';
    });

    it('should set loading state and load rides', () => {
      mockRideService.getAvailableRides.and.returnValue([mockRide]);
      
      component.loadAvailableRides();
      
      expect(component.isLoading).toBe(false);
      expect(component.availableRides).toEqual([mockRide]);
      expect(component.filteredRides).toEqual([mockRide]);
    });

    it('should handle empty rides list', () => {
      mockRideService.getAvailableRides.and.returnValue([]);
      
      component.loadAvailableRides();
      
      expect(component.availableRides).toEqual([]);
      expect(component.filteredRides).toEqual([]);
    });
  });

  describe('onVehicleTypeChange', () => {
    beforeEach(() => {
      const carRide = { ...mockRide, vehicleType: VehicleType.CAR };
      const bikeRide = { ...mockRide, id: '2', vehicleType: VehicleType.BIKE };
      component.availableRides = [carRide, bikeRide];
    });

    it('should show all rides when "All" is selected', () => {
      component.selectedVehicleType = 'All';
      
      component.onVehicleTypeChange();
      
      expect(component.filteredRides.length).toBe(2);
    });

    it('should show all rides when empty string is selected', () => {
      component.selectedVehicleType = '';
      
      component.onVehicleTypeChange();
      
      expect(component.filteredRides.length).toBe(2);
    });

    it('should filter by car type', () => {
      component.selectedVehicleType = 'Car';
      
      component.onVehicleTypeChange();
      
      expect(component.filteredRides.length).toBe(1);
      expect(component.filteredRides[0].vehicleType).toBe(VehicleType.CAR);
    });

    it('should filter by bike type', () => {
      component.selectedVehicleType = 'Bike';
      
      component.onVehicleTypeChange();
      
      expect(component.filteredRides.length).toBe(1);
      expect(component.filteredRides[0].vehicleType).toBe(VehicleType.BIKE);
    });
  });





});
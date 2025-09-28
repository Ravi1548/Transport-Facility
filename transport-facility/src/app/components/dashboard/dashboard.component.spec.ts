import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { RideService } from '../../services/ride.service';
import { EmployeeService } from '../../services/employee.service';
import { Ride, VehicleType } from '../../models/ride.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockRideService: jasmine.SpyObj<RideService>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockRide: Ride = {
    id: '1',
    employeeId: 'EMP001',
    vehicleType: VehicleType.CAR,
    vehicleNo: 'DL01AB1234',
    vacantSeats: 3,
    time: '09:00',
    date: '2023-12-25',
    pickupPoint: 'Office Main Gate',
    destination: 'Metro Station',
    bookedBy: ['EMP002']
  };

  beforeEach(() => {
    mockRideService = jasmine.createSpyObj('RideService', [
      'getRidesByEmployee',
      'getBookedRidesByEmployee', 
      'canEmployeeAddRide'
    ]);
    mockEmployeeService = jasmine.createSpyObj('EmployeeService', ['getCurrentEmployee', 'logout']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: RideService, useValue: mockRideService },
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.myRides).toEqual([]);
    expect(component.bookedRides).toEqual([]);
    expect(component.canAddRide).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should redirect to login if no current employee', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue(null);
      
      component.ngOnInit();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should load dashboard data if employee is logged in', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('EMP001');
      mockRideService.getRidesByEmployee.and.returnValue([mockRide]);
      mockRideService.getBookedRidesByEmployee.and.returnValue([]);
      mockRideService.canEmployeeAddRide.and.returnValue(true);
      
      component.ngOnInit();
      
      expect(component.currentEmployee).toBe('EMP001');
      expect(mockRideService.getRidesByEmployee).toHaveBeenCalledWith('EMP001');
      expect(mockRideService.getBookedRidesByEmployee).toHaveBeenCalledWith('EMP001');
      expect(mockRideService.canEmployeeAddRide).toHaveBeenCalledWith('EMP001');
    });
  });

  describe('loadDashboardData', () => {
    beforeEach(() => {
      component.currentEmployee = 'EMP001';
    });

    it('should load my rides', () => {
      mockRideService.getRidesByEmployee.and.returnValue([mockRide]);
      mockRideService.getBookedRidesByEmployee.and.returnValue([]);
      mockRideService.canEmployeeAddRide.and.returnValue(true);
      
      component.loadDashboardData();
      
      expect(component.myRides).toEqual([mockRide]);
    });

    it('should load booked rides', () => {
      const bookedRide = { ...mockRide, id: '2', employeeId: 'EMP003' };
      mockRideService.getRidesByEmployee.and.returnValue([]);
      mockRideService.getBookedRidesByEmployee.and.returnValue([bookedRide]);
      mockRideService.canEmployeeAddRide.and.returnValue(true);
      
      component.loadDashboardData();
      
      expect(component.bookedRides).toEqual([bookedRide]);
    });

    it('should set canAddRide flag', () => {
      mockRideService.getRidesByEmployee.and.returnValue([]);
      mockRideService.getBookedRidesByEmployee.and.returnValue([]);
      mockRideService.canEmployeeAddRide.and.returnValue(false);
      
      component.loadDashboardData();
      
      expect(component.canAddRide).toBe(false);
    });
  });

  describe('Navigation methods', () => {
    it('should navigate to add-ride', () => {
      component.navigateToAddRide();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/add-ride']);
    });

    it('should navigate to pick-ride', () => {
      component.navigateToPickRide();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/pick-ride']);
    });
  });

  describe('logout', () => {
    it('should logout and navigate to login', () => {
      component.logout();
      
      expect(mockEmployeeService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('formatTime', () => {
    it('should format morning time correctly', () => {
      expect(component.formatTime('09:30')).toBe('9:30 AM');
    });

    it('should format afternoon time correctly', () => {
      expect(component.formatTime('14:45')).toBe('2:45 PM');
    });

    it('should format midnight correctly', () => {
      expect(component.formatTime('00:00')).toBe('12:00 AM');
    });

    it('should format noon correctly', () => {
      expect(component.formatTime('12:00')).toBe('12:00 PM');
    });
  });

  describe('getAvailableSeats', () => {
    it('should calculate available seats correctly', () => {
      const ride = { ...mockRide, vacantSeats: 4, bookedBy: ['EMP002', 'EMP003'] };
      
      expect(component.getAvailableSeats(ride)).toBe(2);
    });

    it('should return 0 when no seats available', () => {
      const ride = { ...mockRide, vacantSeats: 2, bookedBy: ['EMP002', 'EMP003'] };
      
      expect(component.getAvailableSeats(ride)).toBe(0);
    });
  });

  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      const today = new Date().toISOString().split('T')[0];
      
      expect(component.isToday(today)).toBe(true);
    });

    it('should return false for different date', () => {
      expect(component.isToday('2023-01-01')).toBe(false);
    });
  });

  describe('getTodayRides', () => {
    it('should filter rides for today only', () => {
      const today = new Date().toISOString().split('T')[0];
      const todayRide = { ...mockRide, date: today };
      const yesterdayRide = { ...mockRide, id: '2', date: '2023-01-01' };
      const rides = [todayRide, yesterdayRide];
      
      const result = component.getTodayRides(rides);
      
      expect(result).toEqual([todayRide]);
    });

    it('should return empty array when no rides for today', () => {
      const rides = [{ ...mockRide, date: '2023-01-01' }];
      
      const result = component.getTodayRides(rides);
      
      expect(result).toEqual([]);
    });
  });
});

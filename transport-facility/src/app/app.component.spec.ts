import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, NavigationEnd } from '@angular/router';
import { AppComponent } from './app.component';
import { EmployeeService } from './services/employee.service';
import { of, Subject } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let routerEventsSubject: Subject<any>;

  beforeEach(() => {
    routerEventsSubject = new Subject();
    mockEmployeeService = jasmine.createSpyObj('EmployeeService', ['getCurrentEmployee', 'logout']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: routerEventsSubject.asObservable()
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title', () => {
    expect(component.title).toEqual('Transport Facility');
  });

  it('should initialize with empty current route and null employee', () => {
    expect(component.currentRoute).toBe('');
    expect(component.currentEmployeeId).toBeNull();
  });

  describe('ngOnInit', () => {
    it('should get current employee on init', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('EMP001');
      
      component.ngOnInit();
      
      expect(mockEmployeeService.getCurrentEmployee).toHaveBeenCalled();
      expect(component.currentEmployeeId).toBe('EMP001');
    });

    it('should subscribe to router events and update current route', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('EMP001');
      
      component.ngOnInit();
      
      const navigationEndEvent = new NavigationEnd(1, '/dashboard', '/dashboard');
      routerEventsSubject.next(navigationEndEvent);
      
      expect(component.currentRoute).toBe('/dashboard');
      expect(mockEmployeeService.getCurrentEmployee).toHaveBeenCalledTimes(2); // Once in ngOnInit, once in subscription
    });

    it('should not update route for non-NavigationEnd events', () => {
      component.ngOnInit();
      
      routerEventsSubject.next({ type: 'other' });
      
      expect(component.currentRoute).toBe('');
    });
  });

  describe('Navigation methods', () => {
    it('should navigate to add-ride', () => {
      component.navigateToAddRide();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/add-ride']);
    });

    it('should navigate to search-rides', () => {
      component.navigateToSearchRides();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/search-rides']);
    });
  });

  describe('logout', () => {
    it('should logout employee and navigate to login', () => {
      component.currentEmployeeId = 'EMP001';
      
      component.logout();
      
      expect(mockEmployeeService.logout).toHaveBeenCalled();
      expect(component.currentEmployeeId).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Route checking methods', () => {
    it('should return true for login page when current route is /login', () => {
      component.currentRoute = '/login';
      expect(component.isLoginPage()).toBe(true);
    });

    it('should return false for login page when current route is not /login', () => {
      component.currentRoute = '/dashboard';
      expect(component.isLoginPage()).toBe(false);
    });

    it('should return true for active route when routes match', () => {
      component.currentRoute = '/dashboard';
      expect(component.isActiveRoute('/dashboard')).toBe(true);
    });

    it('should return false for active route when routes do not match', () => {
      component.currentRoute = '/dashboard';
      expect(component.isActiveRoute('/add-ride')).toBe(false);
    });
  });

  describe('getCurrentDate', () => {
    it('should return formatted current date', () => {
      const mockDate = new Date('2023-12-25');
      spyOn(window, 'Date').and.returnValue(mockDate as any);
      
      const result = component.getCurrentDate();
      
      expect(result).toContain('Monday');
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { EmployeeService } from '../services/employee.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockEmployeeService = jasmine.createSpyObj('EmployeeService', ['getCurrentEmployee']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when employee is logged in', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('EMP001');
      
      const result = guard.canActivate();
      
      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should return false and navigate to login when no employee is logged in', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue(null);
      
      const result = guard.canActivate();
      
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should return false and navigate to login when employee is empty string', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('');
      
      const result = guard.canActivate();
      
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should return true for valid employee ID', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('VALID_EMP_ID');
      
      const result = guard.canActivate();
      
      expect(result).toBe(true);
      expect(mockEmployeeService.getCurrentEmployee).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple consecutive calls correctly', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue(null);
      expect(guard.canActivate()).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      
      mockRouter.navigate.calls.reset();
      
      mockEmployeeService.getCurrentEmployee.and.returnValue('EMP001');
      expect(guard.canActivate()).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should work with different employee IDs', () => {
      const employeeIds = ['EMP001', 'ADMIN', 'USER123', 'test@company.com'];
      
      employeeIds.forEach(empId => {
        mockEmployeeService.getCurrentEmployee.and.returnValue(empId);
        
        const result = guard.canActivate();
        
        expect(result).toBe(true);
        expect(mockRouter.navigate).not.toHaveBeenCalled();
      });
    });

    it('should handle service errors gracefully', () => {
      mockEmployeeService.getCurrentEmployee.and.throwError('Service error');
      
      expect(() => guard.canActivate()).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined return from service', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue(undefined as any);
      
      const result = guard.canActivate();
      
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle whitespace-only employee ID', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('   ');
    
      const result = guard.canActivate();
      
      expect(result).toBe(true);
    });

    it('should handle numeric employee ID as string', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('12345');
      
      const result = guard.canActivate();
      
      expect(result).toBe(true);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { EmployeeService } from './employee.service';
import { Employee } from '../models/ride.model';

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeService);
    
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('localStorage interaction', () => {
    it('should return empty array when no employees in storage', () => {
      const employees = service['getEmployeesFromStorage']();
      expect(employees).toEqual([]);
    });

    it('should return employees from storage', () => {
      const mockEmployees: Employee[] = [{ id: 'EMP001' }, { id: 'EMP002' }];
      localStorage.setItem('transport_employees', JSON.stringify(mockEmployees));
      
      const employees = service['getEmployeesFromStorage']();
      expect(employees).toEqual(mockEmployees);
    });

    it('should save employees to storage', () => {
      const mockEmployees: Employee[] = [{ id: 'EMP001' }, { id: 'EMP002' }];
      
      service['saveEmployeesToStorage'](mockEmployees);
      
      const stored = JSON.parse(localStorage.getItem('transport_employees') || '[]');
      expect(stored).toEqual(mockEmployees);
    });
  });

  describe('setCurrentEmployee', () => {
    it('should set current employee in localStorage', () => {
      service.setCurrentEmployee('EMP001');
      
      const currentEmployee = localStorage.getItem('current_employee');
      expect(currentEmployee).toBe('EMP001');
    });

    it('should add employee to employees list if not exists', () => {
      service.setCurrentEmployee('EMP001');
      
      const employees = JSON.parse(localStorage.getItem('transport_employees') || '[]');
      expect(employees).toContain(jasmine.objectContaining({ id: 'EMP001' }));
    });

    it('should not duplicate employee if already exists', () => {
      const existingEmployees: Employee[] = [{ id: 'EMP001' }];
      localStorage.setItem('transport_employees', JSON.stringify(existingEmployees));
      
      service.setCurrentEmployee('EMP001');
      
      const employees = JSON.parse(localStorage.getItem('transport_employees') || '[]');
      expect(employees.length).toBe(1);
      expect(employees[0].id).toBe('EMP001');
    });

    it('should add new employee to existing list', () => {
      const existingEmployees: Employee[] = [{ id: 'EMP001' }];
      localStorage.setItem('transport_employees', JSON.stringify(existingEmployees));
      
      service.setCurrentEmployee('EMP002');
      
      const employees = JSON.parse(localStorage.getItem('transport_employees') || '[]');
      expect(employees.length).toBe(2);
      expect(employees.map((emp: Employee) => emp.id)).toContain('EMP001');
      expect(employees.map((emp: Employee) => emp.id)).toContain('EMP002');
    });
  });

  describe('getCurrentEmployee', () => {
    it('should return null when no current employee', () => {
      const currentEmployee = service.getCurrentEmployee();
      expect(currentEmployee).toBeNull();
    });

    it('should return current employee from localStorage', () => {
      localStorage.setItem('current_employee', 'EMP001');
      
      const currentEmployee = service.getCurrentEmployee();
      expect(currentEmployee).toBe('EMP001');
    });
  });

  describe('employeeExists', () => {
    beforeEach(() => {
      const employees: Employee[] = [{ id: 'EMP001' }, { id: 'EMP002' }];
      localStorage.setItem('transport_employees', JSON.stringify(employees));
    });

    it('should return true for existing employee', () => {
      const exists = service.employeeExists('EMP001');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing employee', () => {
      const exists = service.employeeExists('EMP999');
      expect(exists).toBe(false);
    });

    it('should return false when no employees exist', () => {
      localStorage.removeItem('transport_employees');
      
      const exists = service.employeeExists('EMP001');
      expect(exists).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove current employee from localStorage', () => {
      localStorage.setItem('current_employee', 'EMP001');
      
      service.logout();
      
      const currentEmployee = localStorage.getItem('current_employee');
      expect(currentEmployee).toBeNull();
    });

    it('should handle logout when no current employee', () => {
      expect(() => service.logout()).not.toThrow();
      
      const currentEmployee = localStorage.getItem('current_employee');
      expect(currentEmployee).toBeNull();
    });
  });

  describe('getAllEmployees', () => {
    it('should return empty array when no employees', () => {
      const employees = service.getAllEmployees();
      expect(employees).toEqual([]);
    });

    it('should return all employees from storage', () => {
      const mockEmployees: Employee[] = [
        { id: 'EMP001', name: 'John Doe' },
        { id: 'EMP002', name: 'Jane Smith' }
      ];
      localStorage.setItem('transport_employees', JSON.stringify(mockEmployees));
      
      const employees = service.getAllEmployees();
      expect(employees).toEqual(mockEmployees);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete employee workflow', () => {
      // Initially no employees
      expect(service.getAllEmployees()).toEqual([]);
      expect(service.getCurrentEmployee()).toBeNull();
      
      // Set current employee
      service.setCurrentEmployee('EMP001');
      expect(service.getCurrentEmployee()).toBe('EMP001');
      expect(service.employeeExists('EMP001')).toBe(true);
      expect(service.getAllEmployees().length).toBe(1);
      
      service.setCurrentEmployee('EMP002');
      expect(service.getCurrentEmployee()).toBe('EMP002');
      expect(service.getAllEmployees().length).toBe(2);
      
      service.logout();
      expect(service.getCurrentEmployee()).toBeNull();
      expect(service.getAllEmployees().length).toBe(2); 
    });

    it('should handle malformed localStorage data', () => {
      localStorage.setItem('transport_employees', 'invalid json');
      
      const employees = service.getAllEmployees();
      expect(employees).toEqual([]);
    });
  });
});

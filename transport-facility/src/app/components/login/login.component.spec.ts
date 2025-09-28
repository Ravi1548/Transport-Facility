import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { EmployeeService } from '../../services/employee.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockEmployeeService = jasmine.createSpyObj('EmployeeService', ['getCurrentEmployee', 'setCurrentEmployee']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty employeeId', () => {
    expect(component.loginForm.get('employeeId')?.value).toBe('');
  });

  it('should initialize with correct default values', () => {
    expect(component.isSubmitting).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  describe('Form Validation', () => {
    it('should be invalid when employeeId is empty', () => {
      component.loginForm.patchValue({ employeeId: '' });
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should be invalid when employeeId is less than 3 characters', () => {
      component.loginForm.patchValue({ employeeId: 'ab' });
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should be invalid when employeeId is more than 20 characters', () => {
      component.loginForm.patchValue({ employeeId: 'a'.repeat(21) });
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should be valid when employeeId is between 3-20 characters', () => {
      component.loginForm.patchValue({ employeeId: 'EMP001' });
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should redirect to search-rides if already logged in', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue('EMP001');
      
      component.ngOnInit();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/search-rides']);
    });

    it('should not redirect if not logged in', () => {
      mockEmployeeService.getCurrentEmployee.and.returnValue(null);
      
      component.ngOnInit();
      
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit', () => {
    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({ employeeId: '' });
      spyOn(component as any, 'markFormGroupTouched');
      
      component.onSubmit();
      
      expect((component as any).markFormGroupTouched).toHaveBeenCalled();
      expect(mockEmployeeService.setCurrentEmployee).not.toHaveBeenCalled();
    });

    it('should submit and navigate when form is valid', () => {
      component.loginForm.patchValue({ employeeId: 'EMP001' });
      
      component.onSubmit();
      
      expect(component.isSubmitting).toBe(true);
      expect(component.errorMessage).toBe('');
      expect(mockEmployeeService.setCurrentEmployee).toHaveBeenCalledWith('EMP001');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/search-rides']);
    });

    it('should handle trimmed employee ID', () => {
      component.loginForm.patchValue({ employeeId: '  EMP001  ' });
      
      component.onSubmit();
      
      expect(mockEmployeeService.setCurrentEmployee).toHaveBeenCalledWith('EMP001');
    });

    it('should show error for empty trimmed employee ID', () => {
      component.loginForm.patchValue({ employeeId: '   ' });
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Please enter a valid Employee ID');
      expect(component.isSubmitting).toBe(false);
      expect(mockEmployeeService.setCurrentEmployee).not.toHaveBeenCalled();
    });
  });

  describe('isFieldInvalid', () => {
    it('should return true for invalid touched field', () => {
      const control = component.loginForm.get('employeeId');
      control?.setValue('');
      control?.markAsTouched();
      
      expect(component.isFieldInvalid('employeeId')).toBe(true);
    });

    it('should return true for invalid dirty field', () => {
      const control = component.loginForm.get('employeeId');
      control?.setValue('');
      control?.markAsDirty();
      
      expect(component.isFieldInvalid('employeeId')).toBe(true);
    });

    it('should return false for valid field', () => {
      const control = component.loginForm.get('employeeId');
      control?.setValue('EMP001');
      control?.markAsTouched();
      
      expect(component.isFieldInvalid('employeeId')).toBe(false);
    });

    it('should return false for invalid untouched field', () => {
      const control = component.loginForm.get('employeeId');
      control?.setValue('');
      
      expect(component.isFieldInvalid('employeeId')).toBe(false);
    });
  });

  describe('getFieldError', () => {
    it('should return required error message', () => {
      const control = component.loginForm.get('employeeId');
      control?.setValue('');
      control?.markAsTouched();
      
      expect(component.getFieldError('employeeId')).toBe('Employee ID is required');
    });

    it('should return minlength error message', () => {
      const control = component.loginForm.get('employeeId');
      control?.setValue('ab');
      control?.markAsTouched();
      
      expect(component.getFieldError('employeeId')).toBe('Employee ID must be at least 3 characters');
    });

    it('should return maxlength error message', () => {
      const control = component.loginForm.get('employeeId');
      control?.setValue('a'.repeat(21));
      control?.markAsTouched();
      
      expect(component.getFieldError('employeeId')).toBe('Employee ID cannot exceed 20 characters');
    });

    it('should return empty string for valid field', () => {
      const control = component.loginForm.get('employeeId');
      control?.setValue('EMP001');
      
      expect(component.getFieldError('employeeId')).toBe('');
    });
  });

  describe('markFormGroupTouched', () => {
    it('should mark all form controls as touched', () => {
      const control = component.loginForm.get('employeeId');
      expect(control?.touched).toBe(false);
      
      (component as any).markFormGroupTouched();
      
      expect(control?.touched).toBe(true);
    });
  });
});

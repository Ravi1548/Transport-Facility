import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      employeeId: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]]
    });
  }

  ngOnInit(): void {
    // If already logged in, redirect to search rides
    if (this.employeeService.getCurrentEmployee()) {
      this.router.navigate(['/search-rides']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const employeeId = this.loginForm.get('employeeId')?.value?.trim();
      
      if (employeeId) {
        // Set the current employee
        this.employeeService.setCurrentEmployee(employeeId);
        this.router.navigate(['/search-rides']);
      } else {
        this.errorMessage = 'Please enter a valid Employee ID';
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Employee ID is required';
      if (field.errors['minlength']) return 'Employee ID must be at least 3 characters';
      if (field.errors['maxlength']) return 'Employee ID cannot exceed 20 characters';
    }
    return '';
  }
}
import { Injectable } from '@angular/core';
import { Employee } from '../models/ride.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly EMPLOYEES_KEY = 'transport_employees';
  private readonly CURRENT_EMPLOYEE_KEY = 'current_employee';

  constructor() { }

  private getEmployeesFromStorage(): Employee[] {
    try {
      const employeesJson = localStorage.getItem(this.EMPLOYEES_KEY);
      return employeesJson ? JSON.parse(employeesJson) : [];
    } catch (error) {
      console.error('Error parsing employees from localStorage:', error);
      return [];
    }
  }

  private saveEmployeesToStorage(employees: Employee[]): void {
    localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(employees));
  }

  setCurrentEmployee(employeeId: string): void {
    localStorage.setItem(this.CURRENT_EMPLOYEE_KEY, employeeId);
    
    // Add employee to employees list if not exists
    const employees = this.getEmployeesFromStorage();
    if (!employees.find(emp => emp.id === employeeId)) {
      employees.push({ id: employeeId });
      this.saveEmployeesToStorage(employees);
    }
  }

  getCurrentEmployee(): string | null {
    return localStorage.getItem(this.CURRENT_EMPLOYEE_KEY);
  }

  employeeExists(employeeId: string): boolean {
    const employees = this.getEmployeesFromStorage();
    return employees.some(emp => emp.id === employeeId);
  }

  logout(): void {
    localStorage.removeItem(this.CURRENT_EMPLOYEE_KEY);
  }

  getAllEmployees(): Employee[] {
    return this.getEmployeesFromStorage();
  }
}
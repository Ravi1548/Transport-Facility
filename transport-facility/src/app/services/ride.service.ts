import { Injectable } from '@angular/core';
import { Ride, RideBooking } from '../models/ride.model';

@Injectable({
  providedIn: 'root'
})
export class RideService {
  private readonly RIDES_KEY = 'transport_rides';
  private readonly BOOKINGS_KEY = 'transport_bookings';

  constructor() { }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private getRidesFromStorage(): Ride[] {
    const ridesJson = localStorage.getItem(this.RIDES_KEY);
    return ridesJson ? JSON.parse(ridesJson) : [];
  }

  private saveRidesToStorage(rides: Ride[]): void {
    localStorage.setItem(this.RIDES_KEY, JSON.stringify(rides));
  }

  private getBookingsFromStorage(): RideBooking[] {
    const bookingsJson = localStorage.getItem(this.BOOKINGS_KEY);
    return bookingsJson ? JSON.parse(bookingsJson) : [];
  }

  private saveBookingsToStorage(bookings: RideBooking[]): void {
    localStorage.setItem(this.BOOKINGS_KEY, JSON.stringify(bookings));
  }

  // Check if employee already has a ride for today
  hasRideForToday(employeeId: string): boolean {
    const rides = this.getRidesFromStorage();
    const today = this.getTodayDate();
    return rides.some(ride => ride.employeeId === employeeId && ride.date === today);
  }

  addRide(rideData: Omit<Ride, 'id' | 'date' | 'bookedBy'>): boolean {
    try {
      if (this.hasRideForToday(rideData.employeeId)) {
        return false;
      }

      // Check for time conflicts with existing bookings
      const today = this.getTodayDate();
      const timeConflict = this.hasTimeConflict(rideData.employeeId, rideData.time, today);
      if (timeConflict) {
        return false;
      }

      const rides = this.getRidesFromStorage();
      const newRide: Ride = {
        ...rideData,
        id: this.generateId(),
        date: this.getTodayDate(),
        bookedBy: []
      };

      rides.push(newRide);
      this.saveRidesToStorage(rides);
      return true;
    } catch (error) {
      console.error('Error adding ride:', error);
      return false;
    }
  }

  getTodaysAvailableRides(): Ride[] {
    const rides = this.getRidesFromStorage();
    const today = this.getTodayDate();
    return rides.filter(ride => ride.date === today && ride.vacantSeats > 0);
  }

  // Get available rides for an employee (excluding their own rides) within time range
  getAvailableRides(employeeId: string, timeRangeMinutes: number = 60): Ride[] {
    const rides = this.getRidesFromStorage();
    const today = this.getTodayDate();
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    return rides.filter(ride => {
      if (ride.date !== today) return false;
      
      // Exclude employee's own rides
      if (ride.employeeId === employeeId) return false;

      if (ride.vacantSeats <= 0) return false;
      
      if (timeRangeMinutes > 0) {
        return this.isWithinTimeRange(ride.time, currentTime, timeRangeMinutes);
      }
      
      return true;
    });
  }

  searchRides(searchTime?: string, vehicleType?: 'Bike' | 'Car'): Ride[] {
    let rides = this.getTodaysAvailableRides();

    if (vehicleType) {
      rides = rides.filter(ride => ride.vehicleType === vehicleType);
    }

    if (searchTime) {
      rides = rides.filter(ride => this.isWithinTimeRange(ride.time, searchTime));
    }

    return rides;
  }

  private isWithinTimeRange(rideTime: string, searchTime: string, rangeMinutes: number = 60): boolean {
    const rideMinutes = this.timeToMinutes(rideTime);
    const searchMinutes = this.timeToMinutes(searchTime);
    const difference = Math.abs(rideMinutes - searchMinutes);
    return difference <= rangeMinutes;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  bookRide(rideId: string, employeeId: string): { success: boolean; message: string } {
    try {
      const rides = this.getRidesFromStorage();
      const rideIndex = rides.findIndex(ride => ride.id === rideId);

      if (rideIndex === -1) {
        return { success: false, message: 'Ride not found' };
      }

      const ride = rides[rideIndex];

      if (ride.employeeId === employeeId) {
        return { success: false, message: 'You cannot book your own ride' };
      }

      if (ride.bookedBy.includes(employeeId)) {
        return { success: false, message: 'You have already booked this ride' };
      }

      if (ride.vacantSeats <= 0) {
        return { success: false, message: 'No vacant seats available' };
      }

      const timeConflict = this.hasTimeConflict(employeeId, ride.time, ride.date);
      if (timeConflict) {
        return { success: false, message: 'You already have a ride booked at this time.' };
      }

      ride.bookedBy.push(employeeId);
      ride.vacantSeats -= 1;
      rides[rideIndex] = ride;
      this.saveRidesToStorage(rides);

      const bookings = this.getBookingsFromStorage();
      const newBooking: RideBooking = {
        rideId,
        employeeId,
        bookingDate: this.getTodayDate()
      };
      bookings.push(newBooking);
      this.saveBookingsToStorage(bookings);

      return { success: true, message: 'Ride booked successfully' };
    } catch (error) {
      console.error('Error booking ride:', error);
      return { success: false, message: 'Error booking ride' };
    }
  }

  getBookedRides(employeeId: string): Ride[] {
    const rides = this.getRidesFromStorage();
    const today = this.getTodayDate();
    return rides.filter(ride => 
      ride.date === today && ride.bookedBy.includes(employeeId)
    );
  }

  getMyRides(employeeId: string): Ride[] {
    const rides = this.getRidesFromStorage();
    const today = this.getTodayDate();
    return rides.filter(ride => 
      ride.date === today && ride.employeeId === employeeId
    );
  }

  private hasTimeConflict(employeeId: string, newRideTime: string, newRideDate: string): boolean {
    const rides = this.getRidesFromStorage();
    
    // Get all rides where employee is involved 
    const employeeRides = rides.filter(ride => 
      ride.date === newRideDate && (
        ride.employeeId === employeeId || 
        ride.bookedBy.includes(employeeId) 
      )
    );

    return employeeRides.some(ride => ride.time === newRideTime);
  }

  getRidesByEmployee(employeeId: string): Ride[] {
    return this.getMyRides(employeeId);
  }

  getBookedRidesByEmployee(employeeId: string): Ride[] {
    return this.getBookedRides(employeeId);
  }

  canEmployeeAddRide(employeeId: string): boolean {
    return !this.hasRideForToday(employeeId);
  }
}
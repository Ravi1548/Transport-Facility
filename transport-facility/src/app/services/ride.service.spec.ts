import { TestBed } from '@angular/core/testing';
import { RideService } from './ride.service';
import { Ride, VehicleType, RideBooking } from '../models/ride.model';

describe('RideService', () => {
  let service: RideService;
  let mockRide: Ride;
  let today: string;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RideService);
    
    localStorage.clear();
    
    today = new Date().toISOString().split('T')[0];
    mockRide = {
      id: '1',
      employeeId: 'EMP001',
      vehicleType: VehicleType.CAR,
      vehicleNo: 'DL01AB1234',
      vacantSeats: 3,
      time: '09:00',
      date: today,
      pickupPoint: 'Office Main Gate',
      destination: 'Metro Station',
      bookedBy: []
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Private helper methods', () => {
    it('should get today\'s date in correct format', () => {
      const todayDate = service['getTodayDate']();
      expect(todayDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(todayDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should generate unique IDs', () => {
      const id1 = service['generateId']();
      const id2 = service['generateId']();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should convert time to minutes correctly', () => {
      expect(service['timeToMinutes']('09:30')).toBe(570); // 9*60 + 30
      expect(service['timeToMinutes']('00:00')).toBe(0);
      expect(service['timeToMinutes']('23:59')).toBe(1439);
    });

    it('should check if time is within range', () => {
      expect(service['isWithinTimeRange']('09:00', '09:30', 60)).toBe(true);
      expect(service['isWithinTimeRange']('09:00', '10:30', 60)).toBe(false);
      expect(service['isWithinTimeRange']('09:00', '09:00', 60)).toBe(true);
    });
  });

  describe('localStorage operations', () => {
    it('should return empty array when no rides in storage', () => {
      const rides = service['getRidesFromStorage']();
      expect(rides).toEqual([]);
    });

    it('should save and retrieve rides from storage', () => {
      const rides = [mockRide];
      
      service['saveRidesToStorage'](rides);
      const retrieved = service['getRidesFromStorage']();
      
      expect(retrieved).toEqual(rides);
    });

    it('should return empty array when no bookings in storage', () => {
      const bookings = service['getBookingsFromStorage']();
      expect(bookings).toEqual([]);
    });

    it('should save and retrieve bookings from storage', () => {
      const bookings: RideBooking[] = [{
        rideId: '1',
        employeeId: 'EMP001',
        bookingDate: today
      }];
      
      service['saveBookingsToStorage'](bookings);
      const retrieved = service['getBookingsFromStorage']();
      
      expect(retrieved).toEqual(bookings);
    });
  });

  describe('hasRideForToday', () => {
    it('should return false when employee has no rides today', () => {
      expect(service.hasRideForToday('EMP001')).toBe(false);
    });

    it('should return true when employee has ride today', () => {
      localStorage.setItem('transport_rides', JSON.stringify([mockRide]));
      
      expect(service.hasRideForToday('EMP001')).toBe(true);
    });

    it('should return false when employee has ride on different date', () => {
      const yesterdayRide = { ...mockRide, date: '2023-01-01' };
      localStorage.setItem('transport_rides', JSON.stringify([yesterdayRide]));
      
      expect(service.hasRideForToday('EMP001')).toBe(false);
    });
  });

  describe('addRide', () => {
    const rideData = {
      employeeId: 'EMP001',
      vehicleType: VehicleType.CAR,
      vehicleNo: 'DL01AB1234',
      vacantSeats: 3,
      time: '09:00',
      pickupPoint: 'Office Main Gate',
      destination: 'Metro Station'
    };

    it('should add ride successfully', () => {
      const result = service.addRide(rideData);
      
      expect(result).toBe(true);
      
      const rides = service['getRidesFromStorage']();
      expect(rides.length).toBe(1);
      expect(rides[0].employeeId).toBe('EMP001');
      expect(rides[0].date).toBe(today);
      expect(rides[0].bookedBy).toEqual([]);
    });

    it('should not add ride if employee already has ride today', () => {
      localStorage.setItem('transport_rides', JSON.stringify([mockRide]));
      
      const result = service.addRide(rideData);
      
      expect(result).toBe(false);
    });

    it('should not add ride if time conflict exists', () => {
      const conflictRide = { ...mockRide, employeeId: 'EMP002', bookedBy: ['EMP001'] };
      localStorage.setItem('transport_rides', JSON.stringify([conflictRide]));
      
      const result = service.addRide(rideData);
      
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', () => {
      spyOn(service as any, 'getRidesFromStorage').and.throwError('Storage error');
      
      const result = service.addRide(rideData);
      
      expect(result).toBe(false);
    });
  });

  describe('getTodaysAvailableRides', () => {
    it('should return empty array when no rides', () => {
      const rides = service.getTodaysAvailableRides();
      expect(rides).toEqual([]);
    });

    it('should return only today\'s rides with vacant seats', () => {
      const todayRide = mockRide;
      const yesterdayRide = { ...mockRide, id: '2', date: '2023-01-01' };
      const fullRide = { ...mockRide, id: '3', vacantSeats: 0 };
      
      localStorage.setItem('transport_rides', JSON.stringify([todayRide, yesterdayRide, fullRide]));
      
      const rides = service.getTodaysAvailableRides();
      
      expect(rides.length).toBe(1);
      expect(rides[0].id).toBe('1');
    });
  });

  describe('getAvailableRides', () => {
    beforeEach(() => {
      const rides = [
        mockRide,
        { ...mockRide, id: '2', employeeId: 'EMP002', time: '10:00' },
        { ...mockRide, id: '3', employeeId: 'EMP001' }, // Own ride
        { ...mockRide, id: '4', vacantSeats: 0 } // No seats
      ];
      localStorage.setItem('transport_rides', JSON.stringify(rides));
    });

    it('should return available rides for employee', () => {
      const rides = service.getAvailableRides('EMP001', 0);
      
      expect(rides.length).toBe(1);
      expect(rides[0].id).toBe('2');
    });

    it('should exclude employee\'s own rides', () => {
      const rides = service.getAvailableRides('EMP001', 0);
      
      expect(rides.every(ride => ride.employeeId !== 'EMP001')).toBe(true);
    });

    it('should exclude rides with no vacant seats', () => {
      const rides = service.getAvailableRides('EMP001', 0);
      
      expect(rides.every(ride => ride.vacantSeats > 0)).toBe(true);
    });
  });

  describe('searchRides', () => {
    beforeEach(() => {
      const rides = [
        { ...mockRide, vehicleType: VehicleType.CAR, time: '09:00' },
        { ...mockRide, id: '2', vehicleType: VehicleType.BIKE, time: '10:00' },
        { ...mockRide, id: '3', vehicleType: VehicleType.CAR, time: '11:00' }
      ];
      localStorage.setItem('transport_rides', JSON.stringify(rides));
    });

    it('should return all rides when no filters', () => {
      const rides = service.searchRides();
      expect(rides.length).toBe(3);
    });

    it('should filter by vehicle type', () => {
      const rides = service.searchRides(undefined, 'Car');
      expect(rides.length).toBe(2);
      expect(rides.every(ride => ride.vehicleType === VehicleType.CAR)).toBe(true);
    });

    it('should filter by time range', () => {
      const rides = service.searchRides('09:30');
      expect(rides.length).toBe(2); 
    });

    it('should filter by both vehicle type and time', () => {
      const rides = service.searchRides('09:30', 'Car');
      expect(rides.length).toBe(1);
      expect(rides[0].vehicleType).toBe(VehicleType.CAR);
    });
  });

  describe('bookRide', () => {
    beforeEach(() => {
      localStorage.setItem('transport_rides', JSON.stringify([mockRide]));
    });

    it('should book ride successfully', () => {
      const result = service.bookRide('1', 'EMP002');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ride booked successfully');
      
      const rides = service['getRidesFromStorage']();
      expect(rides[0].bookedBy).toContain('EMP002');
      expect(rides[0].vacantSeats).toBe(2);
      
      const bookings = service['getBookingsFromStorage']();
      expect(bookings.length).toBe(1);
      expect(bookings[0].employeeId).toBe('EMP002');
    });

    it('should not allow booking non-existent ride', () => {
      const result = service.bookRide('999', 'EMP002');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Ride not found');
    });

    it('should not allow employee to book own ride', () => {
      const result = service.bookRide('1', 'EMP001');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('You cannot book your own ride');
    });

    it('should not allow double booking', () => {
      const rideWithBooking = { ...mockRide, bookedBy: ['EMP002'] };
      localStorage.setItem('transport_rides', JSON.stringify([rideWithBooking]));
      
      const result = service.bookRide('1', 'EMP002');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('You have already booked this ride');
    });

    it('should not allow booking when no seats available', () => {
      const fullRide = { ...mockRide, vacantSeats: 0 };
      localStorage.setItem('transport_rides', JSON.stringify([fullRide]));
      
      const result = service.bookRide('1', 'EMP002');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('No vacant seats available');
    });

    it('should not allow booking with time conflict', () => {
      const conflictRide = { ...mockRide, id: '2', employeeId: 'EMP003', bookedBy: ['EMP002'] };
      localStorage.setItem('transport_rides', JSON.stringify([mockRide, conflictRide]));
      
      const result = service.bookRide('1', 'EMP002');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('You already have a ride booked at this time');
    });

    it('should handle booking errors gracefully', () => {
      spyOn(service as any, 'getRidesFromStorage').and.throwError('Storage error');
      
      const result = service.bookRide('1', 'EMP002');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error booking ride');
    });
  });

  describe('getBookedRides', () => {
    it('should return rides booked by employee', () => {
      const bookedRide = { ...mockRide, bookedBy: ['EMP002'] };
      localStorage.setItem('transport_rides', JSON.stringify([bookedRide]));
      
      const rides = service.getBookedRides('EMP002');
      
      expect(rides.length).toBe(1);
      expect(rides[0].bookedBy).toContain('EMP002');
    });

    it('should return empty array when no bookings', () => {
      const rides = service.getBookedRides('EMP002');
      expect(rides).toEqual([]);
    });
  });

  describe('getMyRides', () => {
    it('should return rides created by employee', () => {
      localStorage.setItem('transport_rides', JSON.stringify([mockRide]));
      
      const rides = service.getMyRides('EMP001');
      
      expect(rides.length).toBe(1);
      expect(rides[0].employeeId).toBe('EMP001');
    });

    it('should return empty array when no rides', () => {
      const rides = service.getMyRides('EMP002');
      expect(rides).toEqual([]);
    });
  });

  describe('hasTimeConflict', () => {
    beforeEach(() => {
      const conflictRide = { ...mockRide, bookedBy: ['EMP002'] };
      localStorage.setItem('transport_rides', JSON.stringify([conflictRide]));
    });

    it('should detect time conflict for employee\'s own ride', () => {
      const hasConflict = service['hasTimeConflict']('EMP001', '09:00', today);
      expect(hasConflict).toBe(true);
    });

    it('should detect time conflict for booked ride', () => {
      const hasConflict = service['hasTimeConflict']('EMP002', '09:00', today);
      expect(hasConflict).toBe(true);
    });

    it('should return false for different time', () => {
      const hasConflict = service['hasTimeConflict']('EMP001', '10:00', today);
      expect(hasConflict).toBe(false);
    });

    it('should return false for different date', () => {
      const hasConflict = service['hasTimeConflict']('EMP001', '09:00', '2023-01-01');
      expect(hasConflict).toBe(false);
    });
  });

  describe('Utility methods', () => {
    it('should check if employee can add ride', () => {
      expect(service.canEmployeeAddRide('EMP001')).toBe(true);
      
      localStorage.setItem('transport_rides', JSON.stringify([mockRide]));
      expect(service.canEmployeeAddRide('EMP001')).toBe(false);
    });

    it('should get rides by employee (alias for getMyRides)', () => {
      localStorage.setItem('transport_rides', JSON.stringify([mockRide]));
      
      const rides = service.getRidesByEmployee('EMP001');
      expect(rides).toEqual(service.getMyRides('EMP001'));
    });

    it('should get booked rides by employee (alias for getBookedRides)', () => {
      const bookedRide = { ...mockRide, bookedBy: ['EMP002'] };
      localStorage.setItem('transport_rides', JSON.stringify([bookedRide]));
      
      const rides = service.getBookedRidesByEmployee('EMP002');
      expect(rides).toEqual(service.getBookedRides('EMP002'));
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete ride lifecycle', () => {
      const rideData = {
        employeeId: 'EMP001',
        vehicleType: VehicleType.CAR,
        vehicleNo: 'DL01AB1234',
        vacantSeats: 3,
        time: '09:00',
        pickupPoint: 'Office Main Gate',
        destination: 'Metro Station'
      };
      
      expect(service.addRide(rideData)).toBe(true);
      expect(service.hasRideForToday('EMP001')).toBe(true);
      
      const availableRides = service.getAvailableRides('EMP002', 0);
      expect(availableRides.length).toBe(1);
      
      const bookingResult = service.bookRide(availableRides[0].id, 'EMP002');
      expect(bookingResult.success).toBe(true);
      
      const bookedRides = service.getBookedRides('EMP002');
      expect(bookedRides.length).toBe(1);
      
      const myRides = service.getMyRides('EMP001');
      expect(myRides[0].bookedBy).toContain('EMP002');
    });
  });
});
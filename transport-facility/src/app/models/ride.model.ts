export enum VehicleType {
  BIKE = 'Bike',
  CAR = 'Car'
}

export interface Ride {
  id: string;
  employeeId: string;
  vehicleType: VehicleType;
  vehicleNo: string;
  vacantSeats: number;
  time: string; 
  date: string; 
  pickupPoint: string;
  destination: string;
  bookedBy: string[]; 
}

export interface Employee {
  id: string;
  name?: string;
}

export interface RideBooking {
  rideId: string;
  employeeId: string;
  bookingDate: string;
}
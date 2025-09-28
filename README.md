# Transport Facility - Employee Ride Sharing System

A modern Angular web application that allows employees to add rides and book transport with colleagues. All data is stored locally using localStorage (no backend required).

## Features

### Add a Ride
- **One ride per day**: Each employee can add exactly one ride per day (today only)
- **Mandatory fields**:
  - Employee ID (unique per ride owner per day)
  - Vehicle Type (Bike / Car)
  - Vehicle Number (Indian format validation)
  - Vacant Seats (≥ 1)
  - Time (must be today, in HH:mm format)
  - Pickup Point
  - Destination

### Search & View Rides
- **Time-based search**: Find rides within ±60 minutes of requested time
- **Vehicle type filter**: Filter by Bike or Car
- **Today's rides only**: Shows only rides for the current date
- **Available seats**: Only displays rides with vacant seats > 0

### Book a Ride
- **Smart booking rules**:
  - Cannot book your own ride
  - Cannot book the same ride twice
  - Ride must have at least 1 vacant seat
- **Real-time updates**: Vacant seats decrease automatically on booking

## 🛠️ Technology Stack

- **Frontend**: Angular 15+
- **Styling**: Modern CSS with responsive design
- **Forms**: Reactive Forms with validation
- **Storage**: localStorage (no backend required)


 **Start the development server**
   ```bash
   npm start
   # or
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

### Build for Production

```bash
npm run build
# or
ng build --prod
```

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Mock flight data for demonstration
const generateMockFlightData = (baseDate) => {
  const airports = [
    'LHR', 'MAN', 'EDI', 'GLA', 'BHX', // UK airports
    'CDG', 'AMS', 'FRA', 'MAD', 'FCO'  // European airports
  ];
  const airlines = [
    'BA', 'EZY', 'RYR', 'VIR', 'LOG', // UK airlines
    'AF', 'KLM', 'LH', 'IB', 'AZ'      // European airlines
  ];
  const statuses = ['scheduled', 'departed', 'arrived', 'delayed', 'cancelled', 'diverted'];
  
  // Generate a random time on the given date
  const date = new Date(baseDate);
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  
  // Ensure departure and arrival airports are different
  const departureIndex = Math.floor(Math.random() * airports.length);
  let arrivalIndex;
  do {
    arrivalIndex = Math.floor(Math.random() * airports.length);
  } while (arrivalIndex === departureIndex);
  
  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    flightNumber: `${airline}${Math.floor(Math.random() * 1000)}`,
    departureAirport: airports[departureIndex],
    arrivalAirport: airports[arrivalIndex],
    scheduledDeparture: date.toISOString(),
    status: status,
    delay: status === 'delayed' ? Math.floor(Math.random() * 180) + 15 : 0, // Minimum 15 minutes delay
    airline: airline
  };
};

// Middleware
app.use(express.json());

// Routes
app.get('/api/flights/live', (req, res) => {
  const flights = Array(20).fill(null).map(generateMockFlightData);
  res.json(flights);
});

app.get('/api/flights/historical', (req, res) => {
  const flights = [];
  const today = new Date();
  
  // Generate 200 flights over 3 days with a more realistic distribution
  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 3); // 0-2 days ago
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() - daysAgo);
    
    // Set hour between 6 AM and 11 PM for more realistic flight times
    baseDate.setHours(6 + Math.floor(Math.random() * 17));
    baseDate.setMinutes(Math.floor(Math.random() * 60));
    
    const flight = generateMockFlightData(baseDate);
    
    // Adjust delay distribution: 60% on time, 30% short delays, 10% long delays
    const delayProbability = Math.random();
    if (delayProbability > 0.6) {
      flight.status = 'delayed';
      if (delayProbability > 0.9) {
        flight.delay = Math.floor(Math.random() * 120) + 60; // 1-3 hours
      } else {
        flight.delay = Math.floor(Math.random() * 45) + 15; // 15-60 minutes
      }
    } else {
      flight.delay = 0; // Ensure delay is set to 0 for non-delayed flights
    }
    
    flights.push(flight);
  }
  
  // Sort flights by scheduled departure time
  flights.sort((a, b) => new Date(a.scheduledDeparture) - new Date(b.scheduledDeparture));
  
  // Ensure we're sending exactly 200 flights
  console.log(`Sending ${flights.length} flights`);
  res.json(flights);
});

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send updated flight data every 5 minutes
  const updateInterval = setInterval(() => {
    const newFlightData = generateMockFlightData();
    socket.emit('flightUpdate', newFlightData);
  }, 5 * 60 * 1000);
  
  socket.on('disconnect', () => {
    clearInterval(updateInterval);
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Grid, TextField, MenuItem, Typography, Autocomplete } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { io } from 'socket.io-client';
import axios from 'axios';

const LiveFlights = () => {
  const [flights, setFlights] = useState([]);
  const [filters, setFilters] = useState({
    direction: 'all',
    airports: [],
    airlines: [],
    status: 'all'
  });

  const uniqueAirports = [...new Set(flights.flatMap(flight => [flight.departureAirport, flight.arrivalAirport]))];
  const uniqueAirlines = [...new Set(flights.map(flight => flight.airline))];

  const columns = [
    { field: 'flightNumber', headerName: 'Flight Number', width: 130 },
    { field: 'airline', headerName: 'Airline', width: 130 },
    { field: 'departureAirport', headerName: 'Departure', width: 130 },
    { field: 'arrivalAirport', headerName: 'Arrival', width: 130 },
    { field: 'scheduledDeparture', headerName: 'Scheduled Time', width: 180 },
    { field: 'status', headerName: 'Status', width: 130 },
    { 
      field: 'delay',
      headerName: 'Delay (mins)',
      width: 130,
      valueGetter: (params) => {
        if (params.row.status === 'delayed') {
          return params.row.delay;
        }
        return 'N/A';
      }
    }
  ];

  useEffect(() => {
    const fetchLiveFlights = async () => {
      try {
        const response = await axios.get('/api/flights/live');
        const flightsWithIds = response.data.map((flight, index) => ({
          ...flight,
          id: index
        }));
        setFlights(flightsWithIds);
      } catch (error) {
        console.error('Error fetching live flights:', error);
      }
    };

    fetchLiveFlights();

    const socket = io();
    socket.on('flightUpdate', (newFlight) => {
      setFlights(prevFlights => {
        const updatedFlights = [...prevFlights];
        const index = updatedFlights.findIndex(f => f.flightNumber === newFlight.flightNumber);
        if (index !== -1) {
          updatedFlights[index] = { ...newFlight, id: index };
        } else {
          updatedFlights.push({ ...newFlight, id: prevFlights.length });
        }
        return updatedFlights;
      });
    });

    return () => socket.disconnect();
  }, []);

  const filteredFlights = flights.filter(flight => {
    if (filters.direction !== 'all') {
      if (filters.direction === 'arrivals' && flight.arrivalAirport === filters.airport) {
        return true;
      }
      if (filters.direction === 'departures' && flight.departureAirport === filters.airport) {
        return true;
      }
      if (!filters.airport) return true;
      return false;
    }
    if (filters.airports.length > 0 && 
        !filters.airports.some(airport => 
          flight.departureAirport.toLowerCase() === airport.toLowerCase() || 
          flight.arrivalAirport.toLowerCase() === airport.toLowerCase()
        )) {
      return false;
    }
    if (filters.airlines.length > 0 && 
        !filters.airlines.some(airline => 
          flight.airline.toLowerCase() === airline.toLowerCase()
        )) {
      return false;
    }
    if (filters.status !== 'all' && flight.status !== filters.status) {
      return false;
    }
    return true;
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Live Flight Status
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <TextField
            select
            fullWidth
            label="Direction"
            value={filters.direction}
            onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="arrivals">Arrivals</MenuItem>
            <MenuItem value="departures">Departures</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <Autocomplete
            multiple
            fullWidth
            options={uniqueAirports}
            value={filters.airports}
            onChange={(e, newValue) => setFilters({ ...filters, airports: newValue })}
            renderInput={(params) => <TextField {...params} label="Airports" />}
          />
        </Grid>
        <Grid item xs={3}>
          <Autocomplete
            multiple
            fullWidth
            options={uniqueAirlines}
            value={filters.airlines}
            onChange={(e, newValue) => setFilters({ ...filters, airlines: newValue })}
            renderInput={(params) => <TextField {...params} label="Airlines" />}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            select
            fullWidth
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="departed">Departed</MenuItem>
            <MenuItem value="arrived">Arrived</MenuItem>
            <MenuItem value="delayed">Delayed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="diverted">Diverted</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <DataGrid
            rows={filteredFlights}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            autoHeight
            disableSelectionOnClick
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default LiveFlights;
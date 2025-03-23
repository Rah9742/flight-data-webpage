import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Button,
  Autocomplete
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';

const HistoricalData = () => {
  const [flights, setFlights] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    direction: 'all',
    airports: [],
    airlines: [],
    status: 'all',
    delayCategory: 'all'
  });

  const uniqueAirports = [...new Set(flights.flatMap(flight => [flight.departureAirport, flight.arrivalAirport]))];
  const uniqueAirlines = [...new Set(flights.map(flight => flight.airline))];

  const delayCategories = [
    { label: 'All', value: 'all' },
    { label: '< 15 mins', value: '0-15' },
    { label: '15-30 mins', value: '15-30' },
    { label: '30-45 mins', value: '30-45' },
    { label: '45-60 mins', value: '45-60' },
    { label: '60-90 mins', value: '60-90' },
    { label: '90-120 mins', value: '90-120' },
    { label: '120-180 mins', value: '120-180' },
    { label: '> 180 mins', value: '180+' }
  ];

  const columns = [
    { field: 'flightNumber', headerName: 'Flight Number', minWidth: 140, flex: 1, resizable: true },
    { field: 'airline', headerName: 'Airline', minWidth: 100, flex: 1, resizable: true },
    { field: 'departureAirport', headerName: 'Departure', minWidth: 100, flex: 1, resizable: true },
    { field: 'arrivalAirport', headerName: 'Arrival', minWidth: 100, flex: 1, resizable: true },
    {
      field: 'scheduledDeparture',
      headerName: 'Scheduled Time',
      minWidth: 200,
      flex: 1.5,
      type: 'dateTime',
      valueGetter: (params) => new Date(params.row.scheduledDeparture),
      resizable: true
    },
    { field: 'status', headerName: 'Status', minWidth: 140, flex: 1, resizable: true },
    {
      field: 'delay',
      headerName: 'Delay Category',
      minWidth: 200,
      flex: 1.5,
      valueGetter: (params) => {
        const delay = params.row.delay;
        if (delay === 0) return 'On Time';
        if (delay < 15) return '< 15 mins';
        if (delay < 30) return '15-30 mins';
        if (delay < 45) return '30-45 mins';
        if (delay < 60) return '45-60 mins';
        if (delay < 90) return '60-90 mins';
        if (delay < 120) return '90-120 mins';
        if (delay < 180) return '120-180 mins';
        return '> 180 mins';
      },
      resizable: true
    }
  ];

  useEffect(() => {
    const fetchHistoricalFlights = async () => {
      try {
        const response = await axios.get('/api/flights/historical');
        const flightsWithIds = response.data.map((flight, index) => ({
          ...flight,
          id: index
        }));
        setFlights(flightsWithIds);
      } catch (error) {
        console.error('Error fetching historical flights:', error);
      }
    };

    fetchHistoricalFlights();
  }, []);

  const filteredFlights = flights.filter(flight => {
    const flightDate = new Date(flight.scheduledDeparture);
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;

    if (start && flightDate < start) return false;
    if (end && flightDate > end) return false;
    if (filters.status !== 'all' && flight.status !== filters.status) return false;
    if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airline)) return false;

    if (filters.direction !== 'all') {
      if (filters.direction === 'arrivals' && !filters.airports.includes(flight.arrivalAirport)) return false;
      if (filters.direction === 'departures' && !filters.airports.includes(flight.departureAirport)) return false;
    } else if (filters.airports.length > 0) {
      if (!filters.airports.includes(flight.departureAirport) && !filters.airports.includes(flight.arrivalAirport)) return false;
    }

    if (filters.delayCategory !== 'all') {
      const delay = flight.delay;
      const category = filters.delayCategory;
      if (category === '180+' && delay < 180) return false;
      else if (category.includes('-')) {
        const [min, max] = category.split('-').map(Number);
        if (delay < min || delay >= max) return false;
      }
    }

    return true;
  });

  const handleExport = () => {
    const csv = [
      columns.map(c => c.headerName).join(','),
      ...filteredFlights.map(f => columns.map(c => {
        const val = c.valueGetter ? c.valueGetter({ row: f }) : f[c.field];
        return `"${val}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'flight_data.csv';
    link.click();
  };

  // Prepare data for the graph
  const prepareGraphData = () => {
    const delaysByDate = {};
    filteredFlights.forEach(flight => {
      const date = new Date(flight.scheduledDeparture).toLocaleDateString();
      if (!delaysByDate[date]) {
        delaysByDate[date] = {
          date,
          averageDelay: 0,
          totalFlights: 0,
          totalDelay: 0
        };
      }
      delaysByDate[date].totalFlights++;
      delaysByDate[date].totalDelay += flight.delay || 0;
    });

    return Object.values(delaysByDate)
      .map(data => ({
        ...data,
        averageDelay: parseFloat((data.totalDelay / data.totalFlights).toFixed(2))
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const graphData = prepareGraphData();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Historical Flight Data</Typography>

   

      {/* Filter UI */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            type="datetime-local"
            fullWidth
            label="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            type="datetime-local"
            fullWidth
            label="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {['all', 'scheduled', 'departed', 'arrived', 'delayed', 'cancelled', 'diverted'].map(s => (
              <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Autocomplete
            multiple
            options={uniqueAirports}
            value={filters.airports}
            onChange={(e, val) => setFilters({ ...filters, airports: val })}
            renderInput={(params) => <TextField {...params} label="Airports" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Autocomplete
            multiple
            options={uniqueAirlines}
            value={filters.airlines}
            onChange={(e, val) => setFilters({ ...filters, airlines: val })}
            renderInput={(params) => <TextField {...params} label="Airlines" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <TextField
            select
            fullWidth
            label="Delay Category"
            value={filters.delayCategory}
            onChange={(e) => setFilters({ ...filters, delayCategory: e.target.value })}
          >
            {delayCategories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Button fullWidth variant="contained" sx={{ height: '100%' }} onClick={handleExport}>
            Export to CSV
          </Button>
        </Grid>
      </Grid>

      {/* Graph */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Average Delay Trends</Typography>
          <Box sx={{ width: '100%', height: 300 }}>
            <LineChart
              width={1000}
              height={300}
              data={graphData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageDelay"
                stroke="#8884d8"
                name="Average Delay (mins)"
              />
            </LineChart>
          </Box>
        </CardContent>
      </Card>

      {/* DataGrid */}
      <DataGrid
        rows={filteredFlights}
        columns={columns}
        pageSizeOptions={[10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 }
          }
        }}
        filterMode="client"
        columnVisibilityModel={{}}
        columnResizeMode="flex"
        sx={{
          '& .MuiDataGrid-columnHeader': {
            userSelect: 'none'
          },
          '& .MuiDataGrid-columnSeparator': {
            cursor: 'col-resize'
          },
          '& .MuiDataGrid-panelWrapper': {
            minWidth: 300
          }
        }}
      />
    </Box>
  );
};

export default HistoricalData;

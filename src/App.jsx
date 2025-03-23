import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import LiveFlights from './components/LiveFlights';
import HistoricalData from './components/HistoricalData';
import Login from './components/Login';

const App = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DfT Aviation Data Portal
          </Typography>
          <Button color="inherit" component={Link} to="/live">Live Flights</Button>
          <Button color="inherit" component={Link} to="/historical">Historical Data</Button>
          <Button color="inherit" component={Link} to="/login">Login</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<LiveFlights />} />
          <Route path="/live" element={<LiveFlights />} />
          <Route path="/historical" element={<HistoricalData />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default App;
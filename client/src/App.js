import React from 'react';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Homepage from './pages/Homepage';
import './App.css';

function App() {
  return (
    <Box className="app-container">
      <Navbar />
      <Homepage />
    </Box>
  );
}

export default App;
import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import './Navbar.css';

const Navbar = () => {
  return (
    <AppBar position="sticky" className="navbar-appbar">
      <Toolbar className="navbar-toolbar">
        <Box className="navbar-logo-container">
          <IconButton edge="start" color="inherit" className="navbar-icon-button">
            <SpeedIcon className="navbar-icon" />
          </IconButton>
          <Box className="navbar-title-container">
            <Typography variant="h4" className="navbar-title">
              F1 Dashboard
            </Typography>
            <Typography variant="caption" className="navbar-subtitle">
              Formula 1 Analytics & Statistics
            </Typography>
          </Box>
        </Box>
        
        <Box className="navbar-links-container">
          <Typography variant="body1" className="navbar-link">
            Home
          </Typography>
          <Typography variant="body1" className="navbar-link-inactive">
            Drivers
          </Typography>
          <Typography variant="body1" className="navbar-link-inactive">
            Constructors
          </Typography>
          <Typography variant="body1" className="navbar-link-inactive">
            Races
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

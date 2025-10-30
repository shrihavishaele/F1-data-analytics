import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  InputBase,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import './Navbar.css';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.body.dataset.theme = saved;
  }, []);

  const handleToggleMobile = () => setMobileOpen(v => !v);
  const handleProfileOpen = (e) => setProfileAnchor(e.currentTarget);
  const handleProfileClose = () => setProfileAnchor(null);

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.body.dataset.theme = next;
  };

  const handleNav = (path) => {
    setMobileOpen(false);
    window.location.assign(path);
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setMobileOpen(false);
    window.location.assign(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const profileMenuOpen = Boolean(profileAnchor);

  const links = useMemo(() => ([
    { label: 'Dashboard', path: '/' },
    { label: 'Teams', path: '/constructors' },
    { label: 'Drivers', path: '/drivers' },
    { label: 'Races', path: '/races' },
    { label: 'Analytics', path: '/analytics' }
  ]), []);

  return (
    <AppBar position="sticky" className="navbar-appbar">
      <Toolbar className="navbar-toolbar">
        {/* Left: Logo/Brand */}
        <Box className="navbar-logo-container" onClick={() => handleNav('/')} role="button" aria-label="Home">
          <Box className="navbar-icon-button">
            <img src="/f1.png" alt="F1 Logo" className="navbar-logo-img" />
          </Box>
          <Box className="navbar-title-container">
            <Typography variant="h5" className="navbar-title">
              F1 Dashboard
            </Typography>
            <Typography variant="caption" className="navbar-subtitle">
              Analytics & Insights
            </Typography>
          </Box>
        </Box>

        {/* Center/Right: Links (desktop/tablet) */}
        <Box className="navbar-links-container" component="nav" aria-label="primary">
          {links.map(link => (
            <Typography
              key={link.path}
              variant="body1"
              className="navbar-link"
              onClick={() => handleNav(link.path)}
              role="link"
              tabIndex={0}
            >
              <span className="navbar-link-text">{link.label}</span>
              <span className="navbar-link-underline" />
            </Typography>
          ))}
        </Box>

        {/* Right: Search (desktop) */}
        <Box component="form" onSubmit={onSearchSubmit} className="navbar-search" role="search">
          <InputBase
            className="navbar-search-input"
            placeholder="Search drivers, teams, races..."
            inputProps={{ 'aria-label': 'search' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <IconButton type="submit" className="navbar-search-btn" aria-label="search">
            <SearchIcon />
          </IconButton>
        </Box>

        {/* Right: Profile menu */}
        <Box className="navbar-actions">
          <Tooltip title="Account">
            <IconButton color="inherit" onClick={handleProfileOpen} aria-controls={profileMenuOpen ? 'profile-menu' : undefined} aria-haspopup="true" aria-expanded={profileMenuOpen ? 'true' : undefined}>
              <AccountCircle />
            </IconButton>
          </Tooltip>
          <Menu
            id="profile-menu"
            anchorEl={profileAnchor}
            open={profileMenuOpen}
            onClose={handleProfileClose}
            slotProps={{ paper: { className: 'navbar-profile-menu' } }}
          >
            <MenuItem onClick={() => { handleProfileClose(); handleNav('/settings'); }}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={() => { handleProfileClose(); handleThemeToggle(); }}>
              <ListItemIcon>{theme === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}</ListItemIcon>
              Theme: {theme === 'dark' ? 'Light' : 'Dark'}
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleProfileClose(); handleNav('/logout'); }}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

          {/* Hamburger (mobile) */}
          <IconButton className="navbar-hamburger" color="inherit" onClick={handleToggleMobile} aria-label="menu">
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleToggleMobile}
        PaperProps={{ className: 'navbar-drawer' }}
      >
        <Box className="navbar-drawer-content" role="menu">
          <Box component="form" onSubmit={onSearchSubmit} className="navbar-drawer-search">
            <InputBase
              className="navbar-drawer-search-input"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <IconButton type="submit" className="navbar-drawer-search-btn" aria-label="search">
              <SearchIcon />
            </IconButton>
          </Box>

          <Divider className="navbar-drawer-divider" />

          <List>
            {links.map(link => (
              <ListItemButton key={link.path} onClick={() => handleNav(link.path)}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>

          <Divider className="navbar-drawer-divider" />

          <List>
            <ListItemButton onClick={handleThemeToggle}>
              <ListItemIcon>
                {theme === 'dark' ? <LightMode /> : <DarkMode />}
              </ListItemIcon>
              <ListItemText primary={`Theme: ${theme === 'dark' ? 'Light' : 'Dark'}`} />
            </ListItemButton>
            <ListItemButton onClick={() => handleNav('/settings')}>
              <ListItemIcon><Settings /></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
            <ListItemButton onClick={() => handleNav('/logout')}>
              <ListItemIcon><Logout /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;

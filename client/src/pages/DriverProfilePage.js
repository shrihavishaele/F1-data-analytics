import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import './ProfilePage.css';

const DriverProfilePage = () => {
  const { driver_id } = useParams();
  const [driverData, setDriverData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/driver_profile/${driver_id}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setDriverData({ bio: data.bio, stats: data.stats });
        if (data.chart_json) {
          try {
            const parsed = JSON.parse(data.chart_json);
            setChartData(parsed);
          } catch (e) {
            console.error('Failed to parse chart_json', e);
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load driver profile');
      } finally {
        setLoading(false);
      }
    };

    if (driver_id) fetchData();
  }, [driver_id]);

  if (loading) return (
    <Box className="profile-loading">
      <CircularProgress sx={{ color: '#e10600' }} />
    </Box>
  );
  
  if (error) return (
    <Box className="profile-error">
      <Typography variant="h6">Error: {error}</Typography>
    </Box>
  );
  
  if (!driverData) return null;

  const { bio, stats } = driverData;
  const title = bio ? `${bio.forename} ${bio.surname}` : 'Driver';

  return (
    <Box className="profile-container">
      <Typography variant="h3" className="profile-title">
        {title}
      </Typography>
      
      {bio && (
        <Card className="profile-bio-card">
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography className="profile-bio-label">Date of Birth</Typography>
                <Typography className="profile-bio-value">{bio.dob}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography className="profile-bio-label">Nationality</Typography>
                <Typography className="profile-bio-value">{bio.nationality}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {stats && (
        <Grid container spacing={2} className="profile-stats-grid">
          <Grid item xs={6} sm={4} md={2.4}>
            <Card className="profile-stat-card">
              <CardContent className="profile-stat-content">
                <Typography className="profile-stat-label">Total Races</Typography>
                <Typography className="profile-stat-value">{stats.total_races}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card className="profile-stat-card">
              <CardContent className="profile-stat-content">
                <Typography className="profile-stat-label">Wins</Typography>
                <Typography className="profile-stat-value profile-stat-wins">{stats.total_wins}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card className="profile-stat-card">
              <CardContent className="profile-stat-content">
                <Typography className="profile-stat-label">Podiums</Typography>
                <Typography className="profile-stat-value profile-stat-podiums">{stats.total_podiums}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card className="profile-stat-card">
              <CardContent className="profile-stat-content">
                <Typography className="profile-stat-label">Poles</Typography>
                <Typography className="profile-stat-value profile-stat-poles">{stats.total_poles}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card className="profile-stat-card">
              <CardContent className="profile-stat-content">
                <Typography className="profile-stat-label">DNFs</Typography>
                <Typography className="profile-stat-value profile-stat-dnfs">{stats.total_dnfs}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {chartData && chartData.data && chartData.layout && (
        <Card className="profile-chart-card">
          <CardContent>
            <Plot 
              data={chartData.data} 
              layout={{ 
                ...chartData.layout, 
                autosize: true,
                margin: { l: 40, r: 20, t: 40, b: 40 }
              }} 
              style={{ width: '100%', height: '100%' }} 
              useResizeHandler 
              config={{ responsive: true }}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DriverProfilePage;

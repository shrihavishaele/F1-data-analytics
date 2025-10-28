import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import './ProfilePage.css';

const ConstructorProfilePage = () => {
  const { constructor_id } = useParams();
  const [teamData, setTeamData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/constructor_profile/${constructor_id}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setTeamData({ bio: data.bio, stats: data.stats });
        if (data.pit_stop_chart_json) {
          try {
            const parsed = JSON.parse(data.pit_stop_chart_json);
            setChartData(parsed);
          } catch (e) {
            console.error('Failed to parse pit_stop_chart_json', e);
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load constructor profile');
      } finally {
        setLoading(false);
      }
    };

    if (constructor_id) fetchData();
  }, [constructor_id]);

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
  
  if (!teamData) return null;

  const { bio, stats } = teamData;
  const title = bio ? bio.name : 'Team';

  return (
    <Box className="profile-container">
      <Typography variant="h3" className="profile-title">
        {title}
      </Typography>
      
      {bio && (
        <Card className="profile-bio-card">
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography className="profile-bio-label">Nationality</Typography>
                <Typography className="profile-bio-value">{bio.nationality}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {stats && (
        <Grid container spacing={2} className="profile-stats-grid">
          <Grid item xs={6} sm={6}>
            <Card className="profile-stat-card">
              <CardContent className="profile-stat-content">
                <Typography className="profile-stat-label">Total Wins</Typography>
                <Typography className="profile-stat-value profile-stat-wins">{stats.total_wins}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6}>
            <Card className="profile-stat-card">
              <CardContent className="profile-stat-content">
                <Typography className="profile-stat-label">Total Podiums</Typography>
                <Typography className="profile-stat-value profile-stat-podiums">{stats.total_podiums}</Typography>
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

export default ConstructorProfilePage;

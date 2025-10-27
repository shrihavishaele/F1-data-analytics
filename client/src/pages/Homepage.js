import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import Plot from 'react-plotly.js';
import './Homepage.css';

const Homepage = () => {
  const [kpiData, setKpiData] = useState(null);
  const [championshipChart, setChampionshipChart] = useState(null);
  const [constructorChart, setConstructorChart] = useState(null);
  const [recentRaces, setRecentRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all data from Flask backend
    const fetchData = async () => {
      try {
        const [kpi, championship, constructor, races] = await Promise.all([
          fetch('/api/kpi').then(res => res.json()),
          fetch('/api/championship-points').then(res => res.json()),
          fetch('/api/constructor-wins').then(res => res.json()),
          fetch('/api/recent-races').then(res => res.json())
        ]);

        setKpiData(kpi);
        setChampionshipChart(championship);
        setConstructorChart(constructor);
        setRecentRaces(races);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box className="homepage-loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="homepage-container">
      {/* Row 1: KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="kpi-card kpi-card-red">
            <CardContent>
              <Typography variant="h6" className="kpi-title">
                Total Races
              </Typography>
              <Typography variant="h3" className="kpi-value-red">
                {kpiData?.total_races || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="kpi-card kpi-card-cyan">
            <CardContent>
              <Typography variant="h6" className="kpi-title">
                Total Drivers
              </Typography>
              <Typography variant="h3" className="kpi-value-cyan">
                {kpiData?.total_drivers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="kpi-card kpi-card-orange">
            <CardContent>
              <Typography variant="h6" className="kpi-title">
                Total Constructors
              </Typography>
              <Typography variant="h3" className="kpi-value-orange">
                {kpiData?.total_constructors || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="kpi-card kpi-card-teal">
            <CardContent>
              <Typography variant="h6" className="kpi-title">
                Most Wins (Driver)
              </Typography>
              <Typography variant="h4" className="kpi-value-teal">
                {kpiData?.most_wins_driver || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Charts */}
      <Grid container spacing={3} className="charts-grid">
        <Grid item xs={12} md={8}>
          <Card className="chart-card">
            <CardContent>
              <Typography variant="h5" className="chart-title">
                Championship Points Battle (2010-2020)
              </Typography>
              {championshipChart && (
                <Plot
                  data={championshipChart.data}
                  layout={{
                    ...championshipChart.layout,
                    autosize: true,
                    margin: { l: 50, r: 50, t: 50, b: 50 }
                  }}
                  config={{ responsive: true }}
                  className="chart-container"
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="chart-card">
            <CardContent>
              <Typography variant="h5" className="chart-title">
                Top 5 Constructors (Wins)
              </Typography>
              {constructorChart && (
                <Plot
                  data={constructorChart.data}
                  layout={{
                    ...constructorChart.layout,
                    autosize: true,
                    height: 400,
                    margin: { l: 20, r: 20, t: 20, b: 20 }
                  }}
                  config={{ responsive: true }}
                  className="chart-container"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3: Recent Races Table */}
      <Grid container className="table-grid">
        <Grid item xs={12}>
          <Card className="table-card">
            <CardContent>
              <Typography variant="h5" className="chart-title">
                Recent Race Results
              </Typography>
              <TableContainer component={Paper} className="table-container">
                <Table>
                  <TableHead>
                    <TableRow className="table-header-row">
                      <TableCell className="table-header-cell">Year</TableCell>
                      <TableCell className="table-header-cell">Race Name</TableCell>
                      <TableCell className="table-header-cell">Winner (Driver)</TableCell>
                      <TableCell className="table-header-cell">Constructor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentRaces.map((race, index) => (
                      <TableRow
                        key={index}
                        className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
                      >
                        <TableCell className="table-cell">{race.year}</TableCell>
                        <TableCell className="table-cell">{race.race_name}</TableCell>
                        <TableCell className="table-cell-winner">{race.winner}</TableCell>
                        <TableCell className="table-cell-constructor">{race.constructor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Homepage;

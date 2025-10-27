import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useParams } from 'react-router-dom';

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

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: 'salmon' }}>Error: {error}</div>;
  if (!driverData) return null;

  const { bio, stats } = driverData;
  const title = bio ? `${bio.forename} ${bio.surname}` : 'Driver';

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      {bio && (
        <div style={{ marginBottom: 16, opacity: 0.9 }}>
          <div>DOB: {bio.dob}</div>
          <div>Nationality: {bio.nationality}</div>
        </div>
      )}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div className="kpi-card">Total Races: {stats.total_races}</div>
          <div className="kpi-card">Wins: {stats.total_wins}</div>
          <div className="kpi-card">Podiums: {stats.total_podiums}</div>
          <div className="kpi-card">Poles: {stats.total_poles}</div>
          <div className="kpi-card">DNFs: {stats.total_dnfs}</div>
        </div>
      )}

      {chartData && chartData.data && chartData.layout && (
        <Plot data={chartData.data} layout={{ ...chartData.layout, autosize: true }} style={{ width: '100%', height: '100%' }} useResizeHandler />
      )}
    </div>
  );
};

export default DriverProfilePage;

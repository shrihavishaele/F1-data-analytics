import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useParams } from 'react-router-dom';

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

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: 'salmon' }}>Error: {error}</div>;
  if (!teamData) return null;

  const { bio, stats } = teamData;
  const title = bio ? bio.name : 'Team';

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      {bio && (
        <div style={{ marginBottom: 16, opacity: 0.9 }}>
          <div>Nationality: {bio.nationality}</div>
        </div>
      )}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div className="kpi-card">Wins: {stats.total_wins}</div>
          <div className="kpi-card">Podiums: {stats.total_podiums}</div>
        </div>
      )}

      {chartData && chartData.data && chartData.layout && (
        <Plot data={chartData.data} layout={{ ...chartData.layout, autosize: true }} style={{ width: '100%', height: '100%' }} useResizeHandler />
      )}
    </div>
  );
};

export default ConstructorProfilePage;

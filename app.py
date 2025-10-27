from flask import Flask, send_from_directory, jsonify, g
from flask_cors import CORS
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import os

app = Flask(__name__, static_folder="client/build", static_url_path="")
CORS(app)

# Load data
# Make the data directory absolute so CSVs are found regardless of cwd
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

def _normalize_data_frames():
    """Ensure consistent numeric dtypes used by endpoints"""
    # results
    if hasattr(g, "results_df"):
        for col in ["position", "grid", "statusId", "driverId", "constructorId", "raceId"]:
            if col in g.results_df:
                g.results_df[col] = pd.to_numeric(g.results_df[col], errors="coerce")
    # driver standings
    if hasattr(g, "driver_standings_df"):
        for col in ["position", "points", "driverId", "raceId"]:
            if col in g.driver_standings_df:
                g.driver_standings_df[col] = pd.to_numeric(g.driver_standings_df[col], errors="coerce")
    # races
    if hasattr(g, "races_df"):
        for col in ["raceId", "year", "round"]:
            if col in g.races_df:
                g.races_df[col] = pd.to_numeric(g.races_df[col], errors="coerce")
    # drivers / constructors ids
    if hasattr(g, "drivers_df") and "driverId" in g.drivers_df:
        g.drivers_df["driverId"] = pd.to_numeric(g.drivers_df["driverId"], errors="coerce")
    if hasattr(g, "constructors_df") and "constructorId" in g.constructors_df:
        g.constructors_df["constructorId"] = pd.to_numeric(g.constructors_df["constructorId"], errors="coerce")
    # pit stops
    if hasattr(g, "pit_stops_df"):
        for col in ["raceId", "driverId", "milliseconds"]:
            if col in g.pit_stops_df:
                g.pit_stops_df[col] = pd.to_numeric(g.pit_stops_df[col], errors="coerce")

def get_data():
    """Load all CSV files into Flask g object (once per request context)"""
    if 'circuits_df' not in g:
        g.circuits_df = pd.read_csv(os.path.join(DATA_DIR, 'circuits.csv'))
        g.constructor_results_df = pd.read_csv(os.path.join(DATA_DIR, 'constructor_results.csv'))
        g.constructor_standings_df = pd.read_csv(os.path.join(DATA_DIR, 'constructor_standings.csv'))
        g.constructors_df = pd.read_csv(os.path.join(DATA_DIR, 'constructors.csv'))
        g.driver_standings_df = pd.read_csv(os.path.join(DATA_DIR, 'driver_standings.csv'))
        g.drivers_df = pd.read_csv(os.path.join(DATA_DIR, 'drivers.csv'))
        g.lap_times_df = pd.read_csv(os.path.join(DATA_DIR, 'lap_times.csv'))
        g.pit_stops_df = pd.read_csv(os.path.join(DATA_DIR, 'pit_stops.csv'))
        g.qualifying_df = pd.read_csv(os.path.join(DATA_DIR, 'qualifying.csv'))
        g.races_df = pd.read_csv(os.path.join(DATA_DIR, 'races.csv'))
        g.results_df = pd.read_csv(os.path.join(DATA_DIR, 'results.csv'))
        g.seasons_df = pd.read_csv(os.path.join(DATA_DIR, 'seasons.csv'))
        g.sprint_results_df = pd.read_csv(os.path.join(DATA_DIR, 'sprint_results.csv'))
        g.status_df = pd.read_csv(os.path.join(DATA_DIR, 'status.csv'))
        # Normalize dtypes used by endpoints to avoid string/NaN comparison bugs
        _normalize_data_frames()

@app.before_request
def before_request():
    """Load data before each request"""
    get_data()

@app.route("/api/health")
def health():
    """Quick health check to verify data availability and basic stats"""
    try:
        datasets = {
            'circuits': len(g.circuits_df),
            'constructor_results': len(g.constructor_results_df),
            'constructor_standings': len(g.constructor_standings_df),
            'constructors': len(g.constructors_df),
            'driver_standings': len(g.driver_standings_df),
            'drivers': len(g.drivers_df),
            'lap_times': len(g.lap_times_df),
            'pit_stops': len(g.pit_stops_df),
            'qualifying': len(g.qualifying_df),
            'races': len(g.races_df),
            'results': len(g.results_df),
            'seasons': len(g.seasons_df),
            'sprint_results': len(g.sprint_results_df),
            'status': len(g.status_df),
        }
        # Minimal sanity summary
        sample_years = sorted(g.races_df['year'].dropna().unique().tolist())[:3] if 'year' in g.races_df else []
        return jsonify({
            'ok': True,
            'data_dir': DATA_DIR,
            'datasets': datasets,
            'sample_years': sample_years
        })
    except Exception as e:
        app.logger.exception("Health endpoint failed")
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route("/api/kpi")
def get_kpi():
    """Get KPI statistics for the dashboard"""
    try:
        # Total races
        total_races = len(g.races_df)
        # Total drivers
        total_drivers = len(g.drivers_df)
        # Total constructors
        total_constructors = len(g.constructors_df)

        # Most wins (Driver) with dtype-safe filter
        wins_df = g.results_df[g.results_df['position'] == 1]
        if wins_df.empty:
            top_driver_name = "N/A"
        else:
            wins_by_driver = wins_df.groupby('driverId').size()
            top_driver_id = wins_by_driver.idxmax()
            top_driver_wins = int(wins_by_driver.max())
            top_driver_row = g.drivers_df[g.drivers_df['driverId'] == top_driver_id]
            if top_driver_row.empty:
                top_driver_name = "N/A"
            else:
                top_driver = top_driver_row.iloc[0]
                top_driver_name = f"{str(top_driver['forename'])[0]}. {top_driver['surname']} ({top_driver_wins})"

        return jsonify({
            'total_races': total_races,
            'total_drivers': total_drivers,
            'total_constructors': total_constructors,
            'most_wins_driver': top_driver_name
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/championship-points")
def get_championship_points():
    """Get championship points over years for top drivers"""
    try:
        # Merge data
        standings = g.driver_standings_df.merge(g.races_df[['raceId', 'year', *(['round'] if 'round' in g.races_df.columns else [])]], on='raceId')
        standings = standings.merge(g.drivers_df[['driverId', 'forename', 'surname']], on='driverId')

        # Get final standings for each year (last round if available else last raceId)
        if 'round' in standings.columns:
            idx = standings.groupby(['year', 'driverId'])['round'].idxmax()
        else:
            idx = standings.groupby(['year', 'driverId'])['raceId'].idxmax()
        final_standings = standings.loc[idx]

        # Get top 3 drivers by total championship points
        driver_totals = final_standings.groupby('driverId')['points'].sum().sort_values(ascending=False).head(3)
        top_driver_ids = driver_totals.index.tolist()

        # Filter for years 2010-2020 (fallback to all years if empty)
        year_range = final_standings[(final_standings['year'] >= 2010) & (final_standings['year'] <= 2020)]
        if year_range.empty:
            year_range = final_standings

        # Create plotly figure
        fig = go.Figure()
        colors = ['#00D2BE', '#E10600', '#0600EF']
        for idx, driver_id in enumerate(top_driver_ids):
            driver_data = year_range[year_range['driverId'] == driver_id].sort_values('year')
            if not driver_data.empty:
                driver_name = f"{driver_data.iloc[0]['forename']} {driver_data.iloc[0]['surname']}"
                fig.add_trace(go.Scatter(
                    x=driver_data['year'],
                    y=driver_data['points'],
                    mode='lines+markers',
                    name=driver_name,
                    line=dict(color=colors[idx % len(colors)], width=2),
                    marker=dict(size=6)
                ))

        fig.update_layout(
            title='Championship Points Battle (2010-2020)',
            xaxis_title='Year',
            yaxis_title='Points',
            template='plotly_dark',
            hovermode='x unified',
            paper_bgcolor='#1e1e1e',
            plot_bgcolor='#1e1e1e',
            font=dict(color='white')
        )

        return jsonify(fig.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/constructor-wins")
def get_constructor_wins():
    """Get top 5 constructors by total wins"""
    try:
        # Get all race wins (dtype-safe)
        wins = g.results_df[g.results_df['position'] == 1]
        if wins.empty:
            return jsonify(go.Figure().to_dict())

        # Count wins by constructor
        constructor_wins = wins.groupby('constructorId').size().sort_values(ascending=False).head(5)

        # Get constructor names
        constructor_data = []
        colors_map = {
            'Ferrari': '#DC0000',
            'McLaren': '#FF8700',
            'Mercedes': '#00D2BE',
            'Williams': '#005AFF',
            'Red Bull': '#0600EF',
            'Renault': '#FFF500',
            'Lotus': '#FFB800'
        }

        for constructor_id, wins_count in constructor_wins.items():
            row = g.constructors_df[g.constructors_df['constructorId'] == constructor_id]
            if row.empty:
                continue
            constructor = row.iloc[0]
            constructor_data.append({
                'name': constructor['name'],
                'wins': int(wins_count)
            })

        # Create plotly doughnut chart
        fig = go.Figure(data=[go.Pie(
            labels=[c['name'] for c in constructor_data],
            values=[c['wins'] for c in constructor_data],
            hole=0.4,
            marker=dict(colors=[colors_map.get(c['name'], '#888888') for c in constructor_data]),
            textinfo='label+value',
            textfont=dict(color='white')
        )])

        fig.update_layout(
            title='Top 5 Constructors (Wins)',
            template='plotly_dark',
            paper_bgcolor='#1e1e1e',
            plot_bgcolor='#1e1e1e',
            font=dict(color='white'),
            showlegend=True,
            legend=dict(orientation="v", yanchor="middle", y=0.5, xanchor="left", x=1.05)
        )

        return jsonify(fig.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/recent-races")
def get_recent_races():
    """Get recent race results"""
    try:
        # Get last 5 races by year/round if available, else by raceId
        races = g.races_df.copy()
        if 'round' in races.columns:
            races = races.sort_values(['year', 'round', 'raceId'])
        else:
            races = races.sort_values('raceId')
        recent_race_ids = races.tail(5)['raceId'].dropna().astype(int).tolist()

        # Get winners for these races
        race_results = []
        for race_id in recent_race_ids:
            race_row = g.races_df[g.races_df['raceId'] == race_id]
            if race_row.empty:
                continue
            race = race_row.iloc[0]
            winner = g.results_df[(g.results_df['raceId'] == race_id) & (g.results_df['position'] == 1)]
            if winner.empty:
                continue

            winner = winner.iloc[0]
            driver_row = g.drivers_df[g.drivers_df['driverId'] == winner['driverId']]
            constructor_row = g.constructors_df[g.constructors_df['constructorId'] == winner['constructorId']]
            if driver_row.empty or constructor_row.empty:
                continue

            driver = driver_row.iloc[0]
            constructor = constructor_row.iloc[0]

            race_results.append({
                'year': int(race['year']) if pd.notna(race['year']) else None,
                'race_name': race['name'],
                'winner': f"{driver['forename']} {driver['surname']}",
                'constructor': constructor['name']
            })

        return jsonify(race_results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Task 2: Filter Population Endpoints

@app.route("/api/drivers_list")
def get_drivers_list():
    """Get list of all drivers for filter dropdown (id + name)"""
    try:
        drivers = g.drivers_df[['driverId', 'forename', 'surname']].copy()
        drivers['name'] = drivers['forename'] + ' ' + drivers['surname']
        drivers_list = drivers[['driverId', 'name']].rename(columns={'driverId': 'id'}).to_dict('records')
        return jsonify(drivers_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/constructors_list")
def get_constructors_list():
    """Get list of all constructors for filter dropdown (id + name)"""
    try:
        constructors_list = g.constructors_df[['constructorId', 'name']].rename(columns={'constructorId': 'id'}).to_dict('records')
        return jsonify(constructors_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/seasons_list")
def get_seasons_list():
    """Get list of all seasons for filter dropdown (id + name)"""
    try:
        seasons = g.seasons_df[['year']].sort_values('year', ascending=False).copy()
        seasons['id'] = seasons['year']
        seasons['name'] = seasons['year'].astype(str)
        seasons_list = seasons[['id', 'name']].to_dict('records')
        return jsonify(seasons_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Task 3: Driver Profile Endpoint

@app.route("/api/driver_profile/<int:driver_id>")
def get_driver_profile(driver_id):
    """Get driver profile with bio, stats, and Plotly chart JSON for championship position by year"""
    try:
        # Get Bio
        driver = g.drivers_df[g.drivers_df['driverId'] == driver_id]
        if driver.empty:
            return jsonify({'error': 'Driver not found'}), 404

        driver = driver.iloc[0]
        bio = {
            'forename': driver['forename'],
            'surname': driver['surname'],
            'dob': driver['dob'],
            'nationality': driver['nationality']
        }

        # Filter Results for this driver
        driver_results = g.results_df[g.results_df['driverId'] == driver_id]

        # Calculate Career Stats
        total_races = len(driver_results)
        total_wins = len(driver_results[driver_results['position'] == 1])
        total_podiums = len(driver_results[driver_results['position'].isin([1, 2, 3])])
        total_poles = len(driver_results[driver_results['grid'] == 1])
        total_dnfs = len(driver_results[driver_results['statusId'] != 1])

        stats = {
            'total_races': int(total_races),
            'total_wins': int(total_wins),
            'total_podiums': int(total_podiums),
            'total_poles': int(total_poles),
            'total_dnfs': int(total_dnfs)
        }

        # Build championship position by year chart (final standing per year)
        ds = g.driver_standings_df[g.driver_standings_df['driverId'] == driver_id][['raceId', 'points', 'position']].copy()
        ds = ds.merge(g.races_df[['raceId', 'year', *(['round'] if 'round' in g.races_df.columns else [])]], on='raceId')
        # Use last race of each year as final standing
        final_per_year_idx = (ds.groupby('year')['round'].idxmax() if 'round' in ds.columns else ds.groupby('year')['raceId'].idxmax())
        final_per_year = ds.loc[final_per_year_idx].sort_values('year')

        # Some datasets store position as strings, ensure numeric for plotting
        final_per_year['position'] = pd.to_numeric(final_per_year['position'], errors='coerce')

        fig = px.line(final_per_year, x='year', y='position', title='Championship Position by Year')
        fig.update_yaxes(autorange="reversed")
        fig.update_layout(template="plotly_dark")
        chart_json = fig.to_json()

        return jsonify({
            'bio': bio,
            'stats': stats,
            'chart_json': chart_json
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Task 4: Constructor Profile Endpoint

@app.route("/api/constructor_profile/<int:constructor_id>")
def get_constructor_profile(constructor_id):
    """Get constructor profile with bio, stats, and Plotly chart JSON for avg pit stop by season"""
    try:
        # Get Bio
        constructor = g.constructors_df[g.constructors_df['constructorId'] == constructor_id]
        if constructor.empty:
            return jsonify({'error': 'Constructor not found'}), 404

        constructor = constructor.iloc[0]
        bio = {
            'name': constructor['name'],
            'nationality': constructor['nationality']
        }

        # Filter Results for this constructor
        constructor_results = g.results_df[g.results_df['constructorId'] == constructor_id]

        # Calculate Career Stats
        total_wins = len(constructor_results[constructor_results['position'] == 1])
        total_podiums = len(constructor_results[constructor_results['position'] <= 3])

        stats = {
            'total_wins': int(total_wins),
            'total_podiums': int(total_podiums)
        }

        # Pit Stop Analysis - Average pit stop time per season (to Plotly JSON)
        pit_stops_with_constructor = g.results_df[['raceId', 'driverId', 'constructorId']].merge(
            g.pit_stops_df[['raceId', 'driverId', 'milliseconds']],
            on=['raceId', 'driverId']
        )

        constructor_pit_stops = pit_stops_with_constructor[
            pit_stops_with_constructor['constructorId'] == constructor_id
        ]

        constructor_pit_stops = constructor_pit_stops.merge(
            g.races_df[['raceId', 'year']],
            on='raceId'
        )

        pit_stop_by_year = constructor_pit_stops.groupby('year')['milliseconds'].mean().reset_index()

        fig = px.bar(pit_stop_by_year, x='year', y='milliseconds', title='Avg. Pit Stop Duration by Season')
        fig.update_layout(template='plotly_dark', yaxis_title='Avg Duration (ms)')
        pit_stop_chart_json = fig.to_json()

        return jsonify({
            'bio': bio,
            'stats': stats,
            'pit_stop_chart_json': pit_stop_chart_json
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(debug=True)
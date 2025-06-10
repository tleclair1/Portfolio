from flask import Flask, render_template, jsonify
import requests
from datetime import datetime, timedelta
import json
import random

app = Flask(__name__)

# Mock data generator for demonstration
def generate_mock_matches():
    """Generate mock match data - replace this with actual scraping logic"""
    teams = ["Team Liquid", "Cloud9", "TSM", "G2 Esports", "Fnatic", "100 Thieves", "NRG", "Sentinels"]
    games = ["Valorant", "CS2", "League of Legends", "Rocket League"]
    
    matches = []
    for i in range(20):
        team1, team2 = random.sample(teams, 2)
        game = random.choice(games)
        
        # Generate scores based on game type
        if game in ["Valorant", "CS2"]:
            score1 = random.randint(0, 13)
            score2 = random.randint(0, 13)
            if score1 == score2:
                score1 += random.randint(1, 3)
        else:
            score1 = random.randint(0, 3)
            score2 = random.randint(0, 3)
        
        winner = team1 if score1 > score2 else team2
        
        match = {
            'id': i + 1,
            'date': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d'),
            'game': game,
            'team1': team1,
            'team2': team2,
            'score1': score1,
            'score2': score2,
            'winner': winner,
            'duration': f"{random.randint(20, 90)}:{random.randint(10, 59):02d}",
            'tournament': f"{game} Championship {random.choice(['Spring', 'Summer', 'Fall'])}"
        }
        matches.append(match)
    
    return sorted(matches, key=lambda x: x['date'], reverse=True)

def calculate_team_stats(matches):
    """Calculate team statistics from match data"""
    team_stats = {}
    
    for match in matches:
        for team in [match['team1'], match['team2']]:
            if team not in team_stats:
                team_stats[team] = {
                    'name': team,
                    'matches_played': 0,
                    'wins': 0,
                    'losses': 0,
                    'win_rate': 0,
                    'games': set()
                }
            
            team_stats[team]['matches_played'] += 1
            team_stats[team]['games'].add(match['game'])
            
            if match['winner'] == team:
                team_stats[team]['wins'] += 1
            else:
                team_stats[team]['losses'] += 1
    
    # Calculate win rates and convert sets to lists
    for team in team_stats:
        stats = team_stats[team]
        if stats['matches_played'] > 0:
            stats['win_rate'] = round((stats['wins'] / stats['matches_played']) * 100, 1)
        stats['games'] = list(stats['games'])
    
    return team_stats

# Sample scraping function (replace with actual implementation)
def scrape_match_data():
    """
    Replace this function with actual web scraping logic
    Example sites to scrape from:
    - Liquipedia API
    - HLTV for CS2
    - VLR.gg for Valorant
    - Or official game APIs
    """
    # For now, return mock data
    return generate_mock_matches()

# Routes
@app.route('/')
def index():
    matches = scrape_match_data()
    team_stats = calculate_team_stats(matches)
    recent_matches = matches[:10]  # Show 10 most recent matches
    
    return render_template('index.html', 
                         matches=recent_matches, 
                         team_stats=team_stats)

@app.route('/teams')
def teams():
    matches = scrape_match_data()
    team_stats = calculate_team_stats(matches)
    
    # Sort teams by win rate
    sorted_teams = sorted(team_stats.values(), 
                         key=lambda x: x['win_rate'], 
                         reverse=True)
    
    return render_template('teams.html', teams=sorted_teams)

@app.route('/matches')
def matches():
    all_matches = scrape_match_data()
    return render_template('matches.html', matches=all_matches)

@app.route('/api/matches')
def api_matches():
    matches = scrape_match_data()
    return jsonify(matches)

@app.route('/api/teams')
def api_teams():
    matches = scrape_match_data()
    team_stats = calculate_team_stats(matches)
    return jsonify(team_stats)

if __name__ == '__main__':
    app.run(debug=True)

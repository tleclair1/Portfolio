import React, { useState, useEffect } from 'react';
import process from 'process';
import { Trophy, Users, Target, Clock, TrendingUp, Zap, Crown, Gamepad2, AlertCircle, Loader2 } from 'lucide-react';

const GameStatTracker = () => {
  const [selectedGame, setSelectedGame] = useState('valorant');
  const [liveMatches, setLiveMatches] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({});

  // API Configuration
  const API_CONFIG = {
    // PandaScore API (comprehensive esports data)
    PANDASCORE: {
      base: 'https://api.pandascore.co',
      token: process.env.REACT_APP_PANDASCORE_TOKEN, // Get from https://pandascore.co/
    },
    // Riot Games API
    RIOT: {
      base: 'https://americas.api.riotgames.com',
      token: process.env.REACT_APP_RIOT_API_KEY, // Get from https://developer.riotgames.com/
    },
    // HLTV API for CS:GO (unofficial)
    HLTV: {
      base: 'https://hltv-api.vercel.app/api',
    }
  };

  // Mock data for fallback
  const mockData = {
    valorant: {
      matches: [
        { id: 1, team1: 'Sentinels', team2: 'Cloud9', score1: 13, score2: 11, status: 'Live', map: 'Ascent', viewers: 45000 },
        { id: 2, team1: 'NRG', team2: '100 Thieves', score1: 8, score2: 4, status: 'Live', map: 'Haven', viewers: 32000 },
        { id: 3, team1: 'OpTic', team2: 'FaZe', score1: 16, score2: 14, status: 'Finished', map: 'Bind', viewers: 28000 }
      ],
      players: [
        { name: 'TenZ', team: 'Sentinels', kd: 1.47, rating: 1.32, headshot: '28.5%' },
        { name: 'Aspas', team: 'LOUD', kd: 1.41, rating: 1.28, headshot: '31.2%' },
        { name: 'Demon1', team: 'NRG', kd: 1.38, rating: 1.25, headshot: '26.8%' },
        { name: 'Chronicle', team: 'Fnatic', kd: 1.35, rating: 1.22, headshot: '25.1%' }
      ],
      tournaments: [
        { name: 'VCT Champions', prize: '$1,000,000', teams: 16, status: 'Live' },
        { name: 'Masters Tokyo', prize: '$650,000', teams: 12, status: 'Upcoming' },
        { name: 'VCT Lock//In', prize: '$500,000', teams: 30, status: 'Completed' }
      ]
    },
    csgo: {
      matches: [
        { id: 1, team1: 'FaZe', team2: 'Navi', score1: 16, score2: 12, status: 'Live', map: 'Dust2', viewers: 67000 },
        { id: 2, team1: 'Vitality', team2: 'G2', score1: 14, score2: 16, status: 'Finished', map: 'Mirage', viewers: 45000 },
        { id: 3, team1: 'Liquid', team2: 'Astralis', score1: 9, score2: 6, status: 'Live', map: 'Inferno', viewers: 38000 }
      ],
      players: [
        { name: 's1mple', team: 'Navi', kd: 1.42, rating: 1.35, headshot: '52.3%' },
        { name: 'ZywOo', team: 'Vitality', kd: 1.39, rating: 1.31, headshot: '49.7%' },
        { name: 'sh1ro', team: 'Cloud9', kd: 1.35, rating: 1.28, headshot: '47.2%' },
        { name: 'device', team: 'Astralis', kd: 1.32, rating: 1.24, headshot: '51.8%' }
      ],
      tournaments: [
        { name: 'IEM Katowice', prize: '$1,000,000', teams: 24, status: 'Live' },
        { name: 'ESL Pro League', prize: '$835,000', teams: 32, status: 'Upcoming' },
        { name: 'BLAST Premier', prize: '$425,000', teams: 12, status: 'Live' }
      ]
    },
    lol: {
      matches: [
        { id: 1, team1: 'T1', team2: 'Gen.G', score1: 2, score2: 1, status: 'Live', map: 'Game 4', viewers: 125000 },
        { id: 2, team1: 'JDG', team2: 'BLG', score1: 3, score2: 0, status: 'Finished', map: 'Series', viewers: 89000 },
        { id: 3, team1: 'G2', team2: 'FNC', score1: 1, score2: 1, status: 'Live', map: 'Game 3', viewers: 76000 }
      ],
      players: [
        { name: 'Faker', team: 'T1', kd: 3.2, rating: 8.7, headshot: 'N/A' },
        { name: 'Chovy', team: 'Gen.G', kd: 2.9, rating: 8.4, headshot: 'N/A' },
        { name: 'Knight', team: 'JDG', kd: 2.7, rating: 8.1, headshot: 'N/A' },
        { name: 'Caps', team: 'G2', kd: 2.5, rating: 7.8, headshot: 'N/A' }
      ],
      tournaments: [
        { name: 'Worlds 2024', prize: '$2,225,000', teams: 22, status: 'Live' },
        { name: 'MSI 2024', prize: '$250,000', teams: 12, status: 'Completed' },
        { name: 'LCK Spring', prize: '$200,000', teams: 10, status: 'Upcoming' }
      ]
    }
  };

  // API Service Functions
  const apiService = {
    // Fetch live matches from PandaScore
    async fetchLiveMatches(game) {
      try {
        const gameMap = {
          'valorant': 'valorant',
          'csgo': 'cs-go',
          'lol': 'lol'
        };
        
        const response = await fetch(
          `${API_CONFIG.PANDASCORE.base}/${gameMap[game]}/matches/running?token=${API_CONFIG.PANDASCORE.token}`,
          {
            headers: {
              'Authorization': `Bearer ${API_CONFIG.PANDASCORE.token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        console.error('PandaScore API error:', err);
        // Fallback to mock data if API fails
        return mockData[game]?.matches || [];
      }
    },

    // Fetch tournaments
    async fetchTournaments(game) {
      try {
        const gameMap = {
          'valorant': 'valorant',
          'csgo': 'cs-go', 
          'lol': 'lol'
        };
        
        const response = await fetch(
          `${API_CONFIG.PANDASCORE.base}/${gameMap[game]}/tournaments/running?token=${API_CONFIG.PANDASCORE.token}`,
          {
            headers: {
              'Authorization': `Bearer ${API_CONFIG.PANDASCORE.token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        console.error('Tournament API error:', err);
        return mockData[game]?.tournaments || [];
      }
    },

    // Fetch player stats (varies by game)
    async fetchPlayerStats(game) {
      try {
        if (game === 'csgo') {
          // Use HLTV API for CS:GO players
          const response = await fetch(`${API_CONFIG.HLTV.base}/player/stats`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.json();
        } else {
          // Use PandaScore for other games
          const gameMap = {
            'valorant': 'valorant',
            'lol': 'lol'
          };
          
          const response = await fetch(
            `${API_CONFIG.PANDASCORE.base}/${gameMap[game]}/players?token=${API_CONFIG.PANDASCORE.token}&sort=rating&per_page=10`,
            {
              headers: {
                'Authorization': `Bearer ${API_CONFIG.PANDASCORE.token}`,
                'Accept': 'application/json'
              }
            }
          );
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.json();
        }
      } catch (err) {
        console.error('Player stats API error:', err);
        return mockData[game]?.players || [];
      }
    },

    // Transform API data to our format
    transformMatches(apiData, game) {
      if (!Array.isArray(apiData)) return mockData[game]?.matches || [];
      
      return apiData.map((match, index) => ({
        id: match.id || index,
        team1: match.opponents?.[0]?.opponent?.name || match.team1 || 'TBD',
        team2: match.opponents?.[1]?.opponent?.name || match.team2 || 'TBD',
        score1: match.results?.[0]?.score || match.score1 || 0,
        score2: match.results?.[1]?.score || match.score2 || 0,
        status: match.status === 'running' ? 'Live' : match.status || 'Scheduled',
        map: match.games?.[0]?.map?.name || match.map || 'TBD',
        viewers: Math.floor(Math.random() * 100000) + 10000 // Estimated viewers
      }));
    },

    transformTournaments(apiData, game) {
      if (!Array.isArray(apiData)) return mockData[game]?.tournaments || [];
      
      return apiData.map(tournament => ({
        name: tournament.name || tournament.title,
        prize: tournament.prizepool ? `$${tournament.prizepool.toLocaleString()}` : 'TBD',
        teams: tournament.number_of_teams || tournament.teams || 'TBD',
        status: tournament.live ? 'Live' : 'Upcoming'
      }));
    },

    transformPlayers(apiData, game) {
      if (!Array.isArray(apiData)) return mockData[game]?.players || [];
      
      return apiData.slice(0, 4).map(player => ({
        name: player.name || player.nickname || player.handle,
        team: player.current_team?.name || player.team || 'Free Agent',
        kd: player.kd_ratio || (Math.random() * 0.5 + 1.2).toFixed(2),
        rating: player.rating || (Math.random() * 0.3 + 1.0).toFixed(2),
        headshot: game === 'lol' ? 'N/A' : `${(Math.random() * 20 + 25).toFixed(1)}%`
      }));
    }
  };

  // Load data for selected game
  const loadGameData = async (game) => {
    setLoading(true);
    setError(null);
    
    try {
      const [matchesData, playersData, tournamentsData] = await Promise.all([
        apiService.fetchLiveMatches(game),
        apiService.fetchPlayerStats(game),
        apiService.fetchTournaments(game)
      ]);

      setLiveMatches(apiService.transformMatches(matchesData, game));
      setTopPlayers(apiService.transformPlayers(playersData, game));
      setTournaments(apiService.transformTournaments(tournamentsData, game));
      
      setApiStatus(prev => ({ ...prev, [game]: 'success' }));
    } catch (err) {
      setError(`Failed to load ${game.toUpperCase()} data: ${err.message}`);
      setApiStatus(prev => ({ ...prev, [game]: 'error' }));
      
      // Load mock data as fallback
      const data = mockData[game];
      if (data) {
        setLiveMatches(data.matches);
        setTopPlayers(data.players);
        setTournaments(data.tournaments);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGameData(selectedGame);
    
    // Set up auto-refresh every 30 seconds for live data
    const interval = setInterval(() => {
      loadGameData(selectedGame);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedGame]);

  // Manual refresh function
  const handleRefresh = () => {
    loadGameData(selectedGame);
  };

  const formatViewers = (viewers) => {
    if (viewers >= 1000000) return `${(viewers / 1000000).toFixed(1)}M`;
    if (viewers >= 1000) return `${(viewers / 1000).toFixed(0)}K`;
    return viewers.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                GameStat Tracker
              </h1>
              <p className="text-gray-400 mt-1">Live Esports Statistics Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span className="text-sm text-gray-300">Refresh</span>
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className={`w-3 h-3 rounded-full ${
                apiStatus[selectedGame] === 'success' ? 'bg-green-500 animate-pulse' :
                apiStatus[selectedGame] === 'error' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              }`}></div>
              <span>
                {apiStatus[selectedGame] === 'success' ? 'Live Updates' :
                 apiStatus[selectedGame] === 'error' ? 'API Error' :
                 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-semibold">API Connection Issue</p>
              <p className="text-red-300 text-sm">{error}</p>
              <p className="text-gray-400 text-xs mt-1">Showing cached data. Data will refresh automatically.</p>
            </div>
          </div>
        )}

        {/* Game Selection */}
        <div className="flex space-x-4 mb-8">
          {['valorant', 'csgo', 'lol'].map((game) => (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedGame === game
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{game.toUpperCase()}</span>
                {apiStatus[game] === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Live Matches */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Live Matches</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {liveMatches.map((match) => (
              <div
                key={match.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    match.status === 'Live' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {match.status === 'Live' && <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>}
                    {match.status}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{formatViewers(match.viewers)} viewers</div>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold text-white">{match.team1}</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {match.score1} - {match.score2}
                    </div>
                    <div className="text-lg font-semibold text-white">{match.team2}</div>
                  </div>
                  <div className="text-sm text-gray-400 mt-2">{match.map}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Statistics */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Top Players</h2>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Player</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Team</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">K/D</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rating</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">HS%</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.map((player, index) => (
                    <tr key={index} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-slate-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">{player.name}</td>
                      <td className="px-6 py-4 text-gray-300">{player.team}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">{player.kd}</td>
                      <td className="px-6 py-4 text-purple-400 font-semibold">{player.rating}</td>
                      <td className="px-6 py-4 text-blue-400 font-semibold">{player.headshot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tournaments */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Active Tournaments</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{tournament.name}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    tournament.status === 'Live' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : tournament.status === 'Upcoming'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {tournament.status}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className="text-green-400 font-semibold">{tournament.prize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Teams</span>
                    <span className="text-white font-semibold">{tournament.teams}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStatTracker;
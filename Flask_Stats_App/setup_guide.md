# Simple Esports Stats Site Setup Guide

## Project Structure
```
esports-stats/
├── app.py                 # Main Flask application
├── scraper.py            # Web scraping utilities
├── requirements.txt      # Python dependencies
├── config.py            # Configuration file
├── templates/           # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── matches.html
│   └── teams.html
└── static/             # CSS, JS, images (optional)
```

## Installation Steps

### 1. Create Virtual Environment
```bash
# Create project directory
mkdir esports-stats
cd esports-stats

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Create Template Directory
```bash
mkdir templates
```
Then create the HTML template files (base.html, index.html, matches.html, teams.html) in the templates directory.

### 4. Run the Application
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Configuration Options

Create a `config.py` file for customization:

```python
# config.py
import os

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    DEBUG = True
    
    # Scraping settings
    SCRAPE_INTERVAL = 300  # 5 minutes
    MAX_MATCHES = 100
    
    # Supported games
    SUPPORTED_GAMES = [
        'Valorant',
        'CS2',
        'League of Legends',
        'Dota 2',
        'Rocket League',
        'Overwatch 2'
    ]
    
    # API endpoints (if using APIs instead of scraping)
    API_ENDPOINTS = {
        'valorant': 'https://api.example.com/valorant/matches',
        'cs2': 'https://api.example.com/cs2/matches',
    }
    
    # Rate limiting
    REQUESTS_PER_MINUTE = 30
    REQUEST_DELAY = 2  # seconds between requests
```

## Adding Real Data Sources

### Option 1: Using Official APIs

Many esports organizations provide APIs:

1. **Riot Games API** (League of Legends, Valorant)
   - Register at: https://developer.riotgames.com/
   - Get API key and implement in scraper.py

2. **Steam Web API** (CS2/Dota 2)
   - Get API key from: https://steamcommunity.com/dev/apikey
   - Use for match data

3. **Liquipedia API**
   - Documentation: https://liquipedia.net/api-help
   - Good for tournament data

### Option 2: Web Scraping

**Important Legal Notes:**
- Always check the website's `robots.txt` and terms of service
- Implement proper rate limiting
- Consider using official APIs when available
- Some sites actively prevent scraping

**Popular Esports Data Sites:**
- HLTV.org (CS2)
- VLR.gg (Valorant)
- Liquipedia.net (Multiple games)
- Gosugamers.net
- Esports Charts

### Example API Integration

```python
# In app.py, replace scrape_match_data() with:

def fetch_api_data():
    """Fetch data from official APIs"""
    matches = []
    
    # Example: Riot Games API
    if 'RIOT_API_KEY' in os.environ:
        riot_matches = fetch_riot_matches()
        matches.extend(riot_matches)
    
    # Example: Steam API
    if 'STEAM_API_KEY' in os.environ:
        steam_matches = fetch_steam_matches()
        matches.extend(steam_matches)
    
    return matches
```

## Deployment Options

### Option 1: Heroku
```bash
# Create Procfile
echo "web: python app.py" > Procfile

# Deploy
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
git push heroku main
```

### Option 2: Railway
```bash
# Install Railway CLI
pip install railway

# Deploy
railway login
railway init
railway up
```

### Option 3: PythonAnywhere
1. Upload files to PythonAnywhere
2. Set up web app with Flask
3. Configure WSGI file

## Features to Add

### Phase 1 (Basic)
- [x] Match display
- [x] Team statistics
- [x] Responsive design
- [ ] Search/filter matches
- [ ] Team detail pages

### Phase 2 (Advanced)
- [ ] Real-time data updates
- [ ] Player statistics
- [ ] Match predictions
- [ ] Data visualization charts
- [ ] User favorites/bookmarks

### Phase 3 (Professional)
- [ ] User authentication
- [ ] Admin panel
- [ ] API for mobile app
- [ ] Caching layer (Redis)
- [ ] Database integration (PostgreSQL)

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

2. **Template Not Found**
   - Ensure templates are in `templates/` directory
   - Check file names match exactly

3. **Scraping Blocked**
   - Implement longer delays between requests
   - Use rotating user agents
   - Consider using proxies
   - Switch to official APIs

4. **Rate Limiting**
   ```python
   import time
   time.sleep(2)  # Add delays between requests
   ```

5. **CORS Issues** (if adding API endpoints)
   ```python
   from flask_cors import CORS
   CORS(app)
   ```

## Advanced Features Implementation

### Adding Database Support

1. **Install SQLAlchemy**
   ```bash
   pip install flask-sqlalchemy
   ```

2. **Create Models**
   ```python
   from flask_sqlalchemy import SQLAlchemy
   
   db = SQLAlchemy(app)
   
   class Match(db.Model):
       id = db.Column(db.Integer, primary_key=True)
       date = db.Column(db.DateTime, nullable=False)
       team1 = db.Column(db.String(100), nullable=False)
       team2 = db.Column(db.String(100), nullable=False)
       score1 = db.Column(db.Integer)
       score2 = db.Column(db.Integer)
       game = db.Column(db.String(50), nullable=False)
       winner = db.Column(db.String(100))
   ```

### Adding Caching

```python
from flask_caching import Cache

cache = Cache(app)

@app.route('/')
@cache.cached(timeout=60)  # Cache for 1 minute
def index():
    # Your route logic
    pass
```

### Adding Background Tasks

```python
from celery import Celery

def make_celery(app):
    celery = Celery(app.import_name)
    celery.conf.update(app.config)
    return celery

celery = make_celery(app)

@celery.task
def scrape_data_background():
    # Background scraping task
    matches = scrape_match_data()
    # Save to database
    return len(matches)
```

## Environment Variables

Create a `.env` file for sensitive data:

```bash
# .env
SECRET_KEY=your-super-secret-key-here
RIOT_API_KEY=your-riot-api-key
STEAM_API_KEY=your-steam-api-key
DATABASE_URL=postgresql://user:pass@localhost/dbname
```

Load in your app:
```python
from dotenv import load_dotenv
load_dotenv()
```

## Production Deployment

### Using Gunicorn (Production WSGI Server)

1. **Install Gunicorn**
   ```bash
   pip install gunicorn
   ```

2. **Create Procfile** (for Heroku)
   ```
   web: gunicorn app:app
   ```

3. **Run locally**
   ```bash
   gunicorn app:app
   ```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## Monitoring and Analytics

### Adding Logging
```python
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    file_handler = RotatingFileHandler('logs/esports.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
```

### Adding Analytics
```python
from flask import request
import json

@app.before_request
def log_request_info():
    if not request.endpoint:
        return
    
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'method': request.method,
        'url': request.url,
        'ip': request.remote_addr,
        'user_agent': request.headers.get('User-Agent')
    }
    
    app.logger.info(f"Request: {json.dumps(log_data)}")
```

## Legal and Ethical Considerations

### Web Scraping Best Practices

1. **Check robots.txt**
   ```
   https://example.com/robots.txt
   ```

2. **Respect rate limits**
   - Don't overwhelm servers
   - Use delays between requests
   - Monitor for 429 (Too Many Requests) responses

3. **Terms of Service**
   - Read and comply with website ToS
   - Some sites prohibit scraping entirely
   - Consider reaching out for permission

4. **Data Usage**
   - Don't redistribute copyrighted content
   - Give proper attribution
   - Consider fair use implications

### Recommended Approach

1. **Use Official APIs First**
   - More reliable
   - Legally clear
   - Often faster
   - Better data structure

2. **Public Data Only**
   - Focus on publicly available match results
   - Avoid personal player data
   - Respect privacy

3. **Add Value**
   - Don't just copy data
   - Provide analysis, statistics, insights
   - Create transformative content

## Next Steps

1. **Start with mock data** (as provided in the code)
2. **Choose your target games/sites**
3. **Research available APIs**
4. **Implement one data source at a time**
5. **Add error handling and logging**
6. **Test thoroughly**
7. **Deploy to production**

## Resources

### Documentation
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Beautiful Soup Documentation](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [Requests Documentation](https://docs.python-requests.org/)

### APIs
- [Riot Developer Portal](https://developer.riotgames.com/)
- [Steam Web API](https://steamcommunity.com/dev)
- [Liquipedia API](https://liquipedia.net/api-help)

### Deployment
- [Heroku Python Guide](https://devcenter.heroku.com/articles/getting-started-with-python)
- [Railway Deployment](https://railway.app/)
- [PythonAnywhere](https://www.pythonanywhere.com/)

## Support

If you encounter issues:
1. Check the console/logs for error messages
2. Verify all dependencies are installed
3. Ensure templates are in the correct directory
4. Test with mock data first before implementing scraping
5. Check API rate limits and keys if using APIs

Remember to always scrape responsibly and consider using official APIs when available!
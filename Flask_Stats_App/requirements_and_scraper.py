# requirements.txt
Flask==2.3.3
requests==2.31.0
beautifulsoup4==4.12.2
lxml==4.9.3
python-dateutil==2.8.2

# scraper.py - Web scraping utilities
import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EsportsScraper:
    """
    Base class for esports data scraping
    Extend this class to scrape from specific sites
    """
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def get_page(self, url, delay=1):
        """Get a web page with error handling and rate limiting"""
        try:
            time.sleep(delay)  # Rate limiting
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

class LiquipediaScraper(EsportsScraper):
    """
    Example scraper for Liquipedia (requires API key for full access)
    This is a basic example - check Liquipedia's API documentation
    """
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://liquipedia.net"
    
    def scrape_recent_matches(self, game="valorant"):
        """
        Scrape recent matches from Liquipedia
        Note: This is a simplified example. Real implementation would need:
        - Proper API key
        - Rate limiting compliance
        - Error handling for different page structures
        """
        url = f"{self.base_url}/{game}/api.php"
        
        # Example API call (you'd need proper parameters)
        params = {
            'action': 'parse',
            'format': 'json',
            'page': 'Recent_Matches'  # This would be the actual page name
        }
        
        response = self.get_page(url, params=params)
        if not response:
            return []
        
        # Parse the response (simplified example)
        matches = []
        # Implementation would parse HTML/JSON response
        # and extract match data
        
        return matches

class HLTVScraper(EsportsScraper):
    """
    Example scraper for HLTV (CS2/CS:GO matches)
    Note: HLTV has anti-scraping measures, use responsibly
    """
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.hltv.org"
    
    def scrape_recent_matches(self):
        """
        Scrape recent matches from HLTV
        This is a simplified example - real implementation needs:
        - Proper rate limiting
        - Handling of dynamic content
        - Compliance with site's ToS
        """
        url = f"{self.base_url}/matches"
        
        response = self.get_page(url)
        if not response:
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        matches = []
        
        # Example parsing (structure may change)
        match_elements = soup.find_all('div', class_='match')
        
        for match_elem in match_elements:
            try:
                # Extract match data from HTML structure
                # This is pseudo-code - actual selectors would need inspection
                team1 = match_elem.find('div', class_='team1').text.strip()
                team2 = match_elem.find('div', class_='team2').text.strip()
                score = match_elem.find('div', class_='score').text.strip()
                
                match_data = {
                    'team1': team1,
                    'team2': team2,
                    'score': score,
                    'game': 'CS2',
                    'date': datetime.now().strftime('%Y-%m-%d')
                }
                matches.append(match_data)
                
            except Exception as e:
                logger.error(f"Error parsing match: {e}")
                continue
        
        return matches

class VLRScraper(EsportsScraper):
    """
    Example scraper for VLR.gg (Valorant matches)
    """
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.vlr.gg"
    
    def scrape_recent_matches(self):
        """
        Scrape recent Valorant matches from VLR.gg
        """
        url = f"{self.base_url}/matches"
        
        response = self.get_page(url)
        if not response:
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        matches = []
        
        # This would need to be implemented based on VLR's actual structure
        # Just showing the pattern here
        
        return matches

class EsportsDataAggregator:
    """
    Aggregates data from multiple sources
    """
    
    def __init__(self):
        self.scrapers = {
            'hltv': HLTVScraper(),
            'vlr': VLRScraper(),
            'liquipedia': LiquipediaScraper()
        }
    
    def get_all_recent_matches(self):
        """Get recent matches from all sources"""
        all_matches = []
        
        for source, scraper in self.scrapers.items():
            try:
                logger.info(f"Scraping from {source}")
                matches = scraper.scrape_recent_matches()
                
                # Add source information
                for match in matches:
                    match['source'] = source
                
                all_matches.extend(matches)
                
            except Exception as e:
                logger.error(f"Error scraping from {source}: {e}")
        
        return all_matches
    
    def save_matches_to_file(self, matches, filename='matches.json'):
        """Save matches to a JSON file"""
        try:
            with open(filename, 'w') as f:
                json.dump(matches, f, indent=2, default=str)
            logger.info(f"Saved {len(matches)} matches to {filename}")
        except Exception as e:
            logger.error(f"Error saving matches: {e}")
    
    def load_matches_from_file(self, filename='matches.json'):
        """Load matches from a JSON file"""
        try:
            with open(filename, 'r') as f:
                matches = json.load(f)
            logger.info(f"Loaded {len(matches)} matches from {filename}")
            return matches
        except FileNotFoundError:
            logger.warning(f"File {filename} not found")
            return []
        except Exception as e:
            logger.error(f"Error loading matches: {e}")
            return []

# Usage example
if __name__ == "__main__":
    # Example usage
    aggregator = EsportsDataAggregator()
    
    # Try to load existing data first
    matches = aggregator.load_matches_from_file()
    
    # If no existing data or data is stale, scrape new data
    if not matches:
        print("Scraping new match data...")
        matches = aggregator.get_all_recent_matches()
        aggregator.save_matches_to_file(matches)
    
    print(f"Total matches: {len(matches)}")
    for match in matches[:5]:  # Show first 5 matches
        print(f"{match.get('team1', 'N/A')} vs {match.get('team2', 'N/A')} - {match.get('game', 'N/A')}")

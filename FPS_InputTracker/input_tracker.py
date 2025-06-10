#!/usr/bin/env python3
"""
Input Tracker - Advanced keypress and mouse logging tool for FPS analysis
Captures precise timing data for performance analysis and gameplay review
"""

import json
import time
import threading
from datetime import datetime
from pathlib import Path
from collections import defaultdict, deque
import statistics

try:
    from pynput import keyboard, mouse
    from pynput.keyboard import Key
    from pynput.mouse import Button
except ImportError:
    print("Error: pynput not installed. Install with: pip install pynput")
    exit(1)


class InputTracker:
    def __init__(self, log_file="input_log.json", max_events=10000):
        self.log_file = Path(log_file)
        self.max_events = max_events
        self.events = deque(maxlen=max_events)
        self.session_start = time.time()
        self.running = False
        
        # Listeners
        self.keyboard_listener = None
        self.mouse_listener = None
        
        # Statistics tracking
        self.stats = {
            'total_keypresses': 0,
            'total_mouse_clicks': 0,
            'total_mouse_moves': 0,
            'session_duration': 0,
            'key_frequencies': defaultdict(int),
            'click_frequencies': defaultdict(int),
            'movement_data': []
        }
        
        # Performance tracking
        self.click_times = deque(maxlen=100)  # Last 100 clicks for CPS calculation
        self.key_times = deque(maxlen=100)    # Last 100 keys for KPS calculation
        
        print(f"Input Tracker initialized. Logging to: {self.log_file}")
    
    def log_event(self, event_type, data):
        """Log an input event with timestamp"""
        timestamp = time.time()
        event = {
            'timestamp': timestamp,
            'relative_time': timestamp - self.session_start,
            'datetime': datetime.fromtimestamp(timestamp).isoformat(),
            'type': event_type,
            'data': data
        }
        
        self.events.append(event)
        
        # Update statistics
        if event_type == 'keypress':
            self.stats['total_keypresses'] += 1
            self.stats['key_frequencies'][data.get('key', 'unknown')] += 1
            self.key_times.append(timestamp)
        elif event_type in ['mouse_click', 'mouse_release']:
            self.stats['total_mouse_clicks'] += 1
            self.stats['click_frequencies'][data.get('button', 'unknown')] += 1
            self.click_times.append(timestamp)
        elif event_type == 'mouse_move':
            self.stats['total_mouse_moves'] += 1
            self.stats['movement_data'].append((data.get('x', 0), data.get('y', 0)))
    
    def on_key_press(self, key):
        """Handle keyboard press events"""
        try:
            key_name = key.char if hasattr(key, 'char') and key.char else str(key)
        except AttributeError:
            key_name = str(key)
        
        self.log_event('keypress', {
            'key': key_name,
            'action': 'press'
        })
    
    def on_key_release(self, key):
        """Handle keyboard release events"""
        try:
            key_name = key.char if hasattr(key, 'char') and key.char else str(key)
        except AttributeError:
            key_name = str(key)
        
        self.log_event('keyrelease', {
            'key': key_name,
            'action': 'release'
        })
        
        # Stop tracking on ESC key
        if key == Key.esc:
            print("\nESC pressed - stopping tracker...")
            return False
    
    def on_mouse_click(self, x, y, button, pressed):
        """Handle mouse click events"""
        action = 'click' if pressed else 'release'
        event_type = 'mouse_click' if pressed else 'mouse_release'
        
        self.log_event(event_type, {
            'x': x,
            'y': y,
            'button': str(button),
            'action': action
        })
    
    def on_mouse_move(self, x, y):
        """Handle mouse movement events (throttled)"""
        # Throttle mouse movement logging to avoid spam
        current_time = time.time()
        if not hasattr(self, '_last_mouse_log') or current_time - self._last_mouse_log > 0.1:
            self.log_event('mouse_move', {
                'x': x,
                'y': y
            })
            self._last_mouse_log = current_time
    
    def on_mouse_scroll(self, x, y, dx, dy):
        """Handle mouse scroll events"""
        self.log_event('mouse_scroll', {
            'x': x,
            'y': y,
            'dx': dx,
            'dy': dy
        })
    
    def start_tracking(self):
        """Start input tracking"""
        if self.running:
            print("Tracker is already running!")
            return
        
        self.running = True
        self.session_start = time.time()
        
        # Start keyboard listener
        self.keyboard_listener = keyboard.Listener(
            on_press=self.on_key_press,
            on_release=self.on_key_release
        )
        
        # Start mouse listener
        self.mouse_listener = mouse.Listener(
            on_click=self.on_mouse_click,
            on_move=self.on_mouse_move,
            on_scroll=self.on_mouse_scroll
        )
        
        self.keyboard_listener.start()
        self.mouse_listener.start()
        
        print("🎯 Input tracking started!")
        print("Press ESC to stop tracking")
        print("=" * 50)
    
    def stop_tracking(self):
        """Stop input tracking"""
        if not self.running:
            return
        
        self.running = False
        
        if self.keyboard_listener:
            self.keyboard_listener.stop()
        if self.mouse_listener:
            self.mouse_listener.stop()
        
        self.stats['session_duration'] = time.time() - self.session_start
        print("\n🛑 Input tracking stopped!")
    
    def get_performance_stats(self):
        """Calculate performance statistics"""
        current_time = time.time()
        
        # Calculate CPS (Clicks Per Second) - last 10 seconds
        recent_clicks = [t for t in self.click_times if current_time - t <= 10]
        cps = len(recent_clicks) / min(10, current_time - self.session_start) if recent_clicks else 0
        
        # Calculate KPS (Keys Per Second) - last 10 seconds
        recent_keys = [t for t in self.key_times if current_time - t <= 10]
        kps = len(recent_keys) / min(10, current_time - self.session_start) if recent_keys else 0
        
        # Calculate average response time (time between key presses)
        avg_key_interval = 0
        if len(self.key_times) > 1:
            intervals = [self.key_times[i] - self.key_times[i-1] for i in range(1, len(self.key_times))]
            avg_key_interval = statistics.mean(intervals) * 1000  # Convert to milliseconds
        
        return {
            'cps': round(cps, 2),
            'kps': round(kps, 2),
            'avg_key_interval_ms': round(avg_key_interval, 2),
            'total_events': len(self.events),
            'session_duration': round(current_time - self.session_start, 2)
        }
    
    def print_live_stats(self):
        """Print live performance statistics"""
        perf_stats = self.get_performance_stats()
        
        print(f"\r📊 Live Stats: "
              f"CPS: {perf_stats['cps']:5.1f} | "
              f"KPS: {perf_stats['kps']:5.1f} | "
              f"Avg Interval: {perf_stats['avg_key_interval_ms']:6.1f}ms | "
              f"Events: {perf_stats['total_events']:5d} | "
              f"Time: {perf_stats['session_duration']:6.1f}s", 
              end='', flush=True)
    
    def save_session(self):
        """Save the current session to file"""
        session_data = {
            'session_info': {
                'start_time': datetime.fromtimestamp(self.session_start).isoformat(),
                'duration': self.stats['session_duration'],
                'total_events': len(self.events)
            },
            'statistics': dict(self.stats),
            'performance': self.get_performance_stats(),
            'events': list(self.events)
        }
        
        # Convert defaultdict to regular dict for JSON serialization
        session_data['statistics']['key_frequencies'] = dict(self.stats['key_frequencies'])
        session_data['statistics']['click_frequencies'] = dict(self.stats['click_frequencies'])
        
        try:
            with open(self.log_file, 'w') as f:
                json.dump(session_data, f, indent=2)
            print(f"\n💾 Session saved to {self.log_file}")
        except Exception as e:
            print(f"\n❌ Error saving session: {e}")
    
    def load_session(self, file_path):
        """Load a previous session for analysis"""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            print(f"📂 Loaded session from {file_path}")
            return data
        except Exception as e:
            print(f"❌ Error loading session: {e}")
            return None
    
    def analyze_session(self, session_data=None):
        """Analyze session data and provide insights"""
        if session_data is None:
            # Use current session
            session_data = {
                'statistics': dict(self.stats),
                'performance': self.get_performance_stats()
            }
        
        stats = session_data['statistics']
        perf = session_data.get('performance', {})
        
        print("\n" + "="*60)
        print("📈 SESSION ANALYSIS")
        print("="*60)
        
        print(f"⏱️  Duration: {stats.get('session_duration', 0):.1f} seconds")
        print(f"⌨️  Total Keypresses: {stats.get('total_keypresses', 0)}")
        print(f"🖱️  Total Mouse Clicks: {stats.get('total_mouse_clicks', 0)}")
        print(f"📍 Total Mouse Moves: {stats.get('total_mouse_moves', 0)}")
        
        if perf:
            print(f"\n🎯 PERFORMANCE METRICS")
            print(f"   CPS (Clicks/sec): {perf.get('cps', 0)}")
            print(f"   KPS (Keys/sec): {perf.get('kps', 0)}")
            print(f"   Avg Key Interval: {perf.get('avg_key_interval_ms', 0):.1f}ms")
        
        # Most used keys
        key_freq = stats.get('key_frequencies', {})
        if key_freq:
            print(f"\n🔥 TOP 5 MOST USED KEYS:")
            sorted_keys = sorted(key_freq.items(), key=lambda x: x[1], reverse=True)[:5]
            for key, count in sorted_keys:
                print(f"   {key}: {count} times")
        
        # Mouse button usage
        click_freq = stats.get('click_frequencies', {})
        if click_freq:
            print(f"\n🖱️  MOUSE BUTTON USAGE:")
            for button, count in click_freq.items():
                print(f"   {button}: {count} clicks")
    
    def run_with_live_display(self):
        """Run tracker with live statistics display"""
        self.start_tracking()
        
        try:
            while self.running:
                time.sleep(1)
                self.print_live_stats()
        except KeyboardInterrupt:
            pass
        finally:
            self.stop_tracking()
            self.save_session()
            self.analyze_session()


def main():
    print("🎮 FPS Input Tracker")
    print("=" * 30)
    
    # Get log file name
    log_file = input("Enter log file name (default: input_log.json): ").strip()
    if not log_file:
        log_file = "input_log.json"
    
    tracker = InputTracker(log_file)
    
    print("\nChoose an option:")
    print("1. Start new tracking session")
    print("2. Analyze existing log file")
    print("3. Exit")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        print(f"\nStarting tracking session...")
        print("Tip: Keep this window visible to see live stats!")
        input("Press Enter to begin tracking...")
        tracker.run_with_live_display()
    
    elif choice == "2":
        file_path = input("Enter path to log file: ").strip()
        if Path(file_path).exists():
            session_data = tracker.load_session(file_path)
            if session_data:
                tracker.analyze_session(session_data)
        else:
            print("File not found!")
    
    elif choice == "3":
        print("Goodbye!")
    
    else:
        print("Invalid choice!")


if __name__ == "__main__":
    main()

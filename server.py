#!/usr/bin/env python3
"""
Simple Python HTTP server with PHP support for local development
Run with: python3 server.py
"""

import http.server
import socketserver
import subprocess
import os
import sys
from urllib.parse import urlparse, parse_qs

class PHPHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse URL
        parsed_path = urlparse(self.path)
        
        # Handle PHP files
        if parsed_path.path.endswith('.php'):
            self.handle_php()
        else:
            # Handle static files (CSS, JS, images, etc.)
            super().do_GET()
    
    def handle_php(self):
        # Get the file path
        file_path = self.path.lstrip('/')
        if not file_path:
            file_path = 'index.php'
        
        # Check if file exists
        if not os.path.exists(file_path):
            self.send_error(404, "File not found")
            return
        
        try:
            # Execute PHP
            result = subprocess.run(
                ['php', file_path],
                capture_output=True,
                text=True,
                cwd=os.getcwd()
            )
            
            if result.returncode == 0:
                # Success
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(result.stdout.encode())
            else:
                # PHP error
                self.send_response(500)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(f"PHP Error:\n{result.stderr}".encode())
                
        except FileNotFoundError:
            self.send_response(500)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            error_msg = """
            <h1>PHP Not Found</h1>
            <p>PHP is not installed or not in PATH.</p>
            <p>Install PHP:</p>
            <ul>
                <li><strong>macOS:</strong> <code>brew install php</code></li>
                <li><strong>Ubuntu:</strong> <code>sudo apt install php-cli</code></li>
                <li><strong>Windows:</strong> Download from <a href="https://www.php.net/downloads">php.net</a></li>
            </ul>
            <p>Or use the Node.js server instead: <code>npm start</code></p>
            """
            self.wfile.write(error_msg.encode())

def main():
    PORT = 8000
    
    print(f"🚀 Starting TOTransit local development server...")
    print(f"📍 Server running at: http://localhost:{PORT}")
    print(f"📂 Serving from: {os.getcwd()}")
    print(f"🔧 PHP support: {'✅' if check_php() else '❌'}")
    print(f"💡 Press Ctrl+C to stop")
    print()
    
    with socketserver.TCPServer(("", PORT), PHPHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

def check_php():
    try:
        subprocess.run(['php', '--version'], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False

if __name__ == "__main__":
    main()
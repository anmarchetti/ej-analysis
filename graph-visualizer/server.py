#!/usr/bin/env python3
"""
EJ Graph Visualizer - Dev Server
Serves static files + handles POST /api/save-layout to persist node positions.

Usage:
    python3 server.py
    python3 server.py --port 8000

The server will write/read graph-visualizer/data/layout-positions.json.
"""

import http.server
import json
import os
import sys
import argparse
from pathlib import Path

SERVE_DIR = Path(__file__).parent.resolve()
DATA_DIR  = SERVE_DIR / "data"
LAYOUT_FILE = DATA_DIR / "layout-positions.json"


class GraphServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SERVE_DIR), **kwargs)

    def log_message(self, format, *args):
        # Suppress noisy GET logs; only show POST / errors
        if self.command == 'POST' or (len(args) > 1 and str(args[1]).startswith(('4', '5'))):
            super().log_message(format, *args)

    # ── CORS headers (allow local JS fetch) ────────────────────────────────
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    # ── POST handler ───────────────────────────────────────────────────────
    def do_POST(self):
        if self.path == '/api/save-layout':
            self._handle_save_layout()
        else:
            self.send_error(404, f"Unknown POST endpoint: {self.path}")

    def _handle_save_layout(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            data   = json.loads(body)

            DATA_DIR.mkdir(parents=True, exist_ok=True)
            with open(LAYOUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"  ✅  Layout saved → {LAYOUT_FILE.relative_to(SERVE_DIR)}  "
                  f"({len(data.get('nodes', {}))} nodes)")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True}).encode())

        except Exception as e:
            print(f"  ❌  Save error: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode())


def main():
    parser = argparse.ArgumentParser(description='EJ Graph Visualizer Server')
    parser.add_argument('--port', type=int, default=8000, help='Port to listen on (default: 8000)')
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not LAYOUT_FILE.exists():
        LAYOUT_FILE.write_text(json.dumps({'nodes': {}, 'savedAt': None}))
        print(f"  📁  Created empty layout file: {LAYOUT_FILE.relative_to(SERVE_DIR)}")

    print(f"\n  🚀  EJ Graph Visualizer")
    print(f"  📡  Serving: {SERVE_DIR}")
    print(f"  🌐  http://localhost:{args.port}")
    print(f"  💾  Layout file: {LAYOUT_FILE.relative_to(SERVE_DIR)}")
    print(f"  Press Ctrl+C to stop.\n")

    with http.server.ThreadingHTTPServer(('', args.port), GraphServer) as server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\n  👋  Server stopped.')
            sys.exit(0)


if __name__ == '__main__':
    main()

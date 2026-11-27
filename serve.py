# -*- coding: utf-8 -*-
"""Serveur local sans cache (évite les anciennes versions des fichiers JS/CSS)."""
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")

class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8081), NoCacheHandler)
    print("Serving", ROOT, "on http://127.0.0.1:8081")
    server.serve_forever()

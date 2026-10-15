"""Tiny static server with SPA fallback: unknown paths get index.html.

usage: python3 tools/serve.py <root-dir> <port>
"""
import http.server
import os
import sys

root, port = os.path.abspath(sys.argv[1]), int(sys.argv[2])


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=root, **kw)

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            # mirror GitHub Pages: serve 404.html if present, else the SPA shell
            fallback = "404.html" if os.path.exists(os.path.join(root, "404.html")) else "index.html"
            self.path = "/" + fallback
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()

# a local receiver for the viewer's exports: POST http://127.0.0.1:8812/save/<name> writes work/<name>. Run: python save_server.py
import http.server, os, re
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'work')
os.makedirs(OUT, exist_ok=True)

class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0)); body = self.rfile.read(n)
        m = re.fullmatch(r'/save/([\w.-]+)', self.path)
        if m:
            with open(os.path.join(OUT, m.group(1)), 'wb') as f: f.write(body)
            print('saved', m.group(1), len(body), flush=True)
        self.send_response(200 if m else 404); self.cors(); self.end_headers(); self.wfile.write(b'ok' if m else b'no')
    def log_message(self, *a): pass

http.server.ThreadingHTTPServer(('127.0.0.1', 8812), H).serve_forever()

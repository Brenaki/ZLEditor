#!/usr/bin/env python3
import base64
import http.server
import json
import os
import shutil
import subprocess
import tempfile
import urllib.request
import uuid

PORT = 8765
DIR  = os.path.dirname(os.path.abspath(__file__))
BBT_URL = 'http://localhost:23119/better-bibtex/json-rpc'

_last_log = ''


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    # ── CORS preflight ────────────────────────────────────────────────────
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    # ── GET: static files + /compile/log ─────────────────────────────────
    def do_GET(self):
        if self.path == '/compile/log':
            self._json(200, {'log': _last_log})
        else:
            super().do_GET()

    # ── POST router ───────────────────────────────────────────────────────
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body   = self.rfile.read(length)

        if self.path == '/bbt-proxy':
            self._bbt_proxy(body)
        elif self.path == '/compile':
            self._compile(body)
        else:
            self.send_response(404)
            self.end_headers()

    # ── BBT proxy ─────────────────────────────────────────────────────────
    def _bbt_proxy(self, body):
        try:
            req = urllib.request.Request(
                BBT_URL, data=body,
                headers={'Content-Type': 'application/json'},
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
            self._raw(200, 'application/json', data)
        except Exception as e:
            self._json(502, {'error': str(e)})

    # ── LaTeX compile ─────────────────────────────────────────────────────
    def _compile(self, body):
        global _last_log

        try:
            payload = json.loads(body)
        except Exception:
            self._json(400, {'error': True, 'log': 'JSON inválido'})
            return

        if not shutil.which('pdflatex'):
            self._json(500, {
                'error': True,
                'log': (
                    'pdflatex não encontrado.\n'
                    'Instale com: sudo pacman -S texlive-basic texlive-latex texlive-latexrecommended'
                ),
            })
            return

        files     = payload.get('files', [])
        root_file = payload.get('rootFile', 'main.tex')
        tmpdir    = tempfile.mkdtemp(prefix='zotero-latex-')

        try:
            has_bib = self._write_files(files, tmpdir)
            log, pdf_bytes = self._run_latex(root_file, tmpdir, has_bib)
            _last_log = log

            if pdf_bytes is None:
                self._json(422, {'error': True, 'log': log})
            else:
                self._raw(200, 'application/pdf', pdf_bytes)
        except subprocess.TimeoutExpired:
            _last_log = 'Compilação excedeu o tempo limite (60 s).'
            self._json(422, {'error': True, 'log': _last_log})
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    # ── Helpers ───────────────────────────────────────────────────────────
    @staticmethod
    def _write_files(files, tmpdir):
        has_bib = False
        for f in files:
            name = os.path.normpath(f.get('name', 'unnamed'))
            # Prevent directory traversal
            dest = os.path.join(tmpdir, name)
            if not dest.startswith(tmpdir):
                continue
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if f.get('binary'):
                with open(dest, 'wb') as fh:
                    fh.write(base64.b64decode(f.get('base64', '')))
            else:
                with open(dest, 'w', encoding='utf-8') as fh:
                    fh.write(f.get('content', ''))
            if name.endswith('.bib'):
                has_bib = True
        return has_bib

    @staticmethod
    def _run_latex(root_file, tmpdir, has_bib):
        root_base = os.path.splitext(root_file)[0]
        log_parts = []

        def run(*cmd):
            r = subprocess.run(
                list(cmd), cwd=tmpdir,
                capture_output=True, text=True, timeout=60,
            )
            log_parts.append(r.stdout)
            return r

        latex_args = ['pdflatex', '-interaction=nonstopmode', '-halt-on-error', root_file]

        r = run(*latex_args)
        if r.returncode != 0:
            return '\n'.join(log_parts), None

        if has_bib:
            run('bibtex', root_base)

        run(*latex_args)
        run(*latex_args)

        pdf_path = os.path.join(tmpdir, root_base + '.pdf')
        if not os.path.exists(pdf_path):
            return '\n'.join(log_parts), None

        with open(pdf_path, 'rb') as f:
            return '\n'.join(log_parts), f.read()

    def _json(self, status, data):
        body = json.dumps(data).encode()
        self._raw(status, 'application/json', body)

    def _raw(self, status, content_type, body):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass


if __name__ == '__main__':
    with http.server.HTTPServer(('127.0.0.1', PORT), Handler) as server:
        print(f'Servidor em http://localhost:{PORT}')
        server.serve_forever()

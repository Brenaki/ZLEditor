# ── Stage 1: Build editor bundle ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

# Only copy files needed for the frontend bundles
COPY scripts/editor-entry.js ./scripts/
COPY scripts/utils/latex-completions.js ./scripts/utils/

RUN npm run build


# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

# Install Python 3, pip, and TeX Live full
# texlive-full pulls everything including pdflatex, bibtex, and all packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-pip \
      texlive-full \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy the application files
COPY . .

# Overwrite/add the generated frontend bundles
COPY --from=builder /build/scripts/editor-bundle.js ./scripts/editor-bundle.js
COPY --from=builder /build/scripts/vendor/jszip.js ./scripts/vendor/jszip.js

# Run as a non-root user to limit blast radius of any RCE
RUN useradd -r -s /bin/false appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8765

# Bind to 127.0.0.1 so the service is not directly reachable from other
# containers or the host network without an explicit port mapping or reverse proxy.
# Change to 0.0.0.0 only if you are running behind a trusted reverse proxy.
CMD ["uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8765"]


# ── Stage 3: Test ─────────────────────────────────────────────────────────────
FROM runtime AS test

COPY requirements-dev.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements-dev.txt

CMD ["pytest", "--cov=app", "--cov-fail-under=90", "-v"]

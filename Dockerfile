# ── Stage 1: Build editor bundle ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json ./
RUN npm install

# Only copy files needed for the bundle
COPY scripts/editor-entry.js          ./scripts/
COPY scripts/utils/latex-completions.js ./scripts/utils/

RUN npx esbuild scripts/editor-entry.js \
      --bundle \
      --format=iife \
      --outfile=editor-bundle.js \
      --minify \
      --log-level=info


# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM debian:bookworm-slim

# Install Python 3 and TeX Live full
# texlive-full pulls everything including pdflatex, bibtex, and all packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      texlive-full \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the application files
COPY . .

# Overwrite/add the generated editor bundle
COPY --from=builder /build/editor-bundle.js ./scripts/editor-bundle.js

EXPOSE 8765

CMD ["python3", "server.py"]

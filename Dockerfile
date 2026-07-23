# Stage 1: Frontend build (Vite + React public site)
FROM node:22-slim AS frontend-builder

WORKDIR /build

COPY frontend/app/package*.json ./
RUN npm ci

COPY frontend/app/ ./
RUN npm run build


# Stage 2: Builder
FROM python:3.12-slim AS builder

# Set environment variables for build
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies into a virtualenv or local user directory
COPY requirements-docker.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements-docker.txt


# Stage 3: Final Production Image
FROM python:3.12-slim

# Set runtime environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install minimal runtime dependencies (like curl for healthcheck and postgres client libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy built wheels from builder stage and install them
COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /app/requirements-docker.txt .
RUN pip install --no-cache /wheels/*

# Create a non-root user 'appuser'
RUN useradd -m -u 1000 appuser

# Copy application code
COPY . /app

# Copy the built React public site (frontend/app/dist) — served by Flask's
# catch-all route (backend/app.py: DIST_DIR)
COPY --from=frontend-builder /build/dist /app/frontend/app/dist

# Setup directories and permissions
RUN mkdir -p /app/data /app/instance/db_backups \
    /app/frontend/static/uploads/founders /app/frontend/static/uploads/projects && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 10003

# Healthcheck ensures the app is responsive
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=40s \
    CMD curl -f http://127.0.0.1:10003/login || exit 1

# Start application using Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10003", "--workers", "2", "--threads", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]

FROM python:3.12-slim

# Production-ready Dockerfile with multi-stage optimization

# Build arguments
ARG PYTHON_VERSION=3.12

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install system dependencies (minimal for production)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies from requirements file
COPY requirements-docker.txt /tmp/requirements-docker.txt
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r /tmp/requirements-docker.txt && \
    rm /tmp/requirements-docker.txt

# Copy application source code
COPY . /app

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/instance/db_backups && \
    chmod 755 /app/data /app/instance/db_backups

# Create non-root user for security (optional but recommended)
# RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
# USER appuser

# Expose application port
EXPOSE 10003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=40s \
    CMD curl -f http://127.0.0.1:10003/login || exit 1

# Start application with gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10003", "--workers", "2", "--threads", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]

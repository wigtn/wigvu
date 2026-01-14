# syntax=docker/dockerfile:1

# Base image with CUDA support (optional)
FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
FROM base AS deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM base AS runner
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

EXPOSE 5000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]

ARG TARGET=production

# Base stage for shared steps
FROM python:3.12-slim AS base

# Update package lists and install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    gcc \
    g++ \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables needed for GDAL
ENV GDAL_CONFIG=/usr/bin/gdal-config
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Explicitly install gunicorn
RUN pip install gunicorn

# Development stage
FROM base AS development
ENV FLASK_ENV=development
COPY . .
CMD ["python3", "app.py"]

# Production stage
FROM base AS production
ENV FLASK_ENV=production
COPY . .
# Add any production-specific steps here, e.g., collecting static files
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]

# Final stage
FROM ${TARGET} AS final
EXPOSE 8080

ARG TARGET=production

# Base stage for shared steps
FROM python:3.12-bullseye AS base

# Update GPG keys and install system dependencies for GDAL
RUN apt-get update && \
    apt-get install -y gnupg && \
    apt-get install -y debian-archive-keyring && \
    apt-get install -y libgdal-dev gdal-bin

# Set environment variables needed for GDAL
ENV GDAL_CONFIG=/usr/bin/gdal-config
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

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

FROM python:latest

# Update GPG keys and install system dependencies for GDAL
RUN apt-get update && \
    apt-get install -y gnupg && \
    apt-key update && \
    apt-get install -y debian-archive-keyring && \
    apt-get update && \
    apt-get install -y libgdal-dev gdal-bin

# Set environment variables needed for GDAL
ENV GDAL_CONFIG=/usr/bin/gdal-config
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

# Copy the requirements file into the image
COPY ./requirements.txt /app/requirements.txt

# Switch working directory
WORKDIR /app

# Install the dependencies and packages in the requirements file
RUN pip install -r requirements.txt

# Copy every content from the local file to the image
COPY . /app

# Expose the port the server will run on
EXPOSE 12345

# Start the server
CMD ["python3", "app.py"]
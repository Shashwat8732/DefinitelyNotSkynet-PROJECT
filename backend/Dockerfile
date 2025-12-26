# Base image with Node.js
FROM node:20-slim AS node-base

# Python base image
FROM python:3.11-slim

# Copy Node.js from node-base
COPY --from=node-base /usr/local/bin/node /usr/local/bin/
COPY --from=node-base /usr/local/lib/node_modules /usr/local/lib/node_modules

# Create symlinks for npm and npx
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install system dependencies and security tools
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nmap \
    masscan \
    wget \
    build-essential \
    libssl-dev \
    zlib1g-dev \
    sslscan \
    && rm -rf /var/lib/apt/lists/*

# Install SQLMap
RUN git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git /opt/sqlmap && \
    ln -s /opt/sqlmap/sqlmap.py /usr/local/bin/sqlmap && \
    chmod +x /usr/local/bin/sqlmap

# Install FFUF
RUN wget -q https://github.com/ffuf/ffuf/releases/download/v2.1.0/ffuf_2.1.0_linux_amd64.tar.gz && \
    tar -xzf ffuf_2.1.0_linux_amd64.tar.gz && \
    mv ffuf /usr/local/bin/ && \
    chmod +x /usr/local/bin/ffuf && \
    rm ffuf_2.1.0_linux_amd64.tar.gz

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV NMAP_PATH=/usr/bin/nmap
ENV SQLMAP_PATH=/usr/local/bin/sqlmap
ENV FFUF_PATH=/usr/local/bin/ffuf
ENV MASSCAN_PATH=/usr/bin/masscan
ENV SSLSCAN_PATH=/usr/bin/sslscan

# Expose port
EXPOSE 8000

# Start command
CMD ["python", "server.py"]

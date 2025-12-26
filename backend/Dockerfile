# Base image
FROM python:3.11-slim

# Install system dependencies and tools
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
    ln -s /opt/sqlmap/sqlmap.py /usr/local/bin/sqlmap

# Install FFUF
RUN wget -q https://github.com/ffuf/ffuf/releases/download/v2.1.0/ffuf_2.1.0_linux_amd64.tar.gz && \
    tar -xzf ffuf_2.1.0_linux_amd64.tar.gz && \
    mv ffuf /usr/local/bin/ && \
    chmod +x /usr/local/bin/ffuf && \
    rm ffuf_2.1.0_linux_amd64.tar.gz

# Set working directory
WORKDIR /app

# Copy and install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Environment variables for your tools
ENV PYTHONUNBUFFERED=1
ENV NMAP_PATH=/usr/bin/nmap
ENV SQLMAP_PATH=/usr/local/bin/sqlmap
ENV FFUF_PATH=/usr/local/bin/ffuf
ENV MASSCAN_PATH=/usr/bin/masscan

# Start command
CMD ["python", "server.py"]

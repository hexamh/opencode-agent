FROM docker.io/cloudflare/sandbox:0.8.0-opencode

# Add OpenCode to PATH
ENV PATH="/root/.opencode/bin:${PATH}"

# Install essential system packages
RUN apt-get update && apt-get install -y \
    # Build tools
    build-essential \
    cmake \
    # Database clients
    postgresql-client \
    redis-tools \
    sqlite3 \
    # Network & debugging
    iputils-ping \
    dnsutils \
    netcat-openbsd \
    net-tools \
    # Development tools
    vim \
    nano \
    htop \
    tree \
    jq \
    # Media processing
    imagemagick \
    ffmpeg \
    # Utilities
    rsync \
    screen \
    && rm -rf /var/lib/apt/lists/*

# Install essential Python packages
RUN pip install --no-cache-dir \
    # Core libraries
    requests \
    aiohttp \
    # Web scraping
    beautifulsoup4 \
    # Data formats
    pyyaml \
    # Utilities
    python-dotenv \
    rich \
    # MCP support
    mcp

# Install essential Node.js packages globally
RUN npm install -g \
    typescript \
    tsx \
    prettier \
    mcp-remote \
    wrangler

# Clone Cloudflare agents repository with examples
RUN git clone --depth 1 https://github.com/cloudflare/agents.git /home/user/workspace

# Set working directory
WORKDIR /home/user/workspace

# Expose OpenCode server port
EXPOSE 4096

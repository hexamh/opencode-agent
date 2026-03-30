FROM docker.io/cloudflare/sandbox:0.8.0-opencode

# Add OpenCode to PATH
ENV PATH="/root/.opencode/bin:${PATH}"

# Install system packages and tools
RUN apt-get update && apt-get install -y \
    # Build essentials
    build-essential \
    cmake \
    pkg-config \
    # Database clients
    postgresql-client \
    mysql-client \
    redis-tools \
    sqlite3 \
    # Network tools
    netcat \
    telnet \
    nmap \
    iputils-ping \
    dnsutils \
    traceroute \
    # Development tools
    vim \
    nano \
    htop \
    tree \
    jq \
    yq \
    # Archive tools
    zip \
    unzip \
    tar \
    gzip \
    bzip2 \
    xz-utils \
    # Version control
    git \
    git-lfs \
    # Graphics & media
    imagemagick \
    ffmpeg \
    # Other utilities
    rsync \
    screen \
    tmux \
    socat \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages for data science and AI
RUN pip install --no-cache-dir \
    # Core data science
    numpy==1.26.4 \
    pandas==2.2.1 \
    matplotlib==3.8.3 \
    seaborn==0.13.2 \
    scipy==1.12.0 \
    scikit-learn==1.4.1.post1 \
    # Machine Learning
    torch==2.2.1 \
    transformers==4.38.2 \
    # API & HTTP
    requests==2.31.0 \
    httpx==0.27.0 \
    aiohttp==3.9.3 \
    # Web scraping
    beautifulsoup4==4.12.3 \
    lxml==5.1.0 \
    # Data formats
    pyyaml==6.0.1 \
    toml==0.10.2 \
    openpyxl==3.1.2 \
    # Utilities
    python-dotenv==1.0.1 \
    click==8.1.7 \
    rich==13.7.1 \
    # MCP support
    mcp==0.9.0

# Install Node.js packages globally
RUN npm install -g \
    # TypeScript & compilers
    typescript@5.3.3 \
    ts-node@10.9.2 \
    tsx@4.7.1 \
    # Code quality
    prettier@3.2.5 \
    eslint@8.57.0 \
    # Build tools
    vite@5.1.4 \
    esbuild@0.20.1 \
    # Package managers
    pnpm@8.15.4 \
    # MCP tools
    mcp-remote@0.4.1 \
    # Cloudflare tools
    wrangler@3.28.4 \
    # Utilities
    nodemon@3.1.0 \
    dotenv-cli@7.3.0

# Install Rust and Cargo (for Rust-based tools)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && . $HOME/.cargo/env \
    && cargo install ripgrep fd-find bat exa

# Add Rust to PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install gh -y \
    && rm -rf /var/lib/apt/lists/*

# Clone Cloudflare agents repository with examples
RUN git clone --depth 1 https://github.com/cloudflare/agents.git /home/user/workspace

# Set working directory
WORKDIR /home/user/workspace

# Expose OpenCode server port
EXPOSE 4096

# Create useful aliases and environment setup
RUN echo 'alias ll="ls -lah"' >> /root/.bashrc \
    && echo 'alias gs="git status"' >> /root/.bashrc \
    && echo 'alias gp="git pull"' >> /root/.bashrc \
    && echo 'alias dc="docker-compose"' >> /root/.bashrc \
    && echo 'export EDITOR=nano' >> /root/.bashrc

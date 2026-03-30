FROM docker.io/cloudflare/sandbox:0.8.0

# Add OpenCode install location to PATH before installation
ENV PATH="/root/.opencode/bin:${PATH}"

# Install OpenCode CLI
# This installs the OpenCode agent binary and makes it available system-wide
RUN curl -fsSL https://opencode.ai/install -o /tmp/install-opencode.sh \
    && bash /tmp/install-opencode.sh \
    && rm /tmp/install-opencode.sh \
    && opencode --version

# Clone a sample project for demonstration
# Replace this with your own project initialization as needed
RUN git clone --depth 1 https://github.com/cloudflare/agents.git /home/user/workspace

# Set working directory
WORKDIR /home/user/workspace

# Expose OpenCode server port (required for web UI)
EXPOSE 4096

# Optional: Install additional tools
# Uncomment and customize as needed for your use case
# RUN apt-get update && apt-get install -y \
#     postgresql-client \
#     redis-tools \
#     && rm -rf /var/lib/apt/lists/*

# Optional: Install additional Python packages
# RUN pip install --no-cache-dir \
#     requests \
#     pandas \
#     numpy

# Optional: Install additional Node.js packages globally
# RUN npm install -g \
#     typescript \
#     prettier \
#     eslint

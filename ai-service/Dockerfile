# Build stage
FROM python:3.9-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Run stage
FROM python:3.9-slim

WORKDIR /app

# Copy installed packages
COPY --from=builder /root/.local /root/.local
COPY embed.py .

# Update PATH
ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD ["python", "embed.py"]

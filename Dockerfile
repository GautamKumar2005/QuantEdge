# Build Next.js
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Final Stage
FROM node:20-slim
WORKDIR /app

# Install Python and dependencies
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/*

# Set up virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy built frontend
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/next.config.ts ./
RUN npm install --production

# Copy backend
COPY backend ./backend
COPY start.sh ./start.sh
RUN chmod +x start.sh

# HF Spaces environment
ENV PORT 7860
EXPOSE 7860

CMD ["./start.sh"]

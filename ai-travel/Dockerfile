# Base image
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code + chroma_db
COPY app.py .
COPY src ./src
COPY chroma_db ./chroma_db
COPY data ./data
COPY .env /app/.env

# Expose FastAPI port
EXPOSE 8000

# Env
ENV PYTHONUNBUFFERED=1

# Run app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

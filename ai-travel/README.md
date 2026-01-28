# AI Travel & Consultation API

## Getting Started with Docker

This project is a FastAPI-based backend for an Airbnb consultation chatbot. The recommended way to run the application is using Docker.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed on your system.

### 1. Build the Docker Image
From the `ai-travel` directory:
```bash
docker build -t ai-travel .
```

### 2. Run the Docker Container
```bash
docker run -d -p 8000:8000 --name ai-travel-container ai-travel
```

- The API will be available at: [http://localhost:8000](http://localhost:8000)
- The root endpoint (`/`) returns a welcome message and service list.

### 3. Stopping and Removing the Container
To stop the container:
```bash
docker stop ai-travel-container
```
To remove the container:
```bash
docker rm ai-travel-container
```

### 4. Updating the Container
If you make changes to the code:
1. Stop and remove the running container (see above).
2. Rebuild the image:
   ```bash
   docker build -t ai-travel .
   ```
3. Run the container again (see above).

### 5. Environment Variables
- The application uses a `.env` file for configuration. Make sure your `.env` file is present in the project root before building the Docker image.

---

## Project Structure
```
├── app.py              # Main FastAPI app
├── requirements.txt    # Python dependencies
├── Dockerfile          # Docker build instructions
├── .env                # Environment variables (not committed)
└── src/                # Source code
```

## API Endpoints
- `GET /` — Health check, returns a welcome message and available services.
- `POST /chatbot/ask_question` — Ask questions about Airbnb usage.
- `GET /chatbot/health` — Health check for chatbot service.

## Support
For help, please open an issue in this repository.

## License
Specify your license here.

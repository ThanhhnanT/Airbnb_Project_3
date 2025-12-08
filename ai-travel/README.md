# EUP - AI Tutor

## Getting Started with Docker

This project is a FastAPI-based AI Tutor backend. The recommended way to run the application is using Docker.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed on your system.

### 1. Clone the Repository
```bash
git clone https://gitlab.com/thanhhnant-group/eup-ai-tutor.git
```

### 2. Build the Docker Image
```bash
docker build -t ai-schedule .
```

### 3. Run the Docker Container
```bash
docker run -d -p 8000:8000 --name ai-schedule-container ai-schedule
```

- The API will be available at: [http://localhost:8000](http://localhost:8000)
- The root endpoint (`/`) should return `{"Hello": "World"}`.

### 4. Stopping and Removing the Container
To stop the container:
```bash
docker stop ai-schedule-container
```
To remove the container:
```bash
docker rm ai-schedule-container
```

### 5. Updating the Container
If you make changes to the code:
1. Stop and remove the running container (see above).
2. Rebuild the image:
   ```bash
   docker build -t ai-schedule .
   ```
3. Run the container again (see above).

### 6. Environment Variables
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
- `GET /` — Health check, returns a welcome message.
- `POST /query` — Main endpoint for schedule queries (see code for request format).

## Support
For help, please open an issue in this repository.

## License
Specify your license here.




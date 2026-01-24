# Airbnb Consultation Chatbot Setup Guide

## Overview

The Airbnb Consultation Chatbot is an AI-powered service built on top of the ai-travel framework. It provides helpful guidance to Airbnb users (guests and hosts) by answering questions about platform features, policies, and best practices.

## Configuration

### Environment Variables

Add/update these variables in your `.env` file:

```
# Chatbot Vector Database Path
VECTORDB_PATH_CHAT=./data/vector_db_chat

# Document Processing (smaller chunks for Q&A)
CHUNK_SIZE=500
CHUNK_OVERLAP=100

# Embedding Model
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2

# LLM Configuration (uses existing setup from ai-travel)
OPENAI_API_KEY=your_groq_api_key
```

## File Structure

```
ai-travel/
├── src/
│   ├── data/
│   │   └── guides/
│   │       ├── guest_guide.json        # Guest Q&A
│   │       ├── host_guide.json         # Host Q&A
│   │       └── general_guide.json      # General Q&A
│   ├── features/
│   │   ├── ai_schedule/                # Learning paths (existing)
│   │   └── consultation_chat/          # NEW: Chatbot service
│   │       ├── chatbot_controller.py   # Main chatbot logic
│   │       └── chatbot_router.py       # API endpoints
│   ├── constant/
│   │   ├── ScheduleType.py             # Learning schedule request
│   │   └── ChatbotRequest.py           # NEW: Chatbot request format
│   ├── database/
│   │   ├── Learning_Path.py            # Learning history
│   │   ├── ChatHistory.py              # NEW: Chat history
│   │   └── KnowledgeBase.py            # NEW: FAQ storage
│   └── utils/
│       ├── load_documents.py           # UPDATED: Supports JSON FAQ
│       ├── create_agent.py             # UPDATED: Chatbot mode support
│       ├── vector_store.py             # Vector database operations
│       └── ... (other utils)
├── app.py                              # UPDATED: Includes chatbot router
└── requirements.txt
```

## FAQ Data Format

FAQ documents are stored in JSON format with the following structure:

```json
{
  "category": "guest|host|general",
  "name": "Display Name",
  "description": "Brief description",
  "faqs": [
    {
      "id": "unique_id",
      "question": "Question text?",
      "answer": "Detailed answer with steps and guidance."
    }
  ]
}
```

## API Endpoints

### 1. Ask a Question (Main Endpoint)

**POST** `/chatbot/ask_question`

Request:
```json
{
  "question": "Làm thế nào để tìm kiếm phòng trên Airbnb?",
  "user_type": "guest",
  "category": "search"
}
```

Response:
```json
{
  "answer": "Để tìm kiếm danh sách...",
  "sources": ["Airbnb FAQ Database"],
  "category": "search",
  "user_type": "guest",
  "related_questions": [
    "Làm thế nào để lọc danh sách?",
    "..."
  ]
}
```

### 2. Health Check

**GET** `/chatbot/health`

Response:
```json
{
  "status": "ok",
  "service": "Airbnb Consultation Chatbot",
  "message": "Chatbot service is running"
}
```

## Workflow

1. **User Submits Question**
   - Frontend sends POST request to `/chatbot/ask_question`
   - Includes: question, user_type (guest/host), optional category

2. **Vector Store Initialization**
   - System loads FAQ JSON files from `src/data/guides/`
   - Creates embeddings using SentenceTransformer
   - Stores in ChromaDB at `./data/vector_db_chat`

3. **LLM Agent Processing**
   - Agent retrieves relevant FAQ entries using semantic search
   - LLM generates contextual response using Groq (Llama 3.3 70B)
   - Response is conversational and includes guidance/steps

4. **Chat History Storage**
   - Question and answer saved to MongoDB
   - Metadata stored: user_type, category, sources, confidence

5. **Related Questions Generation**
   - System suggests follow-up questions based on topic
   - Helps users explore related topics

## Adding New FAQ Content

### Step 1: Create/Update FAQ JSON

Edit the relevant guide file in `src/data/guides/`:
- `guest_guide.json` - for guest-related questions
- `host_guide.json` - for host-related questions  
- `general_guide.json` - for general/system questions

### Step 2: Regenerate Vector Store

Delete the existing vector store and restart the service:

```bash
rm -rf ./data/vector_db_chat
npm run start:dev  # or python app.py
```

The system will automatically reload FAQ files and rebuild the vector store.

## Integration with Frontend

### React Hook Example

```typescript
const askChatbot = async (
  question: string,
  userType: "guest" | "host",
  category?: string
) => {
  const response = await fetch("http://localhost:8000/chatbot/ask_question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      user_type: userType,
      category: category || undefined
    })
  });
  
  return response.json();
};
```

### Chat UI Component

The chatbot can be embedded as:
1. **Floating Chat Widget** - Bottom right corner
2. **Chat Tab** - Integrated into messages section
3. **Help Sidebar** - Integrated into host dashboard
4. **Full Page Chat** - Dedicated chatbot interface

## Development Workflow

### Running the Chatbot Server

```bash
cd ai-travel

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn app:app --reload --port 8000
```

### Testing the API

```bash
# Test health check
curl http://localhost:8000/chatbot/health

# Test a question
curl -X POST http://localhost:8000/chatbot/ask_question \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Làm thế nào để tìm kiếm phòng?",
    "user_type": "guest",
    "category": "search"
  }'
```

## Performance Optimization

1. **Vector Store Caching**: Vector store is loaded once and reused
2. **Question Embedding**: Queries are embedded using SentenceTransformer (fast)
3. **LLM Calls**: Groq provides quick responses with streaming support
4. **Database Indexing**: MongoDB indexes on category and subcategory

## Troubleshooting

### Vector Store Not Loading

```bash
# Clear and rebuild
rm -rf ./data/vector_db_chat
python app.py
```

### LLM API Errors

- Check `OPENAI_API_KEY` (Groq API key) is set correctly
- Verify network connectivity to Groq API
- Check API key has sufficient quota

### Memory Issues

- Increase chunk size in `.env` to process fewer, larger chunks
- Reduce the number of concurrent requests
- Use smaller embedding models if available

## API Response Time

- First request: 2-5 seconds (vector store initialization)
- Subsequent requests: 1-3 seconds (query embedding + LLM generation)
- Response quality improves with more FAQ data

## Support

For issues or feature requests, refer to the main ai-travel documentation or project issues.

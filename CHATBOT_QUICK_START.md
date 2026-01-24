# 🚀 Airbnb Chatbot - Quick Start (5 Minutes)

## Before You Start
- Python 3.8+ installed
- Node.js 16+ installed
- MongoDB running
- Groq API key (or configure your LLM)

## Step 1: Start Backend (Terminal 1)

```bash
cd ai-travel

# Configure .env file
# Add: OPENAI_API_KEY=your_groq_api_key
# Add: MONGO_URI=mongodb://localhost:27017/airbnb_db

# Install & Run
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

✅ Wait for: "Uvicorn running on http://127.0.0.1:8000"

## Step 2: Start Frontend (Terminal 2)

```bash
cd frontend_AirBnB

npm install
npm run dev
```

✅ Wait for: "Ready in Xs" message

## Step 3: Open Browser

Navigate to: **http://localhost:3000/host/messages**

## Step 4: Test the Chatbot

1. Click the "Airbnb Tư vấn" conversation (first item, 🤖 avatar)
2. Type: "Làm thế nào để đặt phòng?"
3. Press Enter or click "Gửi"
4. Wait for response (1-3 seconds)
5. Click a related question to continue

## ✅ Success Checklist

- [x] Backend running on port 8000
- [x] Frontend running on port 3000
- [x] Can see messages page
- [x] Can type and send questions
- [x] Chatbot responds in Vietnamese
- [x] Related questions appear

## 📸 What You Should See

```
Left Sidebar            Chat Window
───────────────        ─────────────────────
🤖 Airbnb Tư vấn  →    Airbnb Tư vấn
👤 User 1              Online
👤 User 2              
👤 User 3              You: Làm thế nào để
                        đặt phòng?
                       
                       Bot: Để đặt phòng:
                       1. Tìm kiếm...
                       2. Chọn ngày...
                       3. Nhấp Đặt phòng
                       
                       [Related Questions]
                       [Input Field][Send]
```

## 🆘 Troubleshooting (30 seconds)

| Issue | Quick Fix |
|-------|-----------|
| "Cannot reach chatbot service" | Check backend is running on port 8000 |
| Python module not found | Run: `pip install -r requirements.txt` |
| API key error | Add OPENAI_API_KEY to `.env` |
| MongoDB error | Ensure MongoDB is running |
| Port 3000 already in use | Kill process: `lsof -i :3000` then kill |
| Port 8000 already in use | Kill process: `lsof -i :8000` then kill |

## 📚 Next Steps

1. **Customize chatbot name/avatar**:
   - Edit `frontend_AirBnB/src/app/host/(dashboard)/messages/page.tsx`
   - Change `name: "Airbnb Tư vấn"` and `avatar: "🤖"`

2. **Change API endpoint**:
   - Edit `frontend_AirBnB/src/components/chat/ChatbotWidget.tsx`
   - Change `const CHATBOT_API = '...'`

3. **Add more FAQ content**:
   - Add Q&A pairs to `ai-travel/src/data/guides/*.json`
   - Delete vector store: `rm -rf ai-travel/data/vector_db_chat`
   - Restart backend to rebuild index

4. **Change user type** (for different responses):
   - Edit `ChatbotWidget.tsx`
   - Change `user_type: 'host'` to `'guest'`

5. **Customize colors**:
   - Edit `frontend_AirBnB/src/components/chat/chat.module.css`
   - Change `.userMessage { background: #FF3B30; }` color

## 📖 Full Documentation

For detailed information, see:
- [`CHATBOT_COMPLETE_GUIDE.md`](./CHATBOT_COMPLETE_GUIDE.md) - Complete reference
- [`ai-travel/CHATBOT_SETUP.md`](./ai-travel/CHATBOT_SETUP.md) - Backend setup
- [`frontend_AirBnB/CHATBOT_UI_GUIDE.md`](./frontend_AirBnB/CHATBOT_UI_GUIDE.md) - Frontend guide

## 🎯 Key Features

✅ **36 Vietnamese Q&A pairs** (Guest, Host, General)
✅ **AI-powered responses** (Groq Llama 3.3 70B)
✅ **Vector database search** (ChromaDB)
✅ **Beautiful React UI** (Ant Design)
✅ **Error handling & loading states**
✅ **Related questions suggestions**
✅ **Chat history storage** (MongoDB)

## 🔥 Test Questions

Try these to test different topics:

### For Guests
- "Làm thế nào để tìm kiếm phòng?"
- "Tôi có thể hủy đặt phòng không?"
- "Các phương thức thanh toán nào được chấp nhận?"

### For Hosts
- "Làm thế nào để tạo danh sách?"
- "Làm thế nào để đặt giá phòng?"
- "Khi nào tôi sẽ nhận được thanh toán?"

### General
- "Làm thế nào để bảo vệ tài khoản của tôi?"
- "Chương trình Superhost là gì?"
- "Làm thế nào để xác minh danh tính?"

## 💡 Pro Tips

1. **First load is slow**: First API call builds vector index (~2-5s)
2. **Subsequent calls are faster**: ~1-3s for AI response
3. **Use Shift+Enter**: Add new line in message input
4. **Click related questions**: Auto-fills input with question
5. **Check console**: Press F12 for debugging

## 🎉 Done!

Your Airbnb Chatbot is ready to use! 🚀

Questions? Check the [Complete Guide](./CHATBOT_COMPLETE_GUIDE.md) or troubleshooting sections above.

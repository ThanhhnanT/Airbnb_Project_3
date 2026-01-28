from src.utils.load_documents import load_document
from src.utils.vector_store import load_vector_store, create_vector_store
from dotenv import dotenv_values
from src.utils.custom_emb import create_embeddings
from src.utils.initialize_llms import initialize_llm
from src.utils.create_agent import create_agent
from langchain.memory import ConversationBufferMemory
import sys
import os
from src.constant.ChatbotRequest import ChatbotRequest
import json
import re
from src.database.ChatHistory import ChatHistory
import glob
from rapidfuzz import process

config = dotenv_values(".env")

# Domain keywords for Airbnb chatbot
AIRBNB_KEYWORDS = [
    # Chatbot introduction
    "who are you",
    "what are you",
    "bạn là ai",
    "bạn có thể giúp",
    "trợ lý",
    "chatbot",
    "help me",
    "giúp tôi",
    # Guest related
    "booking",
    "search",
    "listing",
    "price",
    "payment",
    "cancel",
    "refund",
    "review",
    "rating",
    "message",
    "host",
    "check-in",
    "checkout",
    "guest",
    "reserve",
    "accommodation",
    "stay",
    "room",
    "apartment",
    "house",
    "amenities",
    "photo",
    "description",
    "availability",
    "dates",
    # Host related
    "list",
    "listing creation",
    "host",
    "earning",
    "payout",
    "income",
    "guest management",
    "house rules",
    "damage",
    "cleaning",
    "maintenance",
    "calendar",
    "manage",
    "superhost",
    "pricing",
    "discount",
    # General
    "account",
    "profile",
    "password",
    "verification",
    "identity",
    "security",
    "terms",
    "policy",
    "help",
    "support",
    "contact",
    "dispute",
    "complaint",
    "issue",
    "problem",
    # Vietnamese keywords
    "đặt phòng",
    "tìm kiếm",
    "giá",
    "thanh toán",
    "hủy",
    "hoàn tiền",
    "đánh giá",
    "xếp hạng",
    "chủ nhà",
    "khách",
    "danh sách",
    "quản lý",
    "tài khoản",
    "mật khẩu",
    "xác minh",
    "hỗ trợ",
    "chính sách",
    "airbnb",
    "trợ lý",
    "ai",
    "là ai",
]


def is_airbnb_related(question: str, threshold: float = 60) -> bool:
    """
    Check if question is related to Airbnb domain.
    Returns True if question matches Airbnb keywords, False otherwise.
    """
    question_lower = question.lower().strip()

    # Try fuzzy matching with Airbnb keywords
    matches = process.extract(question_lower, AIRBNB_KEYWORDS, limit=3, score_cutoff=threshold)
    
    # Check if question contains any Airbnb keywords
    for keyword in AIRBNB_KEYWORDS:
        if keyword.lower() in question_lower:
            return True

    # If fuzzy matching found matches, it's related
    if matches:
        return True

    return False


def detect_category(question: str, user_type: str) -> str:
    """
    Heuristic-based category detection from question content.
    Giúp phân loại câu hỏi nếu frontend không gửi category.
    """
    q = question.lower()
    u = user_type.lower()

    # Common categories for both
    if any(k in q for k in ["thanh toán", "payment", "payout", "hoàn tiền", "refund"]):
        return "payment"
    if any(k in q for k in ["hủy", "cancel"]):
        return "cancellation"
    if any(k in q for k in ["tài khoản", "account", "mật khẩu", "password"]):
        return "account"

    # Guest-specific
    if u == "guest":
        if any(k in q for k in ["tìm kiếm", "search", "lọc", "filter"]):
            return "search"
        if any(k in q for k in ["đặt phòng", "booking", "reserve"]):
            return "booking"
        if any(k in q for k in ["đánh giá", "review"]):
            return "reviews"

    # Host-specific
    if u == "host":
        if any(k in q for k in ["danh sách", "listing", "tạo danh sách"]):
            return "listing_management"
        if any(k in q for k in ["giá", "pricing", "giá phòng"]):
            return "pricing"
        if any(k in q for k in ["đánh giá", "review", "xếp hạng", "rating", "superhost"]):
            return "rating_optimization"
        if any(k in q for k in ["quy tắc nhà", "house rules"]):
            return "house_rules"
        if any(k in q for k in ["giao tiếp", "tin nhắn", "trả lời khách"]):
            return "communication"

    return "general"


_FAQ_CACHE = None


def load_faq_cache():
    """
    Load all FAQs from guides JSON files into memory (cached).
    Structure: list of dicts with id, question, answer, category.
    """
    global _FAQ_CACHE
    if _FAQ_CACHE is not None:
        return _FAQ_CACHE

    faqs = []
    try:
        guides_path = os.path.join(os.path.dirname(__file__), "../../data/guides")
        json_files = glob.glob(os.path.join(guides_path, "*.json"))

        for json_file in json_files:
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                category = data.get("category", "general")
                for item in data.get("faqs", []):
                    faqs.append(
                        {
                            "id": item.get("id"),
                            "question": item.get("question", ""),
                            "answer": item.get("answer", ""),
                            "category": category,
                        }
                    )
            except Exception as e:
                print(f"Error loading FAQ file {json_file}: {e}")
    except Exception as e:
        print(f"Error initializing FAQ cache: {e}")

    _FAQ_CACHE = faqs
    return _FAQ_CACHE


def get_faq_questions_by_ids(ids: list[str]) -> list[str]:
    """Return FAQ question texts for given ids, in order, skipping missing ones."""
    if not ids:
        return []
    faqs = load_faq_cache()
    if not faqs:
        return []
    by_id = {f.get("id"): f.get("question") for f in faqs if f.get("id") and f.get("question")}
    return [by_id[i] for i in ids if i in by_id]


def find_best_faq_answer(question: str, user_type: str, score_cutoff: float = 88.0):
    """
    Try to find the best matching FAQ for the given question.
    Prioritize FAQs for the corresponding user_type (host/guest).
    Returns dict with answer, faq_id, category, related_questions or None.
    """
    faqs = load_faq_cache()
    if not faqs:
        return None

    q = question.strip().lower()
    user_type_lower = user_type.lower()

    # Filter FAQs by user type category first
    if user_type_lower == "host":
        candidate_faqs = [f for f in faqs if f.get("category") == "host"]
    elif user_type_lower == "guest":
        candidate_faqs = [f for f in faqs if f.get("category") == "guest"]
    else:
        candidate_faqs = faqs

    if not candidate_faqs:
        candidate_faqs = faqs

    questions_list = [f["question"] for f in candidate_faqs if f.get("question")]
    if not questions_list:
        return None

    best = process.extractOne(q, questions_list, score_cutoff=score_cutoff)
    if not best:
        return None

    best_question, score, index = best
    matched_faq = candidate_faqs[index]

    # Related questions: other FAQs in same category
    related_questions = [
        f["question"]
        for f in candidate_faqs
        if f.get("id") != matched_faq.get("id") and f.get("question")
    ][:3]

    return {
        "answer": matched_faq.get("answer", ""),
        "faq_id": matched_faq.get("id"),
        "category": matched_faq.get("category", "general"),
        "related_questions": related_questions,
    }


def is_who_are_you_question(question: str) -> bool:
    """Detect questions asking 'who are you' / giới thiệu bản thân bot."""
    q = question.lower().strip()
    patterns = [
        "bạn là ai",
        "mày là ai",
        "who are you",
        "what are you",
        "bạn là chatbot gì",
    ]
    return any(p in q for p in patterns)


def clean_agent_response(raw: str) -> str:
    """
    Làm sạch output từ agent:
    - Loại bỏ các dòng Thought/Action/Observation/Question/Danh mục.
    - Trả về câu trả lời tiếng Việt tự nhiên cho người dùng.
    """
    if not raw:
        return raw

    lines = str(raw).splitlines()
    cleaned_lines = []
    skip_prefixes = ("Thought:", "Action:", "Observation:", "Question:", "Danh mục:")

    for line in lines:
        stripped = line.strip()
        if not stripped:
            # Giữ lại khoảng trắng cơ bản để không dính đoạn văn
            cleaned_lines.append("")
            continue
        if any(stripped.startswith(p) for p in skip_prefixes):
            continue
        # Bỏ dấu '>' hoặc log agent
        if stripped.startswith("> Entering new AgentExecutor chain"):
            continue
        cleaned_lines.append(stripped)

    cleaned = "\n".join(cleaned_lines).strip()
    # Nếu sau khi clean vẫn rỗng, trả về bản gốc
    return cleaned or raw


def initialize_chatbot_vector_store():
    """Initialize or load the chatbot vector store from FAQ JSON files"""
    try:
        embeddings = create_embeddings()
        vector_db_path = config.get('VECTORDB_PATH_CHAT', './data/vector_db_chat')
        
        # Check if vector store already exists
        if os.path.exists(vector_db_path):
            print(f"Loading existing vector store from {vector_db_path}")
            vector_store = load_vector_store(db_path=vector_db_path, embeddings=embeddings)
        else:
            print(f"Creating new vector store at {vector_db_path}")
            # Load all FAQ JSON files
            documents = []
            guides_path = os.path.join(os.path.dirname(__file__), "../../data/guides")
            
            json_files = glob.glob(os.path.join(guides_path, "*.json"))
            print(f"Found {len(json_files)} FAQ files to load")
            
            for json_file in json_files:
                print(f"Loading FAQ from {json_file}")
                docs = load_document(json_file)
                if docs:
                    documents.extend(docs)
                    print(f"Loaded {len(docs)} Q&A pairs from {os.path.basename(json_file)}")
            
            if not documents:
                print("Warning: No documents loaded for vector store")
                return None
            
            print(f"Creating vector store with {len(documents)} total documents")
            vector_store = create_vector_store(documents, embeddings, db_path=vector_db_path)
        
        return vector_store
    
    except Exception as e:
        print(f"Error initializing chatbot vector store: {e}")
        return None

def answer_question(req: ChatbotRequest):
    """
    Answer user questions about Airbnb using the chatbot agent.
    
    Args:
        req: ChatbotRequest containing question, user_type, and optional category
    
    Returns:
        Dictionary with answer, sources, and metadata
    """
    print(f"Processing chatbot request: question='{req.question}' user_type='{req.user_type}' category={req.category}")

    # Special friendly answer for "bạn là ai" type questions
    if is_who_are_you_question(req.question):
        # Gợi ý từ chính bộ FAQ
        if req.user_type.lower() == "host":
            suggested_questions = get_faq_questions_by_ids(
                ["host_001", "host_004", "host_012"]
            )
        else:
            suggested_questions = get_faq_questions_by_ids(
                ["guest_001", "guest_005", "guest_006"]
            )

        intro_answer = (
            "Mình là trợ lý tư vấn Airbnb, được thiết kế để hỗ trợ Host và Guest bằng tiếng Việt.\n\n"
            "- Mình có thể giải thích quy trình đặt phòng, huỷ/hoàn tiền, thanh toán.\n"
            "- Gợi ý cách tối ưu danh sách, giá phòng, trải nghiệm khách.\n"
            "- Hỗ trợ trả lời các câu hỏi thường gặp dựa trên tài liệu hướng dẫn cho chủ nhà và khách.\n\n"
            "Bạn đang là "
            f"{'chủ nhà (Host)' if req.user_type.lower() == 'host' else 'khách (Guest)'}"
            " — bạn muốn mình hỗ trợ chủ đề nào trước?"
        )
        try:
            chat_record = ChatHistory(
                user_type=req.user_type.lower(),
                question=req.question,
                answer=intro_answer,
                category="introduction",
                sources=[],
                confidence={
                    "model": "intro_static",
                    "timestamp": str(__import__("datetime").datetime.now()),
                },
            )
            chat_record.save()
        except Exception as e:
            print(f"Error saving intro chat history: {e}")

        return {
            "answer": intro_answer,
            "sources": [],
            "category": "introduction",
            "user_type": req.user_type,
            "related_questions": suggested_questions[:3],
        }

    # Check if question is Airbnb-related
    if not is_airbnb_related(req.question):
        print(f"Question out of scope: {req.question}")
        out_of_scope_response = {
            "answer": "Xin lỗi! 😊 Câu hỏi của bạn ngoài phạm vi của tôi. Tôi chỉ hỗ trợ các câu hỏi liên quan đến Airbnb.\n\nVui lòng liên hệ **Chăm sóc khách hàng Airbnb** để được hỗ trợ tốt hơn:\n📧 Email: support@airbnb.com\n📞 Hotline: 1-844-234-2500\n🌐 Website: help.airbnb.com",
            "sources": [],
            "category": "out_of_scope",
            "user_type": req.user_type,
            "related_questions": []
        }
        
        # Save out-of-scope query to history
        try:
            chat_record = ChatHistory(
                user_type=req.user_type.lower(),
                question=req.question,
                answer=out_of_scope_response["answer"],
                category="out_of_scope",
                sources=[],
                confidence={
                    "model": "filter",
                    "timestamp": str(__import__("datetime").datetime.now()),
                },
            )
            chat_record.save()
        except Exception as e:
            print(f"Error saving chat history: {e}")
        
        return out_of_scope_response

    # Try to answer directly from FAQ database (exact / fuzzy match)
    faq_match = find_best_faq_answer(req.question, req.user_type)
    if faq_match:
        try:
            chat_record = ChatHistory(
                user_type=req.user_type.lower(),
                question=req.question,
                answer=faq_match["answer"],
                category=faq_match.get("category", "faq"),
                sources=[f"faq:{faq_match.get('category')}:{faq_match.get('faq_id')}"],
                confidence={
                    "model": "faq_lookup",
                    "timestamp": str(__import__("datetime").datetime.now()),
                },
            )
            chat_record.save()
        except Exception as e:
            print(f"Error saving FAQ-based chat history: {e}")

        return {
            "answer": faq_match["answer"],
            "sources": [f"faq:{faq_match.get('category')}:{faq_match.get('faq_id')}"],
            "category": faq_match.get("category", "faq"),
            "user_type": req.user_type,
            "related_questions": faq_match.get("related_questions", []),
        }

    try:
        # Initialize embeddings and vector store
        embeddings = create_embeddings()
        vector_store = initialize_chatbot_vector_store()

        if vector_store is None:
            return {
                "error": "Vector store not initialized",
                "answer": "Xin lỗi, không thể khởi tạo cơ sở dữ liệu. Vui lòng thử lại.",
            }

        # Initialize LLM and agent
        llm = initialize_llm()
        memory = ConversationBufferMemory(memory_key="chat_history", input_key="input")

        # Detect category if frontend did not provide one
        effective_category = req.category or detect_category(req.question, req.user_type)

        # Create chatbot agent with 'chatbot' mode
        agent = create_agent(
            domain="airbnb",
            level="general",
            llm=llm,
            vector_store=vector_store,
            memory=memory,
            mode="chatbot",
        )

        # Prepare the prompt for the agent
        user_type_text = "khách hàng (guest)" if req.user_type.lower() == "guest" else "chủ nhà (host)"

        prompt = f"""
        Bạn là một trợ lý tư vấn Airbnb. Người dùng là một {user_type_text}.
        
        Câu hỏi của người dùng: "{req.question}"
        """

        if effective_category:
            prompt += f"\nDanh mục: {effective_category}"

        prompt += """
        
        HƯỚNG DẪN:
        - Sử dụng các công cụ (retrieval tools) để tìm thông tin liên quan từ cơ sở dữ liệu Airbnb.
        - Cung cấp câu trả lời chi tiết, thân thiện và hữu ích bằng tiếng Việt.
        - Nếu thông tin không khả dụng, hãy nói rõ ràng và đề xuất các cách khác.
        - Luôn cung cấp các bước cụ thể nếu đó là hướng dẫn.
        - Kết thúc bằng câu hỏi theo dõi để giúp người dùng thêm nữa.
        """

        # Run the agent
        raw_response = agent.run(prompt.strip())
        response = clean_agent_response(raw_response)

        # Parse response and extract sources
        sources = []
        if "retrieval_" in response.lower():
            sources = ["Airbnb FAQ Database"]

        # Save to chat history
        chat_record = ChatHistory(
            user_type=req.user_type.lower(),
            question=req.question,
            answer=response,
            category=effective_category,
            sources=sources,
            confidence={
                "model": "groq-llama3.3",
                "timestamp": str(__import__("datetime").datetime.now()),
            },
        )
        chat_record.save()

        return {
            "answer": response,
            "sources": sources,
            "category": effective_category,
            "user_type": req.user_type,
            "related_questions": generate_related_questions(req.question, req.user_type),
        }
    
    except Exception as e:
        print(f"Error processing chatbot request: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "answer": "Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
            "user_type": req.user_type
        }

def generate_related_questions(question: str, user_type: str) -> list:
    """
    Generate related questions based on the user's question and type.
    Lấy trực tiếp từ bộ FAQ trong thư mục guides để đảm bảo câu hỏi gợi ý khớp với data.
    """
    faqs = load_faq_cache()
    if not faqs:
        return []

    q = question.lower().strip()
    user_type_lower = user_type.lower()

    # Lọc theo loại user
    if user_type_lower == "host":
        candidate_faqs = [f for f in faqs if f.get("category") == "host"]
    elif user_type_lower == "guest":
        candidate_faqs = [f for f in faqs if f.get("category") == "guest"]
    else:
        candidate_faqs = faqs

    if not candidate_faqs:
        candidate_faqs = faqs

    questions_list = [f.get("question", "") for f in candidate_faqs if f.get("question")]
    if not questions_list:
        return []

    # Lấy top 4 câu hỏi liên quan nhất, sau đó loại câu giống hệt câu đang hỏi
    matches = process.extract(q, questions_list, limit=4)
    related = []
    for matched_question, score, _ in matches:
        if matched_question.lower().strip() == q:
            continue
        related.append(matched_question)
        if len(related) >= 3:
            break

    return related

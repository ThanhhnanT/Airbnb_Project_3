from src.utils.load_documents import load_document
from src.utils.vector_store import load_vector_store, create_vector_store
from dotenv import dotenv_values
from src.utils.custom_emb import create_embeddings
from src.utils.initialize_llms import initialize_llm
from src.utils.create_agent import create_agent
from src.utils.learning_path import create_learning_path, create_roadmap
from langchain.memory import ConversationBufferMemory
import sys
import os
from src.constant import ScheduleType
import json
import re
from src.database.RoadMap_Schema import RoadMap
from src.database.Learning_Path import LearningPath
from src.utils.get_domain import get_domain


config = dotenv_values(".env")
def GenSchedule(req: ScheduleType):
    print(req)
    try:
        # base_path = "data/questions/AI_Engineer"
        # documents= []
        #
        # for root, dirs, files in os.walk(base_path):
        #     for file in files:
        #         if file.endswith(".json"):
        #             path = os.path.join(root, file)
        #             parts = path.split(os.sep)
        #
        #             if len(parts) >= 5:
        #                 domain = parts[3].strip().lower()  # 'computer vision'
        #                 level = parts[4].strip().lower()  # 'advance'
        #                 file_type = os.path.splitext(file)[0].strip()  # 'Theory'
        #             else:
        #                 continue
        #
        #             # Load tài liệu với metadata
        #             docs = load_document(path, level=level, domain=domain)
        #             if docs:
        #                 # Thêm file_type vào metadata
        #                 for doc in docs:
        #                     doc.metadata["file_type"] = file_type
        #                 documents.extend(docs)
        #                 print(
        #                     f"Loaded {len(docs)} chunks from {path} (domain={domain}, level={level}, file_type={file_type})")
        #
        # if not documents:
        #     print("No documents loaded.")
        #     return {"error": "No documents loaded"}

        user_knowledge = req.level.lower()
        learning_goal = req.goal
        domain = get_domain(learning_goal)
        print("Domain:", domain)


        embeddings = create_embeddings()
        if os.path.exists(config['VECTORDB_PATH']):
            vector_store = load_vector_store(db_path=config['VECTORDB_PATH'], embeddings=embeddings)
        else:
            vector_store = create_vector_store(documents, embeddings)


        # --- LLM, Agent ---
        llm = initialize_llm()
        memory = ConversationBufferMemory(memory_key="chat_history", input_key="input")
        agent = create_agent(domain,user_knowledge,llm, vector_store, memory)

        # --- Create learning path ---

        roadmap = create_roadmap(agent, learning_goal, user_knowledge)

        if roadmap.startswith("```"):
            roadmap = re.sub(r"^```[a-zA-Z]*\n?", "", roadmap)
            roadmap = re.sub(r"```$", "", roadmap)
        roadmap= json.loads(roadmap)
        learning_path = []
        day = 1
        for key, skill in roadmap["skills"].items():
            for subskill in skill:
                schedule_of_day= create_learning_path(agent, skill= key, subskill=subskill, level=user_knowledge, day=day)
                if schedule_of_day.startswith("```"):
                    schedule_of_day = re.sub(r"^```[a-zA-Z]*\n?", "", schedule_of_day)
                    schedule_of_day = re.sub(r"```$", "", schedule_of_day)
                schedule_of_day = json.loads(schedule_of_day)
                learning_path.append(schedule_of_day)
                if day ==3:
                    break
                day += 1
            break


        roadmap = RoadMap(
            goal=req.goal,
            level=req.level,
            description=req.discription,
            estimated_hours=req.estimated_hours,
            skills=roadmap["skills"]
        )
        # print(roadmap)
        roadmap.save()
        print(RoadMap)
        schedule = LearningPath(
            schedule = learning_path
        )
        schedule.save()
        print("Schedule")

        return {
            "skills": roadmap["skills"],
            "learning_path": learning_path
        }

    except Exception as e:
        print(f"Unexpected error: {e}")
        return {"error": str(e)}

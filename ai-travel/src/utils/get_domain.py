from langchain.prompts import PromptTemplate
from src.utils.initialize_llms import initialize_llm
from langchain.chains import LLMChain
from rapidfuzz import process

def get_domain(text: str):
    DOMAIN_SYNONYMS = {
        "computer vision": ["cv", "comput vision", "comp vision", "vision"],
        "nlp": ["natural language processing", "language ai", "text ai"],
        "machine learning": ["ml", "machine learn", "machin learning"],
    }

    llm = initialize_llm()

    prompt = PromptTemplate(
        input_variables=["user_input"],
        template="""
    Extract the main domain or topic from the following sentence and return only that keyword or phrase in English:
    "{user_input}"
    """
    )

    chain = LLMChain(llm=llm, prompt=prompt)

    result = chain.run({"user_input": text})
    result = result.lower().strip()

    all_labels = list(DOMAIN_SYNONYMS.keys())
    for synonyms in DOMAIN_SYNONYMS.values():
        all_labels.extend(synonyms)

    # Fuzzy match
    best_match, score, _ = process.extractOne(result, all_labels)

    if score > 70:
        for domain, synonyms in DOMAIN_SYNONYMS.items():
            if best_match == domain or best_match in synonyms:
                return domain

    return None
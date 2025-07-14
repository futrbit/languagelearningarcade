from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field, validator
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import AsyncOpenAI  # Use async client
from firebase_admin import credentials, auth, initialize_app
import httpx
import os
import time
import logging
import redis
from datetime import date, datetime, timedelta
import re
import markdown
import bleach

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Initialize Firebase Admin SDK
import json
firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

if not firebase_json:
    logger.error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set.")
    raise FileNotFoundError("Missing Firebase credentials in environment variable.")

try:
    firebase_credentials_dict = json.loads(firebase_json)
    cred = credentials.Certificate(firebase_credentials_dict)
    initialize_app(cred)
    logger.info("Firebase initialized from environment variable.")
except Exception as e:
    logger.error(f"Firebase initialization failed: {e}")
    raise SystemExit("Firebase initialization failed.")

except Exception as e:
    logger.error(f"Failed to initialize Firebase: {e}")
    raise SystemExit("Firebase initialization failed.")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    logger.error("OPENAI_API_KEY not set.")
    raise ValueError("OPENAI_API_KEY not set.")

# Explicitly create httpx client without proxies
http_client = httpx.AsyncClient(
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    timeout=30.0,
    follow_redirects=True
)
client = AsyncOpenAI(api_key=openai_api_key, http_client=http_client)

@app.on_event("shutdown")
async def shutdown_event():
    await http_client.aclose()
    logger.info("HTTP client closed on shutdown.")

# Initialize Redis client (Redis Cloud with SSL)
redis_client = None
try:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        username=os.getenv("REDIS_USERNAME", "default"),  # Required for Redis Cloud
        password=os.getenv("REDIS_PASSWORD"),             # Required for Redis Cloud
        decode_responses=True,
        ssl=True                                           # VERY IMPORTANT for Redis Cloud
    )
    redis_client.ping()
    logger.info("Successfully connected to Redis.")
except redis.exceptions.ConnectionError as e:
    logger.warning(f"Could not connect to Redis: {e}. Falling back to in-memory rate limiting.")


# In-memory fallback for rate limiting
fallback_limits = {}

# Authentication Dependency
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing Authorization header. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    try:
        decoded = auth.verify_id_token(token)
        return {"user_id": decoded["uid"]}
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Rate Limiting Function
def check_api_limit(user_id: str, endpoint: str) -> int:
    today = date.today().isoformat()
    key = f"{endpoint}_calls:{user_id}:{today}"
    max_calls_per_day = 5

    if redis_client:
        try:
            calls = redis_client.get(key)
            calls = int(calls) if calls else 0
        except redis.exceptions.RedisError:
            logger.warning(f"Redis unavailable, using fallback for {key}")
            calls = fallback_limits.get(key, 0)
    else:
        calls = fallback_limits.get(key, 0)

    if calls >= max_calls_per_day:
        raise HTTPException(
            status_code=429,
            detail=f"Daily {endpoint} limit ({max_calls_per_day}) reached. Try again tomorrow or upgrade to premium!",
            headers={"X-Remaining-Calls": "0"}
        )

    if redis_client:
        try:
            redis_client.incr(key)
            next_day = date.today() + timedelta(days=1)
            expire_time = int(datetime.combine(next_day, datetime.min.time()).timestamp())
            redis_client.expireat(key, expire_time)
        except redis.exceptions.RedisError:
            fallback_limits[key] = fallback_limits.get(key, 0) + 1
    else:
        fallback_limits[key] = fallback_limits.get(key, 0) + 1

    return max_calls_per_day - (calls + 1)

# Pydantic Models
class ClassRequest(BaseModel):
    student_level: str = Field(..., pattern="^(A1|A2|B1|B2|C1|C2)$")
    skill_focus: str = Field(..., pattern="^(Speaking|Grammar|Vocabulary|Writing|Reading)$")
    teacher: str = Field(..., pattern="^(Emma|Liam|Olivia|Noah|Sophia)$")
    reason: str
    age: int = Field(..., ge=5, le=100)
    module_lesson: int = Field(default=0, ge=0, le=5)
    used_phrases: list = []
    used_vocab: list = []

    @validator("reason")
    def sanitize_reason(cls, v):
        return bleach.clean(v, tags=[], strip=True)

class AnswerRequest(BaseModel):
    answer: str
    class_plan: str
    student_level: str = Field(..., pattern="^(A1|A2|B1|B2|C1|C2)$")
    skill_focus: str = Field(..., pattern="^(Speaking|Grammar|Vocabulary|Writing|Reading)$")
    reason: str

    @validator("reason", "answer", "class_plan")
    def sanitize_inputs(cls, v):
        return bleach.clean(v, tags=["b", "strong", "i", "em"], strip=True)

# Routes
@app.get("/")
async def root():
    return {"message": "Language Arcade Backend is running!"}

@app.get("/about")
async def get_about(user: dict = Depends(get_current_user)):
    try:
        content = (
            "Welcome to the Language Learning Arcade! 🎮\n\n"
            "We’re all about making language learning fun, engaging, and effective. Our AI-powered lessons, gamified progress tracking, and personalized feedback help you master English for travel, business, or personal growth. Join our arcade and level up your skills! 🚀"
        )
        logger.info(f"User {user['user_id']} - Fetched About content")
        return {"content": content}
    except Exception as e:
        logger.error(f"User {user['user_id']} - Error fetching About content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching About content: {str(e)}")

@app.get("/remaining-calls")
async def get_remaining_calls_endpoint(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    today = date.today().isoformat()
    max_calls_per_day = 5
    generate_key = f"generate_calls:{user_id}:{today}"
    submit_key = f"submit_calls:{user_id}:{today}"
    
    if redis_client:
        try:
            generate_calls = redis_client.get(generate_key) or 0
            submit_calls = redis_client.get(submit_key) or 0
        except redis.exceptions.RedisError:
            generate_calls = fallback_limits.get(generate_key, 0)
            submit_calls = fallback_limits.get(submit_key, 0)
    else:
        generate_calls = fallback_limits.get(generate_key, 0)
        submit_calls = fallback_limits.get(submit_key, 0)
    
    generate_calls = int(generate_calls)
    submit_calls = int(submit_calls)
    
    remaining = {
        "generate": max_calls_per_day - generate_calls,
        "submit": max_calls_per_day - submit_calls
    }
    logger.info(f"User {user_id} - Remaining calls: {remaining}")
    return {"remaining_calls": remaining}

@app.post("/generate-class")
async def generate_class(req: ClassRequest, user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    try:
        remaining_calls = check_api_limit(user_id, "generate")
        logger.info(f"User {user_id} - Generating class: {req.dict()}")
        start_time = time.time()

        teacher_styles = {
            "Emma": "narrative-driven lessons with characters and plots",
            "Liam": "interactive challenges and puzzles",
            "Olivia": "practical real-world scenarios",
            "Noah": "conversational practice with role-play scenarios",
            "Sophia": "lessons incorporating songs and rhymes, especially engaging for younger learners",
        }
        teacher_style = teacher_styles.get(req.teacher, "a general teaching style, clear and encouraging")
        age_group = "young learner" if req.age < 12 else "teenager" if 12 <= req.age <= 17 else "adult"
        reason_context = f"learning English for {req.reason.lower()}" if req.reason else "general improvement"

        video_links = {
            "travel": {
                "A1-A2": "https://www.youtube.com/watch?v=R9j00yG2yT4",
                "B1-B2": "https://www.youtube.com/watch?v=Fj-0gT8vWl0",
                "C1-C2": "https://www.youtube.com/watch?v=ZfJ006K6C5c"
            },
            "business": {
                "A1-A2": "https://www.youtube.com/watch?v=sI9f9jT20K4",
                "B1-B2": "https://www.youtube.com/watch?v=4b2C8t17G2Q",
                "C1-C2": "https://www.youtube.com/watch?v=yW6gqV3L4hM"
            },
            "personal growth": {
                "A1-A2": "https://www.youtube.com/watch?v=w_rM9M0lT7A",
                "B1-B2": "https://www.youtube.com/watch?v=Xh0o-M5-S1M",
                "C1-C2": "https://www.youtube.com/watch?v=ZfJ006K6C5c"
            }
        }
        module_reason = "business" if "business" in req.reason.lower() else "travel" if "travel" in req.reason.lower() else "personal growth"
        level_key = "A1-A2" if req.student_level in ["A1", "A2"] else "B1-B2" if req.student_level in ["B1", "B2"] else "C1-C2"
        youtube_link = video_links.get(module_reason, {}).get(level_key, None)

        skill_exercises = {
            "Speaking": """
            - Conversation Starter: Record a phrase with a specific tone (🎙).
            - Dialogue Completion: Write 5 responses to a prompt.
            - Example Sentences: [Teacher] says: Record 5-10 open-ended questions (🎙 for each).
            """,
            "Grammar": """
            - Sentence Correction: Fix 5 sentences with errors.
            - Gap-Fill: Complete sentences with correct forms.
            - Example Sentences: [Teacher] says: Write 5-10 sentences using a specific grammar point.
            """,
            "Vocabulary": """
            - Synonym Matching: Match 4 words to synonyms.
            - Sentence Creation: Write sentences for 2 words.
            - Example Sentences: [Teacher] says: Write 8 sentences using each vocabulary word.
            """,
            "Writing": """
            - Paragraph Writing: Write a short paragraph.
            - Email Composition: Draft a short email.
            - Example Sentences: [Teacher] says: Write 5 sentences for a specific purpose.
            """,
            "Reading": f"""
            - Reading Passage: Provide a short paragraph (50-100 words) relevant to {req.student_level} level and {reason_context}.
            - Summarizing: Summarize the provided paragraph in 2-3 sentences.
            - Questions: Answer 5 comprehension questions based on the provided paragraph.
            - Example Sentences: [Teacher] says: Write 5 sentences summarizing the paragraph.
            """
        }

        avoid_phrases = ', '.join(bleach.clean(phrase, tags=[], strip=True) for phrase in req.used_phrases) if req.used_phrases else 'none'
        avoid_vocab = ', '.join(bleach.clean(word, tags=[], strip=True) for word in req.used_vocab) if req.used_vocab else 'none'

        prompt = f"""
You are {req.teacher}, an engaging ESL teacher teaching a {req.student_level} level class focused on {req.skill_focus} for {reason_context}. The student is a {age_group} (age {req.age}). Use {teacher_style}.

Generate a unique lesson plan in markdown with these sections:
## Welcome
A fun greeting with a clear objective for {req.skill_focus} (use **bold**, emojis 🚀).
## Mini-lesson
Key concepts in a table (3 columns, e.g., | Strategy | Phrase | Why It Works |). **Common Pitfall**: A bolded tip.
## Quick Check
Drag-and-drop with 4 phrases in 2 categories. Avoid: {avoid_phrases}.
## Interactive Practice
🎙 Skill-specific scenario. **[AI Feedback]** placeholder.
## Role-Play Challenge
🎙 Solo scenario. **[AI Feedback]** placeholder.
## Practice Task
Skill-specific writing task.
## Exercises
{skill_exercises.get(req.skill_focus, '')}
Avoid: {avoid_phrases}.
## Video
[{req.skill_focus.title()} Video]({youtube_link}) relevant to {req.skill_focus}/{req.reason} (omit if no video available).
## Vocabulary
Table with 8+ unique words. Avoid: {avoid_vocab}.
## Badge
🏅 **[Unique badge name tied to {req.skill_focus}]**
## Feedback
Personalized feedback placeholder.

Friendly tone. Markdown format.
"""

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            response_time = time.time() - start_time
            logger.info(f"User {user_id} - OpenAI response received in {response_time:.2f} seconds.")
        except Exception as e:
            logger.error(f"User {user_id} - OpenAI error: {str(e)}")
            if "rate_limit" in str(e).lower():
                raise HTTPException(status_code=429, detail="OpenAI rate limit exceeded. Try again later.")
            raise HTTPException(status_code=503, detail=f"OpenAI service unavailable: {str(e)}")

        class_plan = response.choices[0].message.content or "No lesson plan generated."
        class_plan = bleach.clean(class_plan, tags=["b", "strong", "i", "em", "a"], attributes={"a": ["href"]}, strip=True)
        badge_match = re.search(r'## Badge\n.*?🏅 \*\*(.*?)\*\*', class_plan, re.DOTALL)
        badge = badge_match.group(1) if badge_match else "Lesson Star"

        return {"class_plan": class_plan, "badge": badge, "remaining_calls": remaining_calls}
    except redis.exceptions.RedisError as e:
        logger.error(f"User {user_id} - Redis error: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable: Database error")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"User {user_id} - Error generating class: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate class: {str(e)}")

@app.post("/submit-answer")
async def submit_answer(req: AnswerRequest, user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    try:
        remaining_calls = check_api_limit(user_id, "submit")
        logger.info(f"User {user_id} - Received answer submission.")
        prompt = f"""
Evaluate the following answer for a {req.student_level} level {req.skill_focus} lesson for {req.reason}:
Student's Answer: {req.answer}
Contextual Class Plan:
{req.class_plan}
Provide 2-3 sentences of constructive feedback in markdown, focusing on {req.skill_focus} skills.
"""
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
        except Exception as e:
            logger.error(f"User {user_id} - OpenAI error: {str(e)}")
            if "rate_limit" in str(e).lower():
                raise HTTPException(status_code=429, detail="OpenAI rate limit exceeded. Try again later.")
            raise HTTPException(status_code=503, detail=f"OpenAI service unavailable: {str(e)}")

        feedback = response.choices[0].message.content or "No feedback generated."
        feedback = bleach.clean(feedback, tags=["b", "strong", "i", "em"], strip=True)
        logger.info(f"User {user_id} - Feedback generated: {feedback[:50]}...")

        return {"feedback": feedback, "remaining_calls": remaining_calls}
    except redis.exceptions.RedisError as e:
        logger.error(f"User {user_id} - Redis error: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable: Database error")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"User {user_id} - Error submitting answer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")

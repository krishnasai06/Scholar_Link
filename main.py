import os
import uvicorn
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid
import numpy as np

# Import schemas and database helpers
from models.schema import (
    UserRegister, UserLogin, UserResponse,
    StudentProfileSchema, ProjectCreateSchema, ProjectResponse,
    ApplicationCreateSchema, ApplicationResponse, MatchResponse
)
from database import (
    get_document, get_documents, set_document, add_document,
    query_documents, firebase_enabled
)

app = FastAPI(title="SRM ScholarLink API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Sentence Transformers model lazily
model = None
model_loaded = False

try:
    print("[AI MATCHING] Attempting to load sentence-transformers (all-MiniLM-L6-v2)...")
    from sentence_transformers import SentenceTransformer
    # Set cache folder inside the workspace
    os.environ["SENTENCE_TRANSFORMERS_HOME"] = os.path.join(os.path.dirname(__file__), ".cache")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    model_loaded = True
    print("[AI MATCHING] SentenceTransformer model loaded successfully.")
except Exception as e:
    print(f"[AI MATCHING WARNING] Could not load SentenceTransformer: {e}. Using deterministic keyword-based matching fallback.")

# Gemini API setup for Explainable AI
gemini_available = False
try:
    import google.generativeai as genai
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        genai.configure(api_key=gemini_key)
        gemini_available = True
        print("[AI EXPLANATION] Gemini API configured successfully.")
    else:
        print("[AI EXPLANATION] GEMINI_API_KEY not found in env. Falling back to local template explanations.")
except Exception as e:
    print(f"[AI EXPLANATION WARNING] Gemini library not loaded: {e}. Falling back to local template explanations.")


# Helper: Synthesis of Student Profile text for embedding
def synthesize_student_profile(profile: dict, user: dict) -> str:
    parts = []
    if user:
        parts.append(f"Name: {user.get('name', '')}. Department: {user.get('department', '')}.")
    parts.append(f"Skills: {', '.join(profile.get('skills', []))}.")
    parts.append(f"Programming Languages: {', '.join(profile.get('programmingLanguages', []))}.")
    parts.append(f"Interests: {', '.join(profile.get('interests', []))}.")
    parts.append(f"Coursework: {', '.join(profile.get('coursework', []))}.")
    parts.append(f"Project Experience: {profile.get('projectExperience', '')}.")
    parts.append(f"Research Interests: {profile.get('researchInterests', '')}.")
    return " ".join(parts)


# Helper: Synthesis of Project text for embedding
def synthesize_project(project: dict) -> str:
    return f"Title: {project.get('title', '')}. Domain: {project.get('domain', '')}. " \
           f"Type: {project.get('type', '')}. Required Skills: {', '.join(project.get('requiredSkills', []))}. " \
           f"Description: {project.get('description', '')}."


# Helper: Cosine Similarity calculation
def calculate_cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm_a = np.linalg.norm(vec1)
    norm_b = np.linalg.norm(vec2)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))


# Helper: Deterministic Local Explanation Generator
def generate_local_explanation(student_name: str, project_title: str, match_score: float, matched_skills: list, gaps: list, profile: dict) -> str:
    score_pct = int(match_score * 100)
    
    if len(matched_skills) > 0:
        skills_str = ", ".join(matched_skills[:3])
        if len(matched_skills) > 3:
            skills_str += f" and {len(matched_skills) - 3} more"
        skills_phrase = f"possesses core required skills like {skills_str}"
    else:
        skills_phrase = "has a diverse background, though lacking direct required skills"

    gap_phrase = ""
    if len(gaps) > 0:
        gaps_str = ", ".join(gaps[:2])
        gap_phrase = f" Expanding familiarity with {gaps_str} would elevate compatibility."

    experience_ref = ""
    if profile.get("projectExperience") and len(profile.get("projectExperience")) > 10:
        experience_ref = " Their past project experience aligns well with the practical execution of this work."

    explanation = (
        f"{student_name} is a strong candidate for '{project_title}' (Match Score: {score_pct}%). "
        f"They are a solid match because the student {skills_phrase}.{experience_ref}"
        f"{gap_phrase} Overall, their academic profile and research interests match the project's scope."
    )
    return explanation


# Helper: Gemini Explanation Generator
def generate_gemini_explanation(student_name: str, project_title: str, match_score: float, matched_skills: list, gaps: list, student_summary: str, project_summary: str) -> str:
    if not gemini_available:
        return None
    try:
        prompt = (
            f"You are an academic collaboration assistant at SRM University. Explain why a student is matched to a research project.\n"
            f"Student Name: {student_name}\n"
            f"Project Title: {project_title}\n"
            f"Match Score: {int(match_score * 100)}%\n"
            f"Matching Skills: {matched_skills}\n"
            f"Skill Gaps: {gaps}\n\n"
            f"Student Profile Details: {student_summary}\n\n"
            f"Project Description Details: {project_summary}\n\n"
            f"Write a professional, encouraging 2-4 sentence explanation highlighting why the student is a good fit, "
            f"referencing their skills and how they relate to the project. Gently mention if there are key gaps they need to bridge. Keep it concise."
        )
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[GEMINI ERROR] Failed to generate explanation: {e}. Falling back to local template.")
        return None


# Matching Logic: Semantic score + skill intersections
def perform_match(student_id: str, project_id: str) -> dict:
    student_user = get_document("users", student_id)
    student_profile = get_document("studentProfiles", student_id)
    project = get_document("projects", project_id)

    if not student_user or not student_profile or not project:
        raise HTTPException(status_code=404, detail="Student user, student profile, or project not found.")

    # Calculate skill intersections and gaps
    student_skills = set([s.lower() for s in student_profile.get("skills", [])])
    required_skills = project.get("requiredSkills", [])
    
    matched_skills = []
    gaps = []
    for req in required_skills:
        if req.lower() in student_skills:
            matched_skills.append(req)
        else:
            gaps.append(req)

    # Compute similarity score
    student_text = synthesize_student_profile(student_profile, student_user)
    project_text = synthesize_project(project)

    # 1. Semantic Embedding Similarity
    semantic_score = 0.0
    if model_loaded:
        try:
            embeddings = model.encode([student_text, project_text])
            semantic_score = calculate_cosine_similarity(embeddings[0], embeddings[1])
            # Map cosine similarity (typically 0.2 - 0.9) to a 0.5 - 0.98 scale for better demo UX
            semantic_score = 0.5 + (semantic_score * 0.5)
            semantic_score = min(max(semantic_score, 0.0), 1.0)
        except Exception as e:
            print(f"[AI MATCHING ERROR] Embedding failure: {e}")
            semantic_score = 0.0

    # 2. Keyword/Skill Overlap Score
    overlap_score = 0.0
    if len(required_skills) > 0:
        overlap_score = len(matched_skills) / len(required_skills)

    # 3. CGPA Factor (slight boost for high CGPA)
    cgpa_factor = float(student_profile.get("cgpa", 8.0)) / 10.0
    cgpa_factor = min(max(cgpa_factor, 0.0), 1.0)

    # Combine scores: 50% semantic, 35% skill overlap, 15% CGPA
    if model_loaded and semantic_score > 0.0:
        final_score = (semantic_score * 0.5) + (overlap_score * 0.35) + (cgpa_factor * 0.15)
    else:
        # Fallback if SentenceTransformers is disabled
        final_score = (overlap_score * 0.7) + (cgpa_factor * 0.3)
    
    # Bound the score
    final_score = min(max(final_score, 0.3), 0.98)

    # Generate Explanation
    explanation = None
    if gemini_available:
        explanation = generate_gemini_explanation(
            student_user.get("name"), project.get("title"), final_score,
            matched_skills, gaps, student_text, project_text
        )
    
    if not explanation:
        explanation = generate_local_explanation(
            student_user.get("name"), project.get("title"), final_score,
            matched_skills, gaps, student_profile
        )

    return {
        "matchScore": round(final_score, 2),
        "matchingSkills": matched_skills,
        "skillGaps": gaps,
        "explanation": explanation
    }


# ==========================================
# ENDPOINTS
# ==========================================

# 1. Authentication
@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserRegister):
    # Check if email already exists
    existing = query_documents("users", "email", "==", user.email)
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    new_id = "user_" + str(uuid.uuid4())[:8]
    user_data = {
        "id": new_id,
        "name": user.name,
        "email": user.email,
        "password": user.password,  # Plaintext for demo simplicity
        "role": user.role,
        "department": user.department
    }
    set_document("users", new_id, user_data)

    # Initialize empty student profile if role is student
    if user.role == "student":
        profile_data = {
            "userId": new_id,
            "year": "1st Year",
            "cgpa": 8.0,
            "coursework": [],
            "skills": [],
            "programmingLanguages": [],
            "interests": [],
            "projectExperience": "",
            "researchInterests": ""
        }
        set_document("studentProfiles", new_id, profile_data)

    return UserResponse(**user_data)


@app.post("/api/auth/login", response_model=UserResponse)
def login(credentials: UserLogin):
    users = query_documents("users", "email", "==", credentials.email)
    if not users:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    user = users[0]
    if user.get("password") != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return UserResponse(**user)


# 2. Student Profile
@app.get("/api/students/{student_id}/profile", response_model=StudentProfileSchema)
def get_student_profile(student_id: str):
    profile = get_document("studentProfiles", student_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return StudentProfileSchema(**profile)


@app.put("/api/students/{student_id}/profile", response_model=StudentProfileSchema)
def update_student_profile(student_id: str, profile: StudentProfileSchema):
    existing_profile = get_document("studentProfiles", student_id)
    if not existing_profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    
    updated_data = profile.dict()
    updated_data["userId"] = student_id
    set_document("studentProfiles", student_id, updated_data)
    return StudentProfileSchema(**updated_data)


# 3. Student Project Recommendations
@app.get("/api/students/{student_id}/recommendations")
def get_recommendations(student_id: str):
    student_user = get_document("users", student_id)
    student_profile = get_document("studentProfiles", student_id)
    if not student_user or not student_profile:
        raise HTTPException(status_code=404, detail="Student not found.")

    projects = get_documents("projects")
    recommendations = []

    for project in projects:
        if project.get("status", "Active") != "Active":
            continue
        
        try:
            match_data = perform_match(student_id, project.get("id"))
            # Format recommendation
            rec = {
                "project": project,
                "matchDetails": match_data
            }
            recommendations.append(rec)
        except Exception as e:
            print(f"[RECOMMENDATIONS ERROR] Error matching project {project.get('id')}: {e}")
            continue

    # Sort by match score descending
    recommendations.sort(key=lambda x: x["matchDetails"]["matchScore"], reverse=True)
    return recommendations


# 4. Project Operations
@app.post("/api/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreateSchema, faculty_id: str):
    faculty = get_document("users", faculty_id)
    if not faculty or faculty.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty members can create projects.")

    new_id = "proj_" + str(uuid.uuid4())[:8]
    project_data = project.dict()
    project_data["id"] = new_id
    project_data["facultyId"] = faculty_id
    project_data["status"] = "Active"
    project_data["createdAt"] = datetime.utcnow().isoformat()

    set_document("projects", new_id, project_data)
    return ProjectResponse(**project_data)


@app.get("/api/projects")
def get_all_projects():
    projects = get_documents("projects")
    return projects


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
def get_project_details(project_id: str):
    project = get_document("projects", project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return ProjectResponse(**project)


# 5. Project Applications
@app.post("/api/projects/{project_id}/apply", response_model=ApplicationResponse)
def apply_to_project(project_id: str, student_id: str):
    student = get_document("users", student_id)
    if not student or student.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can apply to projects.")

    project = get_document("projects", project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Check for existing application
    existing_applications = get_documents("applications")
    for app_doc in existing_applications:
        if app_doc.get("studentId") == student_id and app_doc.get("projectId") == project_id:
            raise HTTPException(status_code=400, detail="You have already applied to this project.")

    # Perform AI match
    match_result = perform_match(student_id, project_id)

    app_id = "app_" + str(uuid.uuid4())[:8]
    application_data = {
        "id": app_id,
        "projectId": project_id,
        "studentId": student_id,
        "studentName": student.get("name"),
        "studentEmail": student.get("email"),
        "projectTitle": project.get("title"),
        "facultyName": project.get("facultyName"),
        "matchScore": match_result["matchScore"],
        "matchingSkills": match_result["matchingSkills"],
        "skillGaps": match_result["skillGaps"],
        "explanation": match_result["explanation"],
        "status": "Pending",
        "appliedAt": datetime.utcnow().isoformat()
    }

    set_document("applications", app_id, application_data)
    return ApplicationResponse(**application_data)


@app.get("/api/projects/{project_id}/applicants")
def get_project_applicants(project_id: str, faculty_id: str):
    project = get_document("projects", project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    if project.get("facultyId") != faculty_id:
        raise HTTPException(status_code=403, detail="Access denied. You are not the owner of this project.")

    all_apps = get_documents("applications")
    project_apps = [app_doc for app_doc in all_apps if app_doc.get("projectId") == project_id]

    # Sort applicants by matchScore descending
    project_apps.sort(key=lambda x: x.get("matchScore", 0.0), reverse=True)
    return project_apps


@app.post("/api/applications/{application_id}/status")
def update_application_status(application_id: str, status_val: str, faculty_id: str):
    if status_val not in ["Accepted", "Rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'Accepted' or 'Rejected'.")

    application = get_document("applications", application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    project = get_document("projects", application.get("projectId"))
    if not project or project.get("facultyId") != faculty_id:
        raise HTTPException(status_code=403, detail="Access denied. You are not the owner of the project.")

    application["status"] = status_val
    set_document("applications", application_id, application)
    return application


@app.get("/api/applications/student/{student_id}")
def get_student_applications(student_id: str):
    all_apps = get_documents("applications")
    student_apps = [app_doc for app_doc in all_apps if app_doc.get("studentId") == student_id]
    # Sort by applied date descending
    student_apps.sort(key=lambda x: x.get("appliedAt", ""), reverse=True)
    return student_apps


@app.get("/api/faculty/{faculty_id}/stats")
def get_faculty_stats(faculty_id: str):
    projects = get_documents("projects")
    faculty_projects = [p for p in projects if p.get("facultyId") == faculty_id]
    
    project_ids = [p.get("id") for p in faculty_projects]
    
    all_apps = get_documents("applications")
    faculty_apps = [a for a in all_apps if a.get("projectId") in project_ids]
    
    pending_apps = [a for a in faculty_apps if a.get("status") == "Pending"]
    accepted_apps = [a for a in faculty_apps if a.get("status") == "Accepted"]

    # Calculate average match score for applicants
    avg_score = 0.0
    if faculty_apps:
        avg_score = round(sum([a.get("matchScore", 0.0) for a in faculty_apps]) / len(faculty_apps), 2)

    return {
        "projectsCount": len(faculty_projects),
        "applicationsCount": len(faculty_apps),
        "pendingCount": len(pending_apps),
        "acceptedCount": len(accepted_apps),
        "averageMatchScore": avg_score,
        "projects": faculty_projects
    }


# Root / status endpoint
@app.get("/api/status")
def get_status():
    return {
        "status": "online",
        "firebase_enabled": firebase_enabled,
        "ai_model_loaded": model_loaded,
        "gemini_available": gemini_available
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

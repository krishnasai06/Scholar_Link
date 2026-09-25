import os
import json
import uuid
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Thread lock for file operations in Local DB
db_lock = threading.Lock()
DB_FILE = os.path.join(os.path.dirname(__file__), "db.json")

# Firebase configuration check
firebase_enabled = False
db_client = None

firebase_key_path = os.getenv("FIREBASE_KEY_PATH")
if firebase_key_path and os.path.exists(firebase_key_path):
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Check if already initialized to avoid re-init error
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_key_path)
            firebase_admin.initialize_app(cred)
        db_client = firestore.client()
        firebase_enabled = True
        print("[DATABASE] Firebase Firestore initialized successfully.")
    except Exception as e:
        print(f"[DATABASE] Failed to initialize Firebase: {e}. Falling back to local JSON database.")
else:
    print("[DATABASE] Firebase credentials not found or invalid. Using local JSON database (db.json).")


# Local DB implementation mimicking Firestore structure
class LocalFirestoreEmulator:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self._init_db()

    def _init_db(self):
        with db_lock:
            if not os.path.exists(self.filepath):
                # Write empty structure
                self._save_data({
                    "users": {},
                    "studentProfiles": {},
                    "projects": {},
                    "applications": {}
                })
                self._seed_data()

    def _load_data(self) -> Dict[str, Any]:
        try:
            if os.path.exists(self.filepath):
                with open(self.filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            print(f"[DATABASE ERROR] Load failed: {e}")
        return {"users": {}, "studentProfiles": {}, "projects": {}, "applications": {}}

    def _save_data(self, data: Dict[str, Any]):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            print(f"[DATABASE ERROR] Save failed: {e}")

    def _seed_data(self):
        # We will populate initial students, faculty users, and projects
        print("[DATABASE] Seeding local database...")
        
        # Hash passwords or just keep simple for demo (we'll do plain comparisons for ease of demo authentication)
        seed_users = {
            "stud_hari": {
                "id": "stud_hari",
                "name": "Hariharan S",
                "email": "hari@srm.edu",
                "role": "student",
                "department": "Computer Science & Engineering",
                "password": "password123"
            },
            "stud_ananya": {
                "id": "stud_ananya",
                "name": "Ananya Iyer",
                "email": "ananya@srm.edu",
                "role": "student",
                "department": "Electronics & Communication",
                "password": "password123"
            },
            "stud_rohan": {
                "id": "stud_rohan",
                "name": "Rohan Verma",
                "email": "rohan@srm.edu",
                "role": "student",
                "department": "Information Technology",
                "password": "password123"
            },
            "stud_sneha": {
                "id": "stud_sneha",
                "name": "Sneha Ramakrishnan",
                "email": "sneha@srm.edu",
                "role": "student",
                "department": "Mechanical Engineering",
                "password": "password123"
            },
            "stud_aditya": {
                "id": "stud_aditya",
                "name": "Aditya Sharma",
                "email": "aditya@srm.edu",
                "role": "student",
                "department": "Computer Science & Engineering",
                "password": "password123"
            },
            "fac_rajesh": {
                "id": "fac_rajesh",
                "name": "Dr. A. Rajesh",
                "email": "rajesh@srm.edu",
                "role": "faculty",
                "department": "Computational Intelligence",
                "password": "password123"
            },
            "fac_priya": {
                "id": "fac_priya",
                "name": "Dr. S. Priya",
                "email": "priya@srm.edu",
                "role": "faculty",
                "department": "Electronics & Communication",
                "password": "password123"
            }
        }

        seed_profiles = {
            "stud_hari": {
                "userId": "stud_hari",
                "year": "3rd Year",
                "cgpa": 9.2,
                "coursework": ["Machine Learning", "Neural Networks", "Data Structures", "Database Management Systems"],
                "skills": ["Python", "Machine Learning", "Deep Learning", "Computer Vision", "TensorFlow", "PyTorch"],
                "programmingLanguages": ["Python", "C++", "SQL"],
                "interests": ["Computer Vision", "Medical AI", "Deep Learning"],
                "projectExperience": "Developed a custom object detection model using YOLOv8 to identify traffic violations. Implemented a simple breast cancer classification system using ResNet50 as a course project.",
                "researchInterests": "Explainable AI in Healthcare, Biomedical Image Analysis"
            },
            "stud_ananya": {
                "userId": "stud_ananya",
                "year": "4th Year",
                "cgpa": 8.9,
                "coursework": ["Embedded Systems", "Signals and Systems", "Data Analytics", "Microcontrollers"],
                "skills": ["Python", "IoT", "Arduino", "Raspberry Pi", "Data Analysis", "Matlab"],
                "programmingLanguages": ["Python", "C", "MATLAB"],
                "interests": ["Smart Systems", "IoT", "Embedded AI"],
                "projectExperience": "Created a home automation system using NodeMCU and Firebase. Conducted statistical data analysis on environmental parameters collected from local sensors.",
                "researchInterests": "Low-power Edge Computing, IoT in Agriculture"
            },
            "stud_rohan": {
                "userId": "stud_rohan",
                "year": "3rd Year",
                "cgpa": 8.5,
                "coursework": ["Web Technologies", "Natural Language Processing", "Software Engineering", "Cloud Computing"],
                "skills": ["Python", "NLP", "FastAPI", "React", "MongoDB", "Node.js"],
                "programmingLanguages": ["Python", "JavaScript", "HTML/CSS"],
                "interests": ["Natural Language Processing", "Web Development", "Generative AI"],
                "projectExperience": "Built a personal blog and developer portfolio website using React. Developed a basic text summarization REST API using Flask and HuggingFace transformers.",
                "researchInterests": "Retrieval-Augmented Generation, Semantic Search Interfaces"
            },
            "stud_sneha": {
                "userId": "stud_sneha",
                "year": "4th Year",
                "cgpa": 9.4,
                "coursework": ["Design of Machine Elements", "Probability and Statistics", "Data Science", "Numerical Methods"],
                "skills": ["Python", "Machine Learning", "Statistics", "Data Analysis", "Pandas", "Scikit-Learn"],
                "programmingLanguages": ["Python", "R", "SQL"],
                "interests": ["Predictive Analytics", "Data Science", "Industrial Automation"],
                "projectExperience": "Conducted statistical failure mode analysis for automotive parts. Created a regression model to estimate engine efficiency under varying thermal loads.",
                "researchInterests": "Anomaly Detection in Time-Series Data, Optimization Algorithms"
            },
            "stud_aditya": {
                "userId": "stud_aditya",
                "year": "3rd Year",
                "cgpa": 8.7,
                "coursework": ["Cryptography", "Computer Networks", "Operating Systems", "Information Security"],
                "skills": ["Python", "Cybersecurity", "Networking", "Linux", "Docker", "Wireshark"],
                "programmingLanguages": ["Python", "Bash", "Java"],
                "interests": ["Cybersecurity", "Network Security", "Threat Intelligence"],
                "projectExperience": "Configured local firewalls and set up virtual network testbeds to analyze DDoS attacks. Developed a script in Python to automate log file vulnerability parsing.",
                "researchInterests": "Intrusion Detection Systems, Zero-Trust Architecture"
            }
        }

        seed_projects = {
            "proj_med_ai": {
                "id": "proj_med_ai",
                "facultyId": "fac_rajesh",
                "facultyName": "Dr. A. Rajesh",
                "department": "Computational Intelligence",
                "title": "AI-Based Medical Image Analysis",
                "type": "Research Project",
                "description": "This research project focuses on building deep learning models (such as CNNs and Vision Transformers) for classifying and segmenting medical images (X-rays, MRIs, and CT scans). The goal is to assist radiologists in identifying early signs of lung abnormalities and brain tumors with high precision.",
                "requiredSkills": ["Python", "Machine Learning", "Deep Learning", "Computer Vision"],
                "domain": "Medical AI",
                "studentsRequired": 2,
                "duration": "6 Months",
                "status": "Active",
                "createdAt": datetime.utcnow().isoformat()
            },
            "proj_irrigation": {
                "id": "proj_irrigation",
                "facultyId": "fac_priya",
                "facultyName": "Dr. S. Priya",
                "department": "Electronics & Communication",
                "title": "Smart Irrigation System",
                "type": "Mini Project",
                "description": "Development of a smart agriculture framework using IoT sensors (soil moisture, temperature, humidity) combined with machine learning models to predict watering requirements. The system optimizes water consumption and automates irrigation control via microcontrollers.",
                "requiredSkills": ["Python", "IoT", "Machine Learning", "Data Analysis"],
                "domain": "Internet of Things",
                "studentsRequired": 3,
                "duration": "3 Months",
                "status": "Active",
                "createdAt": datetime.utcnow().isoformat()
            },
            "proj_chatbot": {
                "id": "proj_chatbot",
                "facultyId": "fac_rajesh",
                "facultyName": "Dr. A. Rajesh",
                "department": "Computational Intelligence",
                "title": "College Helpdesk Chatbot",
                "type": "Mini Project",
                "description": "Creating a conversational chatbot to automate student queries regarding courses, fees, timetables, and campus facilities. The chatbot will utilize LLMs, retrieval-augmented generation (RAG), and a FastAPI backend to deliver real-time, context-aware answers.",
                "requiredSkills": ["Python", "NLP", "LLM", "FastAPI"],
                "domain": "Natural Language Processing",
                "studentsRequired": 1,
                "duration": "3 Months",
                "status": "Active",
                "createdAt": datetime.utcnow().isoformat()
            },
            "proj_pred_maint": {
                "id": "proj_pred_maint",
                "facultyId": "fac_rajesh",
                "facultyName": "Dr. A. Rajesh",  # Shared faculty for demo purposes
                "department": "Computational Intelligence",
                "title": "Predictive Maintenance Model",
                "type": "Final Year Project",
                "description": "Developing predictive maintenance models for industrial machinery using sensor telemetry data. The project involves time-series analysis, anomaly detection, and classification models to forecast equipment failures before they occur, reducing downtime.",
                "requiredSkills": ["Python", "Machine Learning", "Statistics", "Data Analysis"],
                "domain": "Data Science",
                "studentsRequired": 2,
                "duration": "9 Months",
                "status": "Active",
                "createdAt": datetime.utcnow().isoformat()
            },
            "proj_cyber": {
                "id": "proj_cyber",
                "facultyId": "fac_priya",
                "facultyName": "Dr. S. Priya",
                "department": "Electronics & Communication",
                "title": "Cybersecurity Threat Detection",
                "type": "Final Year Project",
                "description": "Applying machine learning algorithms to detect network intrusions and suspicious activities. The student will analyze network packet captures, extract features, train anomaly detection models, and build a real-time dashboard warning about potential cyber threats.",
                "requiredSkills": ["Python", "Cybersecurity", "Machine Learning", "Networking"],
                "domain": "Cybersecurity",
                "studentsRequired": 2,
                "duration": "9 Months",
                "status": "Active",
                "createdAt": datetime.utcnow().isoformat()
            }
        }

        # Save to DB
        data = self._load_data()
        data["users"] = seed_users
        data["studentProfiles"] = seed_profiles
        data["projects"] = seed_projects
        data["applications"] = {}
        self._save_data(data)
        print("[DATABASE] Local database seeded with 5 students and 5 projects.")

    def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        with db_lock:
            data = self._load_data()
            return data.get(collection, {}).get(doc_id)

    def get_documents(self, collection: str) -> List[Dict[str, Any]]:
        with db_lock:
            data = self._load_data()
            coll_data = data.get(collection, {})
            return list(coll_data.values())

    def set_document(self, collection: str, doc_id: str, doc_data: Dict[str, Any]):
        with db_lock:
            data = self._load_data()
            if collection not in data:
                data[collection] = {}
            data[collection][doc_id] = doc_data
            self._save_data(data)

    def add_document(self, collection: str, doc_data: Dict[str, Any]) -> str:
        with db_lock:
            data = self._load_data()
            if collection not in data:
                data[collection] = {}
            doc_id = doc_data.get("id") or str(uuid.uuid4())
            doc_data["id"] = doc_id
            data[collection][doc_id] = doc_data
            self._save_data(data)
            return doc_id

    def delete_document(self, collection: str, doc_id: str):
        with db_lock:
            data = self._load_data()
            if collection in data and doc_id in data[collection]:
                del data[collection][doc_id]
                self._save_data(data)


# Instantiate the emulator
local_db = LocalFirestoreEmulator(DB_FILE)


# Generic Firestore/Local Wrapper Functions
def get_document(collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
    if firebase_enabled:
        try:
            doc = db_client.collection(collection).document(doc_id).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            print(f"[FIREBASE ERROR] get_document: {e}. Falling back to local DB.")
    return local_db.get_document(collection, doc_id)

def get_documents(collection: str) -> List[Dict[str, Any]]:
    if firebase_enabled:
        try:
            docs = db_client.collection(collection).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"[FIREBASE ERROR] get_documents: {e}. Falling back to local DB.")
    return local_db.get_documents(collection)

def set_document(collection: str, doc_id: str, data: Dict[str, Any]):
    if firebase_enabled:
        try:
            db_client.collection(collection).document(doc_id).set(data)
            return
        except Exception as e:
            print(f"[FIREBASE ERROR] set_document: {e}. Falling back to local DB.")
    local_db.set_document(collection, doc_id, data)

def add_document(collection: str, data: Dict[str, Any]) -> str:
    if firebase_enabled:
        try:
            doc_ref = db_client.collection(collection).document()
            data["id"] = doc_ref.id
            doc_ref.set(data)
            return doc_ref.id
        except Exception as e:
            print(f"[FIREBASE ERROR] add_document: {e}. Falling back to local DB.")
    return local_db.add_document(collection, data)

def delete_document(collection: str, doc_id: str):
    if firebase_enabled:
        try:
            db_client.collection(collection).document(doc_id).delete()
            return
        except Exception as e:
            print(f"[FIREBASE ERROR] delete_document: {e}. Falling back to local DB.")
    local_db.delete_document(collection, doc_id)

def query_documents(collection: str, field: str, operator: str, value: Any) -> List[Dict[str, Any]]:
    # Simple query implementation
    if firebase_enabled:
        try:
            # operators: ==, >, <, in, etc.
            if operator == "==":
                docs = db_client.collection(collection).where(field, "==", value).stream()
            elif operator == "in":
                docs = db_client.collection(collection).where(field, "in", value).stream()
            else:
                docs = db_client.collection(collection).stream() # fallback general
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"[FIREBASE ERROR] query_documents: {e}. Falling back to local DB.")
    
    # Local fallback query logic
    docs = local_db.get_documents(collection)
    res = []
    for doc in docs:
        if field in doc:
            val = doc[field]
            if operator == "==" and val == value:
                res.append(doc)
            elif operator == "in" and isinstance(value, list) and val in value:
                res.append(doc)
            elif operator == "contains" and isinstance(val, list) and value in val:
                res.append(doc)
    return res

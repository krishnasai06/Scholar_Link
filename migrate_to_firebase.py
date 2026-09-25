import os
import json
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def run_migration():
    # 1. Resolve Firebase Key Path from environment or default relative path
    firebase_key_path = os.getenv("FIREBASE_KEY_PATH", "serviceAccountKey.json")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    if not os.path.isabs(firebase_key_path):
        firebase_key_path = os.path.join(script_dir, firebase_key_path)

    if not os.path.exists(firebase_key_path):
        print(f"[ERROR] Firebase credential file not found at: {firebase_key_path}")
        return

    # 2. Initialize Firebase Admin SDK and Firestore client
    import firebase_admin
    from firebase_admin import credentials, firestore

    if not firebase_admin._apps:
        cred = credentials.Certificate(firebase_key_path)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()

    # 3. Read db.json safely
    db_json_path = os.path.join(script_dir, "db.json")
    if not os.path.exists(db_json_path):
        print(f"[ERROR] Database file db.json not found at: {db_json_path}")
        return

    with open(db_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 4. Migrate collections while preserving IDs and structure
    collections = ["users", "studentProfiles", "projects", "applications"]

    for coll in collections:
        coll_data = data.get(coll, {})
        label = "profiles" if coll == "studentProfiles" else coll
        
        print(f"Migrating {coll}...")
        
        count = 0
        for doc_id, doc_fields in coll_data.items():
            # set() performs an upsert, preserving existing document IDs and overwriting/updating safely
            db.collection(coll).document(doc_id).set(doc_fields)
            count += 1
            
        print(f"Migrated {count} {label}")

    print("Migration completed successfully.")

    # 5. Verification step: Read Firestore collections back
    print("\n--- Firestore Collection Verification ---")
    for coll in collections:
        docs = list(db.collection(coll).stream())
        print(f"Collection '{coll}': {len(docs)} documents verified in Firestore")

if __name__ == "__main__":
    run_migration()

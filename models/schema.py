from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str  # "student" or "faculty"
    department: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: str

class StudentProfileSchema(BaseModel):
    year: str
    cgpa: float
    coursework: List[str]
    skills: List[str]
    programmingLanguages: List[str]
    interests: List[str]
    projectExperience: str
    researchInterests: str

class ProjectCreateSchema(BaseModel):
    title: str
    type: str  # "Research", "Final Year", "Mini Project"
    description: str
    requiredSkills: List[str]
    domain: str
    studentsRequired: int
    duration: str
    facultyName: str
    department: str

class ProjectResponse(BaseModel):
    id: str
    facultyId: str
    title: str
    type: str
    description: str
    requiredSkills: List[str]
    domain: str
    studentsRequired: int
    facultyName: str
    department: str
    duration: str
    status: str  # "Active", "Closed"
    createdAt: str

class ApplicationCreateSchema(BaseModel):
    projectId: str

class ApplicationResponse(BaseModel):
    id: str
    projectId: str
    studentId: str
    studentName: str
    studentEmail: str
    projectTitle: str
    facultyName: str
    matchScore: float
    matchingSkills: List[str]
    skillGaps: List[str]
    explanation: str
    status: str  # "Pending", "Accepted", "Rejected"
    appliedAt: str

class MatchRequestSchema(BaseModel):
    studentId: str
    projectId: str

class MatchResponse(BaseModel):
    matchScore: float
    matchingSkills: List[str]
    skillGaps: List[str]
    explanation: str

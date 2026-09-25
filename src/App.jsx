import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  BookOpen,
  Award,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Plus,
  ChevronRight,
  TrendingUp,
  Target,
  Cpu,
  FileText,
  Sparkles,
  Clock,
  Building,
  GraduationCap,
  ListFilter,
  Check,
  X,
  FileCheck,
  Users
} from 'lucide-react';

// Setup basic API URL
const API_URL = '/api';

export default function App() {
  // Navigation & Auth State
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'login', 'register', 'student-dash', 'faculty-dash', 'profile-edit'
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  
  // Dashboard & Project State
  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [studentApplications, setStudentApplications] = useState([]);
  
  // Faculty Dashboard State
  const [facultyStats, setFacultyStats] = useState(null);
  const [facultyProjects, setFacultyProjects] = useState([]);
  const [projectApplicants, setProjectApplicants] = useState([]);
  const [selectedFacultyProject, setSelectedFacultyProject] = useState(null);
  
  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('student');
  const [registerDept, setRegisterDept] = useState('Computer Science & Engineering');
  
  // Post Project State
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjType, setNewProjType] = useState('Research Project');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjSkills, setNewProjSkills] = useState('');
  const [newProjDomain, setNewProjDomain] = useState('');
  const [newProjStudents, setNewProjStudents] = useState(2);
  const [newProjDuration, setNewProjDuration] = useState('6 Months');
  const [showPostModal, setShowPostModal] = useState(false);

  // Profile Edit State
  const [editYear, setEditYear] = useState('3rd Year');
  const [editCgpa, setEditCgpa] = useState(8.5);
  const [editCoursework, setEditCoursework] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editLanguages, setEditLanguages] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editResearch, setEditResearch] = useState('');
  
  // UI & Loading States
  const [loading, setLoading] = useState(false);
  const [aiMatchingLoading, setAiMatchingLoading] = useState(false);
  const [aiPhase, setAiPhase] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [minMatchFilter, setMinMatchFilter] = useState(0);

  // Auto-login helpers for Demo
  const quickLogins = [
    { email: 'hari@srm.edu', password: 'password123', label: 'Student: Hariharan (ML/CV)', role: 'student' },
    { email: 'rohan@srm.edu', password: 'password123', label: 'Student: Rohan (NLP/Web)', role: 'student' },
    { email: 'ananya@srm.edu', password: 'password123', label: 'Student: Ananya (IoT/Embedded)', role: 'student' },
    { email: 'rajesh@srm.edu', password: 'password123', label: 'Faculty: Dr. Rajesh (Comp. Intel)', role: 'faculty' },
    { email: 'priya@srm.edu', password: 'password123', label: 'Faculty: Dr. Priya (ECE)', role: 'faculty' },
  ];

  // Effect to load initial workspace projects
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch all projects for landing page list
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Error fetching projects", err);
    }
  };

  // Login handler
  const handleLogin = async (e, email = null, password = null) => {
    if (e) e.preventDefault();
    const finalEmail = email || loginEmail;
    const finalPassword = password || loginPassword;

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: finalEmail, password: finalPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      
      setCurrentUser(data);
      if (data.role === 'student') {
        await loadStudentDashboard(data.id);
      } else {
        await loadFacultyDashboard(data.id);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          role: registerRole,
          department: registerDept
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      
      setSuccessMessage("Registration successful! Logging you in...");
      setTimeout(() => {
        setCurrentUser(data);
        if (data.role === 'student') {
          loadStudentDashboard(data.id);
        } else {
          loadFacultyDashboard(data.id);
        }
        setSuccessMessage('');
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Student Dashboard data
  const loadStudentDashboard = async (studentId) => {
    try {
      setLoading(true);
      // Get profile
      const profRes = await fetch(`${API_URL}/students/${studentId}/profile`);
      if (profRes.ok) {
        const prof = await profRes.json();
        setStudentProfile(prof);
        
        // Load inputs for Edit Profile page
        setEditYear(prof.year || '3rd Year');
        setEditCgpa(prof.cgpa || 8.5);
        setEditCoursework(prof.coursework ? prof.coursework.join(', ') : '');
        setEditSkills(prof.skills ? prof.skills.join(', ') : '');
        setEditLanguages(prof.programmingLanguages ? prof.programmingLanguages.join(', ') : '');
        setEditInterests(prof.interests ? prof.interests.join(', ') : '');
        setEditExperience(prof.projectExperience || '');
        setEditResearch(prof.researchInterests || '');
      }

      // Get applications
      const appsRes = await fetch(`${API_URL}/applications/student/${studentId}`);
      if (appsRes.ok) {
        const apps = await appsRes.json();
        setStudentApplications(apps);
      }

      // Get recommendations
      const recsRes = await fetch(`${API_URL}/students/${studentId}/recommendations`);
      if (recsRes.ok) {
        const recs = await recsRes.json();
        setRecommendations(recs);
      }

      setCurrentView('student-dash');
    } catch (err) {
      console.error("Error loading student dashboard", err);
      setErrorMessage("Could not retrieve dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // Load Faculty Dashboard data
  const loadFacultyDashboard = async (facultyId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/faculty/${facultyId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setFacultyStats(data);
        setFacultyProjects(data.projects || []);
        if (data.projects && data.projects.length > 0) {
          // Select first project by default
          handleSelectFacultyProject(data.projects[0].id, facultyId);
        }
      }
      setCurrentView('faculty-dash');
    } catch (err) {
      console.error("Error loading faculty dashboard", err);
      setErrorMessage("Could not load faculty statistics.");
    } finally {
      setLoading(false);
    }
  };

  // Select a faculty project to view applicants
  const handleSelectFacultyProject = async (projectId, facultyId = currentUser?.id) => {
    const proj = facultyProjects.find(p => p.id === projectId) || facultyStats?.projects.find(p => p.id === projectId);
    setSelectedFacultyProject(proj);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/applicants?faculty_id=${facultyId}`);
      if (res.ok) {
        const applicants = await res.json();
        setProjectApplicants(applicants);
      }
    } catch (err) {
      console.error("Error fetching applicants", err);
    }
  };

  // Handle student profile updates
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const bodyData = {
        year: editYear,
        cgpa: parseFloat(editCgpa),
        coursework: editCoursework.split(',').map(s => s.trim()).filter(s => s !== ''),
        skills: editSkills.split(',').map(s => s.trim()).filter(s => s !== ''),
        programmingLanguages: editLanguages.split(',').map(s => s.trim()).filter(s => s !== ''),
        interests: editInterests.split(',').map(s => s.trim()).filter(s => s !== ''),
        projectExperience: editExperience,
        researchInterests: editResearch
      };

      const res = await fetch(`${API_URL}/students/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Profile update failed");
      
      setStudentProfile(data);
      setSuccessMessage("Profile updated successfully! Re-calculating AI matches...");
      
      // Reload dashboard data including recommendations
      const recsRes = await fetch(`${API_URL}/students/${currentUser.id}/recommendations`);
      if (recsRes.ok) {
        const recs = await recsRes.json();
        setRecommendations(recs);
      }
      
      setTimeout(() => {
        setSuccessMessage('');
        setCurrentView('student-dash');
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle project application with simulation of AI matching
  const handleApplyToProject = async (projectId) => {
    setAiMatchingLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setSelectedProject(null);

    // Simulate AI match phase changes for IDEATHON WOW factor
    const phases = [
      "Synthesizing profile embeddings...",
      "Analyzing project requirements...",
      "Executing Cosine Similarity engine...",
      "Generating Explainable AI match report..."
    ];

    let i = 0;
    setAiPhase(phases[0]);
    const interval = setInterval(() => {
      i++;
      if (i < phases.length) {
        setAiPhase(phases[i]);
      } else {
        clearInterval(interval);
      }
    }, 600);

    try {
      // Small pause to allow visual animation
      await new Promise(r => setTimeout(r, 2000));

      const res = await fetch(`${API_URL}/projects/${projectId}/apply?student_id=${currentUser.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Application submission failed");

      setSuccessMessage(`Application submitted successfully! Match Score: ${Math.round(data.matchScore * 100)}%`);
      
      // Reload student data
      const appsRes = await fetch(`${API_URL}/applications/student/${currentUser.id}`);
      if (appsRes.ok) {
        const apps = await appsRes.json();
        setStudentApplications(apps);
      }
      
      // Hide banner after 3 seconds
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      clearInterval(interval);
      setAiMatchingLoading(false);
    }
  };

  // Handle posting a new project (Faculty)
  const handlePostProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const skillsArray = newProjSkills.split(',').map(s => s.trim()).filter(s => s !== '');
      const projectBody = {
        title: newProjTitle,
        type: newProjType,
        description: newProjDesc,
        requiredSkills: skillsArray,
        domain: newProjDomain,
        studentsRequired: parseInt(newProjStudents),
        duration: newProjDuration,
        facultyName: currentUser.name,
        department: currentUser.department
      };

      const res = await fetch(`${API_URL}/projects?faculty_id=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectBody)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create project");

      setSuccessMessage("Project posted successfully!");
      setShowPostModal(false);
      
      // Clear forms
      setNewProjTitle('');
      setNewProjDesc('');
      setNewProjSkills('');
      setNewProjDomain('');
      
      // Reload stats & project list
      await loadFacultyDashboard(currentUser.id);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept/Reject application (Faculty)
  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/applications/${appId}/status?status_val=${newStatus}&faculty_id=${currentUser.id}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update status");
      }
      setSuccessMessage(`Application status set to: ${newStatus}`);
      
      // Refresh current project applicant list and faculty stats
      if (selectedFacultyProject) {
        await handleSelectFacultyProject(selectedFacultyProject.id);
      }
      const statsRes = await fetch(`${API_URL}/faculty/${currentUser.id}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setFacultyStats(statsData);
        setFacultyProjects(statsData.projects || []);
      }

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleLogout = () => {
    setCurrentUser(null);
    setStudentProfile(null);
    setRecommendations([]);
    setStudentApplications([]);
    setFacultyStats(null);
    setFacultyProjects([]);
    setProjectApplicants([]);
    setSelectedFacultyProject(null);
    setCurrentView('landing');
  };

  // Render match score circular ring
  const renderScoreRing = (score, size = 120) => {
    const percentage = Math.round(score * 100);
    const strokeWidth = size * 0.08;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let strokeColor = 'stroke-emerald-500';
    let textColor = 'text-emerald-600';
    let bgColor = 'bg-emerald-50';

    if (percentage < 70) {
      strokeColor = 'stroke-amber-500';
      textColor = 'text-amber-600';
      bgColor = 'bg-amber-50';
    }
    if (percentage < 50) {
      strokeColor = 'stroke-red-500';
      textColor = 'text-red-600';
      bgColor = 'bg-red-50';
    }

    return (
      <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`transition-all duration-1000 ease-out ${strokeColor}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold tracking-tight ${textColor}`}>{percentage}%</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Match</span>
        </div>
      </div>
    );
  };

  // Helper to check if student already applied
  const checkAlreadyApplied = (projectId) => {
    return studentApplications.some(app => app.projectId === projectId);
  };

  // Filter recommendations based on keyword & match score
  const filteredRecommendations = recommendations.filter(rec => {
    const textMatch = 
      rec.project.title.toLowerCase().includes(projectFilter.toLowerCase()) ||
      rec.project.description.toLowerCase().includes(projectFilter.toLowerCase()) ||
      rec.project.domain.toLowerCase().includes(projectFilter.toLowerCase());
    
    const scorePct = rec.matchDetails.matchScore * 100;
    return textMatch && scorePct >= minMatchFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => currentUser ? (currentUser.role === 'student' ? loadStudentDashboard(currentUser.id) : loadFacultyDashboard(currentUser.id)) : setCurrentView('landing')}>
            <div className="h-10 w-10 srm-blue-gradient rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 transform hover:scale-105 transition-transform">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-blue-950"> <span className="text-blue-600 font-bold">ScholarLink</span></span>
              <span className="block text-[9px] text-blue-600 font-bold uppercase tracking-wider -mt-1">Academic Collaboration Network</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <div className="hidden md:flex items-center space-x-2 bg-slate-100 rounded-full py-1.5 px-4.5 border border-slate-200">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">{currentUser.name}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase">
                    {currentUser.role}
                  </span>
                </div>
                {currentUser.role === 'student' && (
                  <button
                    onClick={() => setCurrentView('student-dash')}
                    className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                      currentView === 'student-dash'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Dashboard
                  </button>
                )}
                {currentUser.role === 'student' && (
                  <button
                    onClick={() => setCurrentView('profile-edit')}
                    className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                      currentView === 'profile-edit'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Edit Profile
                  </button>
                )}
                {currentUser.role === 'faculty' && (
                  <button
                    onClick={() => loadFacultyDashboard(currentUser.id)}
                    className="text-sm font-semibold text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg"
                  >
                    Dashboard
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 px-4.5 py-2 rounded-lg border border-transparent hover:border-rose-100 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-sm font-semibold text-slate-600 hover:text-blue-900 hover:bg-slate-100 py-2 px-4 rounded-lg transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4.5 rounded-lg shadow-sm shadow-blue-500/10 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Alerts Banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center space-x-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-3 shadow-sm animate-pulse">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* AI Processing Modal */}
      {aiMatchingLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 transform animate-fade-in border border-slate-100">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 srm-blue-gradient rounded-full opacity-10 animate-ping"></div>
              <div className="h-20 w-20 rounded-full srm-blue-gradient flex items-center justify-center text-white shadow-xl shadow-blue-500/30 pulse-glow">
                <Sparkles className="h-10 w-10 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">AI Matching Engine Active</h3>
              <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">{aiPhase}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full animate-[loading-bar_2s_infinite_linear]" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-slate-400">Computing semantic cosine similarity using sentence embeddings...</p>
          </div>
        </div>
      )}

      {/* View router */}
      <main className="flex-grow">
        
        {/* ========================================================
            LANDING VIEW
        ======================================================== */}
        {currentView === 'landing' && (
          <div className="space-y-16 pb-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white pt-20 pb-24 md:py-32 border-b border-indigo-900/40">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]"></div>
              <div className="absolute -left-20 bottom-0 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                    <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/20 px-3.5 py-1.5 rounded-full">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Ideathon Demo Version 1.0</span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                      Connect Students & Faculty with <span className="bg-gradient-to-r from-blue-400 to-amber-300 bg-clip-text text-transparent">Explainable AI</span>
                    </h1>
                    
                    <p className="text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                      Bridge the academic research gap.  ScholarLink matches students' skills, coursework, and research interests to faculty projects deterministically and semantically.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                      <button
                        onClick={() => setCurrentView('register')}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Join  ScholarLink</span>
                        <ArrowRight className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentView('login')}
                        className="w-full sm:w-auto bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2"
                      >
                        <span>Faculty Sign In</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Side Block */}
                  <div className="lg:col-span-5 relative">
                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-slate-700/40 p-8 rounded-3xl backdrop-blur-md shadow-2xl space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
                        <div className="flex items-center space-x-2">
                          <Cpu className="h-5 w-5 text-blue-400 animate-pulse" />
                          <span className="text-sm font-bold text-slate-300">Live Matching Sandbox</span>
                        </div>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold">Active</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Student Profile Input</span>
                          <p className="text-xs text-slate-300 font-medium mt-1">
                            Skills: Python, TensorFlow, CV. Research Interest: Explainable AI in Breast Cancer classification.
                          </p>
                        </div>
                        <div className="flex items-center justify-center">
                          <ChevronRight className="h-6 w-6 text-slate-500 rotate-90" />
                        </div>
                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Project Focus</span>
                          <p className="text-xs text-slate-300 font-medium mt-1">
                            AI-Based Medical Image Analysis. Required: Python, Machine Learning, Deep Learning.
                          </p>
                        </div>
                      </div>

                      {/* Score Demonstration */}
                      <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <div>
                          <span className="text-xs font-semibold text-slate-300">Semantic Cosine Score</span>
                          <span className="block text-[10px] text-slate-500">Scaled for student profiles</span>
                        </div>
                        <span className="text-xl font-bold text-emerald-400">92% Match</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Demo Section (SUPER IMPORTANT FOR JUDGES) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-200/70 space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">Ideathon Sandbox</span>
                  <h2 className="text-2xl font-bold text-slate-900">Quick-Login Demo Accounts</h2>
                  <p className="text-slate-500 text-sm">
                    Click any pre-seeded account below to log in instantly. The database contains realistic profiles and matching details.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickLogins.map((login, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLogin(null, login.email, login.password)}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all text-left group shadow-xs hover:shadow-md cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-900">{login.label}</span>
                        <span className="block text-xs text-slate-500">{login.email}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Value Props */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Semantic Matching</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Goes beyond keyword counting. Our engine analyzes text embeddings of student profiles and project descriptions to compute true semantic alignment.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Explainable AI (XAI)</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Transparency first. Faculty and students see a clear breakdown of matching skills, skill gaps, and a synthesized explanation detailing why they fit.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Building className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Centralized Portal</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Say goodbye to lost emails. A single destination for SRM Faculty to post projects and for students to track active applications.
                </p>
              </div>
            </section>

            {/* Live Project Feed */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Explore Active Projects</h2>
                  <p className="text-slate-500 text-sm">Open research and developer roles posted by SRM Faculty</p>
                </div>
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 py-1 px-3 rounded-full">
                  {projects.length} Total Projects
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((proj) => (
                  <div key={proj.id} className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {proj.type}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> {proj.duration}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{proj.title}</h3>
                      <p className="text-xs text-slate-500 font-semibold flex items-center">
                        <Building className="h-3.5 w-3.5 mr-1" /> {proj.facultyName} • {proj.department}
                      </p>
                      <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">{proj.description}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {proj.requiredSkills.map((sk, idx) => (
                          <span key={idx} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                          Positions: <span className="font-bold text-slate-800">{proj.studentsRequired} required</span>
                        </span>
                        <button
                          onClick={() => {
                            setSelectedProject(proj);
                            setCurrentView('login');
                            setErrorMessage("Please sign in to apply and check your AI compatibility score.");
                            window.scrollTo(0,0);
                          }}
                          className="text-xs font-bold text-blue-600 flex items-center space-x-1 hover:text-blue-800"
                        >
                          <span>Apply & View AI Match</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            LOGIN VIEW
        ======================================================== */}
        {currentView === 'login' && (
          <div className="max-w-md mx-auto px-4 py-16">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 srm-blue-gradient rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to ScholarLink</h2>
                <p className="text-slate-500 text-xs">Access matching analytics and project submissions</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. name@srm.edu"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </form>

              {/* Demo Login Quick Links inside login box */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="block text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demo Accounts Quick Sign-In</span>
                <div className="flex flex-col space-y-1.5">
                  {quickLogins.slice(0, 4).map((login, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLogin(null, login.email, login.password)}
                      className="text-xs text-left bg-slate-50 border border-slate-200/80 hover:bg-blue-50 hover:border-blue-200 p-2.5 rounded-xl font-medium text-slate-700 transition-all flex items-center justify-between"
                    >
                      <span>{login.label}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-semibold font-mono">click to login</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button onClick={() => setCurrentView('register')} className="text-blue-600 font-bold hover:underline">
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            REGISTER VIEW
        ======================================================== */}
        {currentView === 'register' && (
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 srm-blue-gradient rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Join ScholarLink</h2>
                <p className="text-slate-500 text-xs">Create your  ScholarLink academic account</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Dr. Rajesh / Hariharan S"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="e.g. name@srm.edu"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Choose password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                    <select
                      value={registerRole}
                      onChange={(e) => setRegisterRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium bg-white"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={registerDept}
                      onChange={(e) => setRegisterDept(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium bg-white text-ellipsis overflow-hidden"
                    >
                      <option value="Computer Science & Engineering">CSE</option>
                      <option value="Computational Intelligence">CINTEL</option>
                      <option value="Electronics & Communication">ECE</option>
                      <option value="Information Technology">IT</option>
                      <option value="Mechanical Engineering">Mechanical</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {loading ? "Registering..." : "Create Account"}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button onClick={() => setCurrentView('login')} className="text-blue-600 font-bold hover:underline">
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STUDENT DASHBOARD VIEW
        ======================================================== */}
        {currentView === 'student-dash' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Student Welcome Banner */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-slate-800 shadow-lg">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-xs text-blue-300 font-semibold uppercase tracking-wider">ScholarLink • Student Dashboard</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome back, {currentUser?.name}!</h2>
                  <p className="text-slate-300 text-xs md:text-sm font-medium max-w-lg">
                    {currentUser?.department} • {studentProfile?.year || '1st Year'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-2 px-5 text-center">
                    <span className="block text-2xl font-bold tracking-tight">{studentProfile?.cgpa || '0.0'}</span>
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">CGPA</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-2 px-5 text-center">
                    <span className="block text-2xl font-bold tracking-tight">{studentApplications.length}</span>
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Applications</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Summary Panel */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                  <User className="h-4.5 w-4.5 text-blue-600" />
                  <span>Academic Profile Details</span>
                </h3>
                <button
                  onClick={() => setCurrentView('profile-edit')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {studentProfile?.skills?.map((sk, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {sk}
                      </span>
                    )) || <span className="text-xs text-slate-400">None added</span>}
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {studentProfile?.interests?.map((sk, idx) => (
                      <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                        {sk}
                      </span>
                    )) || <span className="text-xs text-slate-400">None added</span>}
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Research Focus</span>
                  <p className="text-xs text-slate-600 font-medium italic">
                    {studentProfile?.researchInterests || "Not specified yet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations Grid & Application History Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Recommendations Block (Left/Center - 2 Columns) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      <span>AI Semantic Match Recommendations</span>
                    </h3>
                    <p className="text-xs text-slate-500">Sorted by semantic compatibility with your profile</p>
                  </div>
                  
                  {/* Small Filters */}
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        placeholder="Filter projects..."
                        className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredRecommendations.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 border border-slate-200/60 shadow-sm text-center">
                      <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <span className="block text-slate-500 font-semibold text-sm">No matches found</span>
                      <span className="text-xs text-slate-400">Try updating your skills or adjusting filters</span>
                    </div>
                  ) : (
                    filteredRecommendations.map((rec) => {
                      const hasApplied = checkAlreadyApplied(rec.project.id);
                      return (
                        <div
                          key={rec.project.id}
                          className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                          {/* Accent Match Bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${rec.matchDetails.matchScore >= 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

                          <div className="space-y-4 flex-grow">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase">
                                  {rec.project.type}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" /> {rec.project.duration}
                                </span>
                              </div>
                              <h4 className="text-lg font-bold text-slate-900">{rec.project.title}</h4>
                              <p className="text-xs text-slate-500 font-bold">
                                {rec.project.facultyName} • {rec.project.department}
                              </p>
                              <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">{rec.project.description}</p>
                            </div>

                            {/* Skills alignment review */}
                            <div className="space-y-3 pt-2">
                              <div>
                                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Aligned Skills</span>
                                <div className="flex flex-wrap gap-1">
                                  {rec.matchDetails.matchingSkills.map((sk, idx) => (
                                    <span key={idx} className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium flex items-center">
                                      <Check className="h-3 w-3 mr-0.5 text-emerald-500" /> {sk}
                                    </span>
                                  ))}
                                  {rec.matchDetails.matchingSkills.length === 0 && (
                                    <span className="text-[10px] text-slate-400 italic">No exact matches</span>
                                  )}
                                </div>
                              </div>

                              {rec.matchDetails.skillGaps.length > 0 && (
                                <div>
                                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Skill Gaps (Minor)</span>
                                  <div className="flex flex-wrap gap-1">
                                    {rec.matchDetails.skillGaps.map((sk, idx) => (
                                      <span key={idx} className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-0.5 text-amber-500" /> {sk}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Explainable AI block */}
                            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-blue-800 font-bold uppercase tracking-wider flex items-center space-x-1 mb-1">
                                <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
                                <span>AI Explanation</span>
                              </span>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                {rec.matchDetails.explanation}
                              </p>
                            </div>
                          </div>

                          {/* Score and Apply Side Panel */}
                          <div className="flex flex-col justify-between items-center md:items-end flex-shrink-0 space-y-4">
                            {renderScoreRing(rec.matchDetails.matchScore, 100)}
                            
                            <button
                              disabled={hasApplied}
                              onClick={() => handleApplyToProject(rec.project.id)}
                              className={`w-full md:w-auto text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer ${
                                hasApplied
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10'
                              }`}
                            >
                              {hasApplied ? "Applied" : "Apply to Project"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Applications submitted list (Right - 1 Column) */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                    <FileCheck className="h-5.5 w-5.5 text-blue-600" />
                    <span>Application History</span>
                  </h3>
                  <p className="text-xs text-slate-500">Track status of submitted applications</p>
                </div>

                <div className="space-y-4">
                  {studentApplications.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-xs text-center space-y-2">
                      <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                      <span className="block text-xs font-bold text-slate-500">No applications yet</span>
                      <p className="text-[11px] text-slate-400">Your applied roles will appear here for tracking</p>
                    </div>
                  ) : (
                    studentApplications.map((app) => {
                      let statusBadge = "bg-amber-100 text-amber-800 border-amber-200";
                      if (app.status === 'Accepted') statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      if (app.status === 'Rejected') statusBadge = "bg-rose-100 text-rose-800 border-rose-200";

                      return (
                        <div key={app.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusBadge}`}>
                              {app.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ""}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{app.projectTitle}</h4>
                            <span className="block text-[11px] text-slate-500 font-medium">Faculty: {app.facultyName}</span>
                          </div>

                          {/* Mini compatibility view */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                            <span className="text-slate-400 font-semibold">Match Score</span>
                            <span className="font-extrabold text-blue-600">{Math.round(app.matchScore * 100)}% Match</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PROFILE EDIT VIEW
        ======================================================== */}
        {currentView === 'profile-edit' && (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="space-y-1 pb-4 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Academic Profile</h2>
                <p className="text-slate-500 text-xs">Maintain correct skills and details to optimize AI recommendations</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Year</label>
                    <select
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium bg-white"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cumulative CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      value={editCgpa}
                      onChange={(e) => setEditCgpa(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    placeholder="e.g. Python, Machine Learning, Deep Learning, SQL"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Separating skills with commas allows semantic tokenization</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Programming Languages (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={editLanguages}
                    onChange={(e) => setEditLanguages(e.target.value)}
                    placeholder="e.g. Python, C++, Java, JavaScript"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Interests (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={editInterests}
                    onChange={(e) => setEditInterests(e.target.value)}
                    placeholder="e.g. Computer Vision, Medical AI, Smart Agriculture"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Completed Coursework (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={editCoursework}
                    onChange={(e) => setEditCoursework(e.target.value)}
                    placeholder="e.g. Machine Learning, Data Structures, Neural Networks"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Research Interests Summary</label>
                  <input
                    type="text"
                    required
                    value={editResearch}
                    onChange={(e) => setEditResearch(e.target.value)}
                    placeholder="e.g. Explainable AI in Healthcare, Low-power Edge Computing"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Project & Practical Experience</label>
                  <textarea
                    rows="4"
                    required
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value)}
                    placeholder="Describe previous projects, hackathon work, or coding assignments in a short paragraph. This text is processed by our semantic transformer model."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentView('student-dash')}
                    className="w-1/2 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {loading ? "Updating..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            FACULTY DASHBOARD VIEW
        ======================================================== */}
        {currentView === 'faculty-dash' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Faculty Welcome Block */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-slate-800 shadow-lg">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-xs text-blue-300 font-semibold uppercase tracking-wider">ScholarLink • Faculty Dashboard</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome, {currentUser?.name}!</h2>
                  <p className="text-slate-300 text-xs md:text-sm font-medium">
                    {currentUser?.department} •  ScholarLink Faculty Portal
                  </p>
                </div>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all self-start md:self-auto cursor-pointer"
                >
                  <Plus className="h-5.5 w-5.5" />
                  <span>Post Research Project</span>
                </button>
              </div>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Projects</span>
                  <span className="text-2xl font-bold tracking-tight text-slate-800">{facultyStats?.projectsCount || 0}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Applicants</span>
                  <span className="text-2xl font-bold tracking-tight text-slate-800">{facultyStats?.applicationsCount || 0}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Reviews</span>
                  <span className="text-2xl font-bold tracking-tight text-slate-800">{facultyStats?.pendingCount || 0}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Match Compatibility</span>
                  <span className="text-2xl font-bold tracking-tight text-slate-800">
                    {facultyStats?.averageMatchScore ? `${Math.round(facultyStats.averageMatchScore * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Split panel: Left - Project selector, Right - Applicants manager */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Project selector (Left - 1 Column) */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Your Projects</h3>
                  <p className="text-xs text-slate-500">Select a project to manage applicants</p>
                </div>

                <div className="space-y-3">
                  {facultyProjects.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xs text-center">
                      <span className="block text-sm font-semibold text-slate-500">No projects posted</span>
                      <button onClick={() => setShowPostModal(true)} className="text-xs text-blue-600 font-bold mt-2 hover:underline">
                        Create your first post
                      </button>
                    </div>
                  ) : (
                    facultyProjects.map((proj) => {
                      const isSelected = selectedFacultyProject?.id === proj.id;
                      return (
                        <div
                          key={proj.id}
                          onClick={() => handleSelectFacultyProject(proj.id)}
                          className={`p-4.5 rounded-2xl border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-xs'
                          }`}
                        >
                          <div className="space-y-2">
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {proj.type}
                            </span>
                            <h4 className="text-sm font-bold leading-snug line-clamp-1">{proj.title}</h4>
                            <span className={`block text-[11px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              Positions: {proj.studentsRequired} required • {proj.duration}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Applicants manager (Right - 2 Columns) */}
              <div className="lg:col-span-2 space-y-6">
                {selectedFacultyProject ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span>Applicants for: {selectedFacultyProject.title}</span>
                        </h3>
                        <p className="text-xs text-slate-500">Applicants are ranked automatically by AI match accuracy</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {projectApplicants.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 border border-slate-200/60 shadow-xs text-center space-y-2">
                          <Users className="h-8 w-8 text-slate-300 mx-auto" />
                          <span className="block text-sm font-bold text-slate-500">No applicants yet</span>
                          <p className="text-xs text-slate-400">Applications submitted by matching students will display here</p>
                        </div>
                      ) : (
                        projectApplicants.map((app) => (
                          <div
                            key={app.id}
                            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden"
                          >
                            {/* Matching scale color bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${app.matchScore >= 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

                            <div className="space-y-4 flex-grow">
                              <div className="space-y-1">
                                <h4 className="text-lg font-bold text-slate-900">{app.studentName}</h4>
                                <span className="block text-xs text-slate-500 font-semibold">
                                  Email: {app.studentEmail}
                                </span>
                              </div>

                              {/* Skills alignment */}
                              <div className="space-y-2.5">
                                <div>
                                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Aligned Skills</span>
                                  <div className="flex flex-wrap gap-1">
                                    {app.matchingSkills.map((sk, idx) => (
                                      <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium flex items-center border border-emerald-100">
                                        <Check className="h-2.5 w-2.5 mr-0.5 text-emerald-500" /> {sk}
                                      </span>
                                    ))}
                                    {app.matchingSkills.length === 0 && (
                                      <span className="text-[10px] text-slate-400 italic">No direct matches</span>
                                    )}
                                  </div>
                                </div>

                                {app.skillGaps.length > 0 && (
                                  <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Potential Skill Gaps</span>
                                    <div className="flex flex-wrap gap-1">
                                      {app.skillGaps.map((sk, idx) => (
                                        <span key={idx} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium flex items-center border border-amber-100">
                                          <AlertCircle className="h-2.5 w-2.5 mr-0.5 text-amber-500" /> {sk}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Explainable AI report block */}
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-[9px] text-blue-900 font-bold uppercase tracking-wider flex items-center space-x-1 mb-1">
                                  <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
                                  <span>AI Explainable Rationale</span>
                                </span>
                                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                  {app.explanation}
                                </p>
                              </div>
                            </div>

                            {/* Actions & Score */}
                            <div className="flex flex-col justify-between items-center md:items-end flex-shrink-0 space-y-4">
                              {renderScoreRing(app.matchScore, 90)}
                              
                              <div className="w-full flex items-center space-x-2">
                                {app.status === 'Pending' ? (
                                  <>
                                    <button
                                      onClick={() => handleUpdateApplicationStatus(app.id, 'Rejected')}
                                      className="w-1/2 md:w-auto bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-100 text-xs font-bold py-2 px-3 rounded-lg transition-all"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleUpdateApplicationStatus(app.id, 'Accepted')}
                                      className="w-1/2 md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all shadow-sm"
                                    >
                                      Accept
                                    </button>
                                  </>
                                ) : (
                                  <span className={`text-xs font-bold px-4 py-1.5 rounded-full border text-center w-full uppercase ${
                                    app.status === 'Accepted'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : 'bg-rose-50 border-rose-200 text-rose-800'
                                  }`}>
                                    {app.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-3xl p-12 border border-slate-200/60 shadow-xs text-center space-y-2">
                    <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
                    <span className="block text-sm font-bold text-slate-600">Select a project to review applicants</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          FACULTY POST NEW PROJECT MODAL
      ======================================================== */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 transform animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Post Research / Academic Project</h3>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePostProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  placeholder="e.g. AI-Based Medical Image Classification with Vision Transformers"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Project Type</label>
                  <select
                    value={newProjType}
                    onChange={(e) => setNewProjType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium bg-white"
                  >
                    <option value="Research Project">Research Project</option>
                    <option value="Final Year Project">Final Year Project</option>
                    <option value="Mini Project">Mini Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Domain</label>
                  <input
                    type="text"
                    required
                    value={newProjDomain}
                    onChange={(e) => setNewProjDomain(e.target.value)}
                    placeholder="e.g. Medical AI / IoT"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={newProjDuration}
                    onChange={(e) => setNewProjDuration(e.target.value)}
                    placeholder="e.g. 6 Months"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Positions Needed</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProjStudents}
                    onChange={(e) => setNewProjStudents(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Required Skills (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={newProjSkills}
                  onChange={(e) => setNewProjSkills(e.target.value)}
                  placeholder="e.g. Python, Deep Learning, PyTorch, NumPy"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detailed Description</label>
                <textarea
                  rows="4"
                  required
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Detail the project goals, experimental techniques, coding tasks, and output expectations. A detailed description optimizes the AI semantic matching results."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="w-1/2 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {loading ? "Posting..." : "Post Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer block */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ScholarLink Academic Collaboration Platform</span>
          <p className="text-sm"> ScholarLink © 2026. Empowered by Explainable AI & Semantic Matching.</p>
        </div>
      </footer>
    </div>
  );
}

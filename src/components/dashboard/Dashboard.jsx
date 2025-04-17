import React, { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import Chatbot from "../Chatbot";
import JobStatsChart from "./JobStatsChart";



// Extension Download Component
const InstallExtension = () => {
  const EXTENSION_DOWNLOAD_URL = "src/components/dashboard/Karyatra Extension.zip";
  
  return (
    <button 
      onClick={() => window.open(EXTENSION_DOWNLOAD_URL, "_blank")}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
    >
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
      </svg>
      Download Chrome Extension
    </button>
  );
};

// Job Reducer Function
const jobReducer = (state, action) => {
  if (action.name) {
    return { ...state, [action.name]: action.value };
  }
  return state;
};

// Spinner Component
const Spinner = ({ size = 'small' }) => (
  <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${
    size === 'small' ? 'h-5 w-5' : 'h-8 w-8'
  }`}></div>
);

// Delete Icon Component
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

// Resource Card Component - Updated
const ResourceCard = ({ title, description, url, icon, skillBased = false }) => (
  <a 
    href={url} 
    target="_blank" 
    rel="noopener noreferrer"
    className={`bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border ${skillBased ? 'border-blue-300' : 'border-gray-200'} flex flex-col h-full`}
  >
    <div className="flex items-start mb-2">
      <span className="text-2xl mr-3">{icon}</span>
      <h4 className={`font-medium ${skillBased ? 'text-blue-700' : 'text-gray-700'}`}>{title}</h4>
    </div>
    <p className="text-sm text-gray-600 mt-auto">{description}</p>
  </a>
);

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [bookmarksData, setBookmarksData] = useState({});
  const [skillGaps, setSkillGaps] = useState({});
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [skillGapsLoading, setSkillGapsLoading] = useState(false);
  const [deletingBookmark, setDeletingBookmark] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [resumeFile, setResumeFile] = useState(null);
  const isMounted = useRef(true);
  const [resourcesData, setResourcesData] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('data analyst');
  const [jobsFromGmail, setJobsFromGmail] = useState([]);

  



  
  // Comprehensive job roles with detailed skills and resources
  const jobRoles = {
    "data analyst": {
      "skills": [
        "python", "excel", "sql", "data visualization", "statistics",
        "pandas", "power bi", "tableau", "data cleaning", "business analysis"
      ],
      "resources": {
        "LinkedIn Learning": "https://www.linkedin.com/learning/paths/become-a-data-analyst",
        "Forage Virtual Internship": "https://www.theforage.com/virtual-internships/prototype/ytc/JP-Morgan-Data-Analytics-Virtual-Experience",
        "DataCamp Courses": "https://www.datacamp.com/career-tracks/data-analyst",
        "Kaggle Learn": "https://www.kaggle.com/learn",
        "Google Data Analytics Certificate": "https://www.coursera.org/professional-certificates/google-data-analytics"
      }
    },
    "web developer": {
      "skills": [
        "html", "css", "javascript", "react", "node.js",
        "express", "mongodb", "git", "responsive design", "typescript",
        "rest api", "graphql", "webpack", "jest"
      ],
      "resources": {
        "LinkedIn Learning": "https://www.linkedin.com/learning/paths/become-a-web-developer",
        "Forage Virtual Internship": "https://www.theforage.com/virtual-internships/prototype/yzg/Accenture-Developer-Virtual-Experience",
        "freeCodeCamp": "https://www.freecodecamp.org/learn",
        "Frontend Mentor": "https://www.frontendmentor.io/",
        "MDN Web Docs": "https://developer.mozilla.org/",
        "JavaScript.info": "https://javascript.info/"
      }
    },
    "software engineer": {
      "skills": [
        "java", "python", "c++", "data structures", "algorithms",
        "system design", "docker", "kubernetes", "aws", "rest api",
        "microservices", "testing", "debugging", "oop"
      ],
      "resources": {
        "LeetCode": "https://leetcode.com/",
        "CodeSignal": "https://codesignal.com/",
        "Grokking the System Design Interview": "https://www.educative.io/courses/grokking-the-system-design-interview",
        "The Missing Semester": "https://missing.csail.mit.edu/",
        "Tech Interview Handbook": "https://www.techinterviewhandbook.org/",
        "NeetCode": "https://neetcode.io/"
      }
    },
    "ux/ui designer": {
      "skills": [
        "figma", "adobe xd", "user research", "wireframing", "prototyping",
        "interaction design", "color theory", "typography", "user testing",
        "accessibility", "design systems", "user flows"
      ],
      "resources": {
        "Google UX Design Certificate": "https://www.coursera.org/professional-certificates/google-ux-design",
        "Figma Learn": "https://www.figma.com/resources/learn-design/",
        "UX Collective": "https://uxdesign.cc/",
        "Awwwards": "https://www.awwwards.com/",
        "Laws of UX": "https://lawsofux.com/",
        "UI Design Daily": "https://www.uidesigndaily.com/"
      }
    },
    "product manager": {
      "skills": [
        "product strategy", "roadmapping", "user stories", "agile methodology",
        "market research", "competitive analysis", "stakeholder management", "jira",
        "prioritization", "metrics analysis", "customer discovery"
      ],
      "resources": {
        "Product School": "https://www.productschool.com/",
        "Lenny's Newsletter": "https://www.lennysnewsletter.com/",
        "Product Management Exercises": "https://www.productmanagementexercises.com/",
        "Marty Cagan's Blog": "https://svpg.com/articles/",
        "The Product Book": "https://www.productbook.com/",
        "Mind the Product": "https://www.mindtheproduct.com/"
      }
    },
    "data scientist": {
      "skills": [
        "python", "r", "machine learning", "statistics", "data visualization",
        "sql", "pandas", "numpy", "tensorflow", "pytorch",
        "natural language processing", "deep learning", "data mining"
      ],
      "resources": {
        "Kaggle": "https://www.kaggle.com/",
        "Fast.ai": "https://course.fast.ai/",
        "Towards Data Science": "https://towardsdatascience.com/",
        "DeepLearning.AI": "https://www.deeplearning.ai/",
        "Data Science Central": "https://www.datasciencecentral.com/",
        "Google Machine Learning Crash Course": "https://developers.google.com/machine-learning/crash-course"
      }
    },
    "devops engineer": {
      "skills": [
        "docker", "kubernetes", "aws", "azure", "ci/cd",
        "terraform", "ansible", "jenkins", "linux", "bash scripting",
        "monitoring", "infrastructure as code"
      ],
      "resources": {
        "DevOps Roadmap": "https://roadmap.sh/devops",
        "Kubernetes Docs": "https://kubernetes.io/docs/home/",
        "AWS Training": "https://aws.amazon.com/training/",
        "DevOps Bootcamp": "https://www.udemy.com/course/devopsbootcamp/",
        "Google Cloud Training": "https://cloud.google.com/training",
        "The DevOps Handbook": "https://www.amazon.com/DevOps-Handbook-World-Class-Reliability-Organizations/dp/1942788002"
      }
    }
  };

  const initialState = {
    company: '',
    role: '',
    description: '',
    salary: '',
    status: 'Applied',
    applicationDate: null,
    skills: '',
    url: ''
  };
  
  const [newJob, dispatch] = useReducer(jobReducer, initialState);

  const db = getFirestore();

 // Modified getSkillResources to include more specific platform links
const getSkillResources = (skill) => {
  const skillResources = {
    "python": [
      { platform: "Python Official Docs", url: "https://docs.python.org/3/" },
      { platform: "Real Python", url: "https://realpython.com/" },
      { platform: "Python Crash Course", url: "https://ehmatthes.github.io/pcc/" },
      { platform: "LeetCode Python", url: "https://leetcode.com/problemset/python/" },
      { platform: "Forage Data Analytics", url: "https://www.theforage.com/virtual-internships/prototype/ytc/JP-Morgan-Data-Analytics-Virtual-Experience" }
    ],
    "javascript": [
      { platform: "MDN JavaScript", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
      { platform: "JavaScript.info", url: "https://javascript.info/" },
      { platform: "Eloquent JavaScript", url: "https://eloquentjavascript.net/" },
      { platform: "LeetCode JavaScript", url: "https://leetcode.com/problemset/javascript/" },
      { platform: "Forage Web Development", url: "https://www.theforage.com/virtual-internships/prototype/yzg/Accenture-Developer-Virtual-Experience" }
    ],
    "sql": [
      { platform: "SQLZoo", url: "https://sqlzoo.net/" },
      { platform: "Mode SQL Tutorial", url: "https://mode.com/sql-tutorial/" },
      { platform: "SQLBolt", url: "https://sqlbolt.com/" },
      { platform: "LeetCode SQL", url: "https://leetcode.com/problemset/database/" },
      { platform: "Forage Data Analytics", url: "https://www.theforage.com/virtual-internships/prototype/ytc/JP-Morgan-Data-Analytics-Virtual-Experience" }
    ],
    "react": [
      { platform: "React Official Docs", url: "https://reactjs.org/docs/getting-started.html" },
      { platform: "React Tutorial", url: "https://react-tutorial.app/" },
      { platform: "Epic React", url: "https://epicreact.dev/" },
      { platform: "LeetCode Front End", url: "https://leetcode.com/problemset/frontend/" },
      { platform: "Forage Web Development", url: "https://www.theforage.com/virtual-internships/prototype/yzg/Accenture-Developer-Virtual-Experience" }
    ],
    "data structures": [
      { platform: "VisuAlgo", url: "https://visualgo.net/en" },
      { platform: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/data-structures/" },
      { platform: "CodeChef", url: "https://www.codechef.com/certification/data-structures-and-algorithms/prepare" },
      { platform: "LeetCode DS & Algorithms", url: "https://leetcode.com/explore/learn/" },
      { platform: "Forage Software Development", url: "https://www.theforage.com/virtual-internships/prototype/hzmoNKtzvAzXsEqx8/Goldman-Sachs-Software-Engineering-Virtual-Experience" }
    ],
    "aws": [
      { platform: "AWS Training", url: "https://aws.amazon.com/training/" },
      { platform: "AWS Docs", url: "https://docs.aws.amazon.com/" },
      { platform: "AWS Free Tier", url: "https://aws.amazon.com/free/" },
      { platform: "Forage Cloud Engineering", url: "https://www.theforage.com/virtual-internships/prototype/9q7FuwKL8SfpCLQK7/Clifford-Chance-Cloud-Computing-Virtual-Experience-Programme" }
    ]
  };

  return skillResources[skill.toLowerCase()] || [
    { platform: "LeetCode", url: `https://leetcode.com/problemset/all/?search=${skill.replace(' ', '%20')}` },
    { platform: "Forage Programs", url: `https://www.theforage.com/browse-programs?keywords=${skill.replace(' ', '%20')}` },
    { platform: "LinkedIn Learning", url: `https://www.linkedin.com/learning/search?keywords=${skill.replace(' ', '%20')}` }
  ];
};

  // Analyze resume against selected job role
  const analyzeResume = useCallback(async () => {
    if (!resumeFile) {
      toast.error("Please upload your resume first");
      return null;
    }

    try {
      setSkillGapsLoading(true);
      
      const formData = new FormData();
      formData.append('file', resumeFile);
      
      const response = await fetch("http://localhost:5002/analyze_resume", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Resume analysis failed");
      }

      const data = await response.json();

      // Verify we got skills data
      if (!data.skills || data.skills.length === 0) {
        throw new Error("No skills found in resume. Please ensure your resume has a clear Skills section.");
      }

      return data;
    } catch (error) {
      console.error("Resume analysis error:", error);
      toast.error(error.message);
      return null;
    } finally {
      setSkillGapsLoading(false);
    }
  }, [resumeFile]);

  const fetchGmailApplications = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5004/api/applications");
      if (!response.ok) throw new Error("Failed to fetch Gmail applications");
  
      const data = await response.json();
      console.log("Gmail Applications:", data); // for debugging
      setJobsFromGmail(data.applications || []);
    } catch (error) {
      console.error("Error fetching Gmail applications:", error);
      toast.error("Could not load Gmail job applications.");
    }
  }, []);
  
  // Perform skill gap analysis with improved matching
const performSkillGapAnalysis = useCallback(async () => {
  try {
    setSkillGapsLoading(true);
    
    // First analyze the resume to get skills
    const analysisResult = await analyzeResume();
    if (!analysisResult) {
      throw new Error("Resume analysis failed");
    }
    
    if (!analysisResult.skills || analysisResult.skills.length === 0) {
      throw new Error("No skills could be extracted from your resume.");
    }

    // Get the selected role data
    const roleData = jobRoles[selectedRole.toLowerCase()];
    if (!roleData) {
      throw new Error(`Job role '${selectedRole}' is not in our database.`);
    }

    // Helper function to normalize skills for better matching
    const normalizeSkill = (skill) => {
      return skill.toLowerCase()
        .trim()
        .replace(/[-_./]/g, ' ') // Replace common separators with spaces
        .replace(/\s+/g, ' ');   // Normalize spaces
    };
    
    // Helper function to check if two skills match
    const skillsMatch = (resumeSkill, roleSkill) => {
      const normalizedResumeSkill = normalizeSkill(resumeSkill);
      const normalizedRoleSkill = normalizeSkill(roleSkill);
      
      // Check for exact match
      if (normalizedResumeSkill === normalizedRoleSkill) {
        return true;
      }
      
      // Check if one contains the other 
      if (normalizedResumeSkill.includes(normalizedRoleSkill) || 
          normalizedRoleSkill.includes(normalizedResumeSkill)) {
        return true;
      }
      
      // Handle common aliases (could be expanded)
      const aliases = {
        'javascript': ['js'],
        'typescript': ['ts'],
        'python': ['py'],
        'react': ['reactjs', 'react.js'],
        'node.js': ['nodejs', 'node'],
        'postgresql': ['postgres'],
        'firebase': ['firestore'],
        'mongodb': ['mongo'],
        
      };
      
      // Check aliases
      for (const [skill, aliasList] of Object.entries(aliases)) {
        if ((normalizedRoleSkill === skill && aliasList.includes(normalizedResumeSkill)) ||
            (normalizedResumeSkill === skill && aliasList.includes(normalizedRoleSkill))) {
          return true;
        }
      }
      
      return false;
    };

    // Find matched and missing skills with improved matching logic
    const matchedSkills = [];
    const missingSkills = [];
    
    // Normalize resume skills once
    const normalizedResumeSkills = analysisResult.skills.map(skill => skill.trim());
    
    // For each skill in the role requirements, check if it exists in resume skills
    roleData.skills.forEach(roleSkill => {
      // Check if any resume skill matches this role skill
      const isSkillMatched = normalizedResumeSkills.some(resumeSkill => 
        skillsMatch(resumeSkill, roleSkill)
      );
      
      if (isSkillMatched) {
        matchedSkills.push(roleSkill);
      } else {
        missingSkills.push(roleSkill);
      }
    });

    // Log for debugging
    console.log("Resume skills:", normalizedResumeSkills);
    console.log("Matched skills:", matchedSkills);
    console.log("Missing skills:", missingSkills);

    // Prepare the result
    const result = {
      selectedRole,
      matchedSkills,
      missingSkills,
      recommendations: roleData.resources,
      skillResources: missingSkills.reduce((acc, skill) => {
        acc[skill] = getSkillResources(skill);
        return acc;
      }, {})
    };

    setSkillGaps(result);
    return result;

  } catch (error) {
    console.error("Skill gap analysis error:", error);
    toast.error(error.message);
    setSkillGaps({});
    return null;
  } finally {
    setSkillGapsLoading(false);
  }
}, [analyzeResume, selectedRole]);

  // Fetch bookmarks from Flask backend
  const fetchBookmarks = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setBookmarksLoading(true);
      const response = await fetch("http://127.0.0.1:5001/bookmarks", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch bookmarks: ${response.status}`);
      }
      
      const data = await response.json();
      setBookmarksData(data || {});
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      toast.error(`Failed to load bookmarks: ${error.message}`);
      setBookmarksData({});
    } finally {
      setBookmarksLoading(false);
    }
  }, [currentUser]);

  // Add a new bookmark
  const addBookmark = async (bookmarkData) => {
    try {
      setBookmarksLoading(true);
      const response = await fetch("http://127.0.0.1:5001/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookmarkData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add bookmark: ${response.status}`);
      }

      toast.success("Bookmark added successfully");
      fetchBookmarks();
    } catch (error) {
      console.error("Error adding bookmark:", error);
      toast.error(`Failed to add bookmark: ${error.message}`);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOC, or DOCX file');
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      
      setResumeFile(file);
    }
  };

  const fetchUserData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      } else {
        console.log("No user data found");
        setUserData({});
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
      setUserData({});
    }
  }, [currentUser, db]);

  const fetchJobs = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const jobsQuery = query(
        collection(db, 'jobs'), 
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(jobsQuery);
      
      if (!isMounted.current) return;
      
      const jobsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let applicationDate = null;
        if (data.applicationDate) {
          if (typeof data.applicationDate.toDate === 'function') {
            applicationDate = data.applicationDate.toDate();
          } else if (data.applicationDate instanceof Date) {
            applicationDate = data.applicationDate;
          } else if (typeof data.applicationDate === 'string') {
            applicationDate = new Date(data.applicationDate);
          }
        }
        
        return {
          id: doc.id,
          ...data,
          applicationDate,
          skills: Array.isArray(data.skills) ? data.skills : []
        };
      });
      
      setJobs(jobsData || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [currentUser, db]);

  // Fetch resources from Flask backend
  const fetchResources = useCallback(async (forceRefresh = false) => {
    try {
      setResourcesLoading(true);
      
      if (forceRefresh) {
        await fetch("http://127.0.0.1:5003/resources_for_all_bookmarks");
        toast.success("Resources updated successfully!");
      }

      const response = await fetch("http://127.0.0.1:5003/resources_from_db");
      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }
      const data = await response.json();
      setResourcesData(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error(`Failed to load resources: ${error.message}`);
      setResourcesData([]);
    } finally {
      setResourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchUserData();
    fetchJobs();
    fetchBookmarks();
    fetchResources();
    fetchGmailApplications(); 
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchUserData, fetchJobs, fetchBookmarks, fetchResources, fetchGmailApplications]);

  const handleChange = (e) => {
    dispatch({ name: e.target.name, value: e.target.value });
  };

  const handleDateChange = (date) => {
    dispatch({ name: 'applicationDate', value: date });
  };

  const resetForm = () => {
    Object.keys(initialState).forEach(key => dispatch({ name: key, value: initialState[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newJob.company || !newJob.role || !newJob.applicationDate) {
      toast.error("Please fill all required fields!");
      return;
    }
  
    try {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('userId', '==', currentUser.uid),
        where('company', '==', newJob.company),
        where('role', '==', newJob.role)
      );
      const querySnapshot = await getDocs(jobsQuery);
  
      if (!querySnapshot.empty) {
        toast.warning("You have already added this job application!");
        return;
      }
  
      const jobData = {
        ...newJob,
        userId: currentUser.uid,
        skills: newJob.skills ? newJob.skills.split(',').map(skill => skill.trim()) : [],
        applicationDate: newJob.applicationDate,
        createdAt: serverTimestamp(),
      };
  
      const docRef = await addDoc(collection(db, 'jobs'), jobData);
  
      setJobs(prevJobs => [
        ...prevJobs,
        {
          ...jobData,
          id: docRef.id,
          applicationDate: newJob.applicationDate
        }
      ]);
  
      toast.success("Job application added successfully!");
      resetForm();
    } catch (error) {
      console.error('Error adding job:', error);
      toast.error("Failed to add job application.");
    }
  };
      
  const updateStatus = async (id, status) => {
    try {
      const jobRef = doc(db, "jobs", id);
      await updateDoc(jobRef, { status });
  
      setJobs(prevJobs =>
        prevJobs.map(job => 
          job.id === id ? { ...job, status } : job
        )
      );
      
      toast.info(`Status updated to ${status}`);
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status.");
    }
  };
    
  const deleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job application?")) return;
    
    try {
      await deleteDoc(doc(db, "jobs", id));
      setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
      toast.success("Job application deleted!");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job.");
    }
  };

  const deleteBookmark = async (url) => {
    try {
      setDeletingBookmark(url);
      const response = await fetch("http://localhost:5001/bookmarks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete bookmark');
      }

      toast.success("Bookmark deleted successfully");
      fetchBookmarks();
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      toast.error(error.message);
    } finally {
      setDeletingBookmark(null);
    }
  };

  // Job Statistics
  const combinedJobs = [...jobs, ...jobsFromGmail];
  const totalApplications = combinedJobs.length;
  const interviewScheduled = combinedJobs.filter(job => job.status === "Interview Scheduled").length;
  const offersReceived = combinedJobs.filter(job => job.status === "Offer Received").length;
  const rejectedApplications = combinedJobs.filter(job => job.status === "Rejected").length;

  
  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Extension Download Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-blue-800">Enhance Your Job Search</h2>
          <p className="text-blue-600">Install our Chrome extension to track job applications automatically</p>
        </div>
        <InstallExtension />
      </div>

      {/* Display User Details */}
      {userData ? (
        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold">User Profile</h2>
          <p><strong>Name:</strong> {userData.name || 'Not specified'}</p>
          <p><strong>Age:</strong> {userData.age || 'Not specified'}</p>
          <p><strong>Status:</strong> {userData.status || 'Not specified'}</p>
          <p><strong>Qualifications:</strong> {userData.qualifications || 'Not specified'}</p>
        </div>
      ) : (
        <div className="flex justify-center">
          <Spinner size="large" />
        </div>
      )}

      {/* Job Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold">{totalApplications}</h2>
          <p>Total Applications</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold">{interviewScheduled}</h2>
          <p>Interview Scheduled</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold">{offersReceived}</h2>
          <p>Offers Received</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold">{rejectedApplications}</h2>
          <p>Rejected Applications</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'jobs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('jobs')}
        >
          Job Applications
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'bookmarks' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          Bookmarks
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'skillGaps' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('skillGaps')}
        >
          Skill Gap Analysis
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'resources' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </button>

        <button
        className={`py-2 px-4 font-medium ${activeTab === 'stats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab('stats')}
        >
        Dashboard
      </button>

      </div>

      {/* Add Job Application Form */}
      {activeTab === 'jobs' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Job Application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                name="company" 
                placeholder="Company *" 
                className="w-full p-2 border rounded" 
                value={newJob.company} 
                onChange={handleChange} 
                required 
              />
              <input 
                type="text" 
                name="role" 
                placeholder="Role *" 
                className="w-full p-2 border rounded" 
                value={newJob.role} 
                onChange={handleChange} 
                required 
              />
              <input 
                type="number" 
                name="salary" 
                placeholder="Salary" 
                className="w-full p-2 border rounded" 
                value={newJob.salary} 
                onChange={handleChange} 
                min="0"
              />
              <DatePicker
                selected={newJob.applicationDate}
                onChange={handleDateChange}
                className="w-full p-2 border rounded"
                placeholderText="Select Application Date *"
                dateFormat="MMMM d, yyyy"
                required
              />
              <input 
                type="url" 
                name="url" 
                placeholder="Job URL (optional)" 
                className="w-full p-2 border rounded" 
                value={newJob.url} 
                onChange={handleChange} 
              />
            </div>
            <input 
              type="text" 
              name="skills" 
              placeholder="Skills (comma separated)" 
              className="w-full p-2 border rounded" 
              value={newJob.skills} 
              onChange={handleChange} 
            />
            <textarea 
              name="description" 
              placeholder="Job Description" 
              className="w-full p-2 border rounded" 
              value={newJob.description} 
              onChange={handleChange} 
              rows="4" 
            />
            <button 
              type="submit" 
              className="w-full bg-violet-600 text-white py-2 px-4 rounded hover:bg-violet-700 transition-colors"
            >
              Add Job Application
            </button>
          </form>
        </div>
      )}
      
      {/* Tab Content */}
      {activeTab === 'jobs' && (
        <>
          <h2 className="text-xl font-semibold mb-4">Your Job Applications</h2>
          {loading ? (
            <div className="flex justify-center">
              <Spinner size="large" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-center text-gray-500">No job applications found.</p>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{job.company} - {job.role}</h3>
                    <p className="text-gray-600">{job.description}</p>
                    <p className="mt-2">Skills: {job.skills?.join(', ') || 'N/A'}</p>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <p className="text-sm text-gray-500">Salary: <span className="font-bold">${job.salary || 'Not specified'}</span></p>
                      <p className="text-sm text-gray-500">Status: <span className="font-bold">{job.status}</span></p>
                      {job.applicationDate && (
                        <p className="text-sm text-gray-500">
                          Applied: <span className="font-bold">{job.applicationDate.toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>
                    {job.url && (
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-block mt-2 text-blue-500 hover:underline"
                      >
                        View Job Posting
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <select 
                      value={job.status} 
                      onChange={(e) => updateStatus(job.id, e.target.value)} 
                      className="p-2 border rounded flex-1 md:flex-none"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Offer Received">Offer Received</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <button 
                      onClick={() => deleteJob(job.id)} 
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'bookmarks' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Saved Job Bookmarks</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const url = prompt("Enter bookmark URL:");
                  const title = prompt("Enter bookmark title:");
                  if (url) addBookmark({ url, title: title || url, site: new URL(url).hostname });
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                title="Add bookmark"
              >
                Add Bookmark
              </button>
              <button 
                onClick={fetchBookmarks}
                className="text-gray-500 hover:text-blue-500 transition-colors"
                title="Refresh bookmarks"
                disabled={bookmarksLoading}
              >
                {bookmarksLoading ? (
                  <Spinner size="small" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
                  
          {bookmarksLoading ? (
            <div className="flex justify-center">
              <Spinner size="large" />
            </div>
          ) : Object.keys(bookmarksData).length === 0 ? (
            <p className="text-center text-gray-500">No bookmarks found.</p>
          ) : (
            <div className="grid gap-6">
              {Object.entries(bookmarksData).map(([site, bookmarks = []]) => (
                <div key={site} className="bg-white p-4 rounded-lg shadow-md transition-all hover:shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-800">
                      {site}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {bookmarks.map((bookmark, index) => (
                      <div 
                        key={`${site}-${index}`}
                        className="flex justify-between items-center group hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <a 
                          href={bookmark.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex-1 truncate pr-2"
                          title={bookmark.title || bookmark.url}
                        >
                          {bookmark.title || bookmark.url}
                        </a>
                        
                        <button 
                          onClick={() => deleteBookmark(bookmark.url)} 
                          disabled={deletingBookmark === bookmark.url}
                          className={`ml-2 ${
                            deletingBookmark === bookmark.url 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-red-500'
                          } transition-colors`}
                          title="Delete bookmark"
                        >
                          {deletingBookmark === bookmark.url ? (
                            <Spinner size="small" />
                          ) : (
                            <DeleteIcon />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
        


      {activeTab === 'skillGaps' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Skill Gap Analysis</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Your Resume (PDF, DOC, DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {resumeFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {resumeFile.name}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Job Role to Compare Against
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {Object.keys(jobRoles).map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={performSkillGapAnalysis}
            disabled={!resumeFile || skillGapsLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              !resumeFile || skillGapsLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {skillGapsLoading ? (
              <div className="flex items-center justify-center">
                <Spinner size="small" />
                <span className="ml-2">Analyzing...</span>
              </div>
            ) : (
              'Analyze Skills'
            )}
          </button>
          
          {skillGapsLoading && (
            <div className="mt-4 text-center text-gray-600">
              Analyzing your resume for skills...
            </div>
          )}
          
          {skillGaps.matchedSkills && (
            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-medium">Your Skills vs. {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Requirements</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-3">✅ Skills You Already Have</h4>
                  {skillGaps.matchedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skillGaps.matchedSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No matching skills found</p>
                  )}
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-3">❌ Skills You Need to Learn</h4>
                  {skillGaps.missingSkills && skillGaps.missingSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skillGaps.missingSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No missing skills found - great job!</p>
                  )}
                </div>
              </div>

              {skillGaps.recommendations && Object.keys(skillGaps.recommendations).length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📚 Recommended Learning Resources</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(skillGaps.recommendations).map(([platform, url]) => (
                      <li key={platform}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {platform}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {skillGaps.missingSkills && skillGaps.missingSkills.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">🔍 Detailed Skill Resources</h4>
                  <div className="space-y-4">
                    {skillGaps.missingSkills.map((skill, index) => (
                      <div key={index} className="bg-white p-3 rounded shadow-sm">
                        <h5 className="font-medium">{skill}</h5>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {getSkillResources(skill).map((resource, i) => (
                            <a
                              key={i}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full hover:bg-gray-200"
                            >
                              {resource.platform}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

{activeTab === 'resources' && (
  <>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Learning Resources</h2>
      <div className="flex gap-2">
        <button 
          onClick={() => fetchResources(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Refresh Recommendations
        </button>
        <button
          onClick={performSkillGapAnalysis}
          disabled={!resumeFile}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            !resumeFile
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          Analyze Resume for Resources
        </button>
      </div>
    </div>
    
    {resourcesLoading ? (
      <div className="flex justify-center">
        <Spinner size="large" />
      </div>
    ) : (
      <>
        {/* Skill-based resources (only show if skill gaps analysis is done) */}
        {skillGaps.missingSkills && skillGaps.missingSkills.length > 0 && (
          <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-bold mb-4">Recommended Resources Based on Your Skill Gaps</h3>
            <div className="space-y-4">
              {skillGaps.missingSkills.map((skill, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-blue-700">{skill.charAt(0).toUpperCase() + skill.slice(1)}</h4>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {getSkillResources(skill).map((resource, i) => (
                      <a
                        key={i}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {resource.platform}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Forage section for skill gaps */}
            <div className="mt-6">
              <h4 className="font-medium text-blue-800 mb-3">Forage Virtual Internships</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillGaps.missingSkills.slice(0, 4).map((skill, index) => {
                  const forageLink = skill === "python" || skill === "data structures" || skill === "sql" 
                    ? "https://www.theforage.com/virtual-internships/prototype/ytc/JP-Morgan-Data-Analytics-Virtual-Experience"
                    : skill === "javascript" || skill === "react"
                    ? "https://www.theforage.com/virtual-internships/prototype/yzg/Accenture-Developer-Virtual-Experience"
                    : `https://www.theforage.com/browse-programs?keywords=${skill.replace(' ', '%20')}`;
                  
                  const forageTitle = skill === "python" || skill === "data structures" || skill === "sql"
                    ? "JP Morgan Data Analytics"
                    : skill === "javascript" || skill === "react"
                    ? "Accenture Developer Experience"
                    : `${skill.charAt(0).toUpperCase() + skill.slice(1)} Programs`;
                  
                  return (
                    <ResourceCard
                      key={index}
                      title={forageTitle}
                      description={`Learn ${skill} through virtual experience`}
                      url={forageLink}
                      icon="🚀"
                      skillBased={true}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* LeetCode Practice section tied to skill gaps */}
        <div className="mt-6 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">LeetCode Practice by Skill</h3>
          {skillGaps.missingSkills && skillGaps.missingSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillGaps.missingSkills.map((skill, index) => {
                let leetCodeLink = "https://leetcode.com/problemset/all/";
                let description = "Practice coding problems";
                
                if (skill === "python") {
                  leetCodeLink = "https://leetcode.com/problemset/python/";
                  description = "Python specific problems and solutions";
                } else if (skill === "javascript") {
                  leetCodeLink = "https://leetcode.com/problemset/javascript/";
                  description = "JavaScript focused challenges";
                } else if (skill === "data structures" || skill === "algorithms") {
                  leetCodeLink = "https://leetcode.com/explore/learn/";
                  description = "Data structures and algorithms problems";
                } else if (skill === "sql") {
                  leetCodeLink = "https://leetcode.com/problemset/database/";
                  description = "SQL database query challenges";
                }
                
                return (
                  <ResourceCard
                    key={index}
                    title={`${skill.charAt(0).toUpperCase() + skill.slice(1)} Practice`}
                    description={description}
                    url={leetCodeLink}
                    icon="💻"
                    skillBased={true}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">Upload your resume and analyze your skills to get personalized LeetCode recommendations.</p>
          )}
        </div>

        {/* Interview Preparation Resources */}
        <div className="mt-6 bg-green-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Interview Preparation Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ResourceCard 
              title="Interviewing.io"
              description="Practice technical interviews"
              url="https://interviewing.io/"
              icon="🎤"
            />
            <ResourceCard 
              title="Pramp"
              description="Free peer-to-peer mock interviews"
              url="https://www.pramp.com/"
              icon="🤝"
            />
            <ResourceCard 
              title="Glassdoor Interviews"
              description="Company-specific interview questions"
              url="https://www.glassdoor.com/Interview/index.htm"
              icon="🏢"
            />
            
          </div>
          
          
        </div>
      </>
    )}
    
  </>
  
  
)}

{jobsFromGmail.length > 0 && (
  <>
    <h2 className="text-xl font-semibold mt-10 mb-4">📬 Applications Extracted from Gmail</h2>
    <div className="grid gap-4">
      {jobsFromGmail.map((job, index) => (
        <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-md">
          <h3 className="font-bold text-blue-800">{job.company} - {job.role}</h3>
          <p>Status: <span className="font-semibold">{job.status}</span></p>
          <p>Date Received: {new Date(job.date_received).toLocaleDateString()}</p>
          <p>Subject: {job.subject}</p>
          <p>From: {job.sender}</p>
          {job.gmail_link && (
            <a 
              href={job.gmail_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              View Email on Gmail
            </a>
          )}
        </div>
      ))}
    </div>
    
  </>
  
)}

{activeTab === 'stats' && (
  <JobStatsChart jobs={combinedJobs} />
)}

      {/* Chatbot */}
      <div className="fixed bottom-4 right-4 w-64 z-50">
        <Chatbot />
      </div>
    </div>
    
  );

  
};


export default Dashboard;
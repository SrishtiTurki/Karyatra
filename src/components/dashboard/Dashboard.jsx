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

// Job Reducer Function
const jobReducer = (state, action) => {
  if (action.name) {
    return { ...state, [action.name]: action.value };
  }
  return state; // Keep state unchanged if action is unknown
};



const Dashboard = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  
  const initialState = {
    company: '',
    role: '',
    description: '',
    salary: '',
    status: 'Applied',
    applicationDate: null,
    skills: ''  // Store as a comma-separated string
  };
  
  const [newJob, dispatch] = useReducer(jobReducer, initialState);

  const db = getFirestore();

  // Fetch user data from Firestore
  const fetchUserData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      } else {
        console.error("User data not found");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, [currentUser, db]);

  // Fetch job applications
  const fetchJobs = useCallback(async () => {
    if (!currentUser) return;
    console.log("currentUser.uid:", currentUser.uid); // Add this for debugging
    setLoading(true);
    try {
      const jobsQuery = query(collection(db, 'jobs'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(jobsQuery);
      if (isMounted.current) {
        setJobs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [currentUser, db]);

  // Track loading state
  useEffect(() => {
    console.log('Loading state:', loading); // Logs whenever `loading` state changes
  }, [loading]);

  // Load jobs on mount
  useEffect(() => {
    fetchUserData(); // Fetch user data
    fetchJobs(); // Fetch job applications
  }, [fetchUserData, fetchJobs]);

  

  // Handle form input changes
  const handleChange = (e) => {
    dispatch({ name: e.target.name, value: e.target.value });
  };

  // Reset form
  const resetForm = () => {
    Object.keys(initialState).forEach(key => dispatch({ name: key, value: initialState[key] }));
  };

  // Handle job submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if all required fields are filled
    if (!newJob.company || !newJob.role || !newJob.applicationDate) {
      toast.error("Please fill all required fields!");
      return;
    }
  
    // Check if salary is a valid positive number
    if (newJob.salary && (isNaN(parseFloat(newJob.salary)) || parseFloat(newJob.salary) <= 0)) {
      toast.error("Salary must be a positive number!");
      return;
    }
  
    try {
      // Check if job already exists
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
  
      // Add the job
      const docRef = await addDoc(collection(db, 'jobs'), {
        ...newJob,
        skills: newJob.skills ? newJob.skills.split(',').map(skill => skill.trim()) : [],
        applicationDate: newJob.applicationDate ? newJob.applicationDate.toISOString() : null,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
  
      // Optimistically update UI
      setJobs((prevJobs) => [
        ...prevJobs,
        { ...newJob, id: docRef.id, skills: newJob.skills.split(',').map(skill => skill.trim()) }
      ]);
  
      toast.success("Job application added successfully!");
      resetForm();
  
      // Reload the jobs
      fetchJobs(); 
    } catch (error) {
      console.error('Error adding job:', error); // Log detailed error
      toast.error("Failed to add job application.");
    }
  };
  
  

  
  // Handle status update
  const updateStatus = async (id, status) => {
    try {
      const jobRef = doc(db, "jobs", id);
      await updateDoc(jobRef, { status });
  
      toast.info(`Job status updated to ${status}`);
      
      // Optimistic UI Update
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job.id === id ? { ...job, status } : job))
      );
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status.");
    }
  };
  
  // Handle job deletion
  const deleteJob = async (id) => {
    try {
      await deleteDoc(doc(db, "jobs", id));
      toast.warn("Job application deleted!");
      fetchJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job.");
    }
  };

  // Job Statistics
  const totalApplications = jobs.length;
  const interviewScheduled = jobs.filter(job => job.status === "Interview Scheduled").length;
  const offersReceived = jobs.filter(job => job.status === "Offer Received").length;
  const rejectedApplications = jobs.filter(job => job.status === "Rejected").length;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-violet-600 mb-8">Job Application Dashboard</h1>

      {/* Display User Details */}
      {userData ? (
        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold">User Profile</h2>
          <p><strong>Name:</strong> {userData.name}</p>
          <p><strong>Age:</strong> {userData.age}</p>
          <p><strong>Status:</strong> {userData.status}</p>
          <p><strong>Qualifications:</strong> {userData.qualifications}</p>
          {userData.resumeURL && (
            <p><strong>Resume:</strong> {userData.resumeURL}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Loading user details...</p>
      )}
      
      {/* Job Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
      
      {/* Add Job Application Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Job Application</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="company" placeholder="Company" className="w-full p-2 border rounded" value={newJob.company} onChange={handleChange} required />
            <input type="text" name="role" placeholder="Role" className="w-full p-2 border rounded" value={newJob.role} onChange={handleChange} required />
            <input type="number" name="salary" placeholder="Salary" className="w-full p-2 border rounded" value={newJob.salary} onChange={handleChange} />
            <DatePicker
              selected={newJob.applicationDate}
              onChange={(date) => dispatch({ name: 'applicationDate', value: date })}
              className="w-full p-2 border rounded"
              placeholderText="Select Application Date"
              required
            />
          </div>
          <input type="text" name="skills" placeholder="Skills (comma separated)" className="w-full p-2 border rounded" value={newJob.skills} onChange={handleChange} />
          <textarea name="description" placeholder="Job Description" className="w-full p-2 border rounded" value={newJob.description} onChange={handleChange} rows="4" />
          <button type="submit" className="w-full bg-violet-600 text-white py-2 px-4 rounded hover:bg-violet-700">Add Job Application</button>
        </form>
      </div>
      
      {/* Job Applications List */}
      <h2 className="text-xl font-semibold mb-4">Your Job Applications</h2>
      {loading ? (
        <p className="text-center text-gray-500">Loading job applications...</p>
      ) : jobs.length === 0 ? (
        <p className="text-center text-gray-500">No job applications found.</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{job.company} - {job.role}</h3>
                <p className="text-gray-600">{job.description}</p>
                <p>Skills: {Array.isArray(job.skills) ? job.skills.join(', ') : 'N/A'}</p>
                <p className="text-sm text-gray-500">Salary: <span className="font-bold">${job.salary}</span></p>
                <p className="text-sm text-gray-500">Status: <span className="font-bold">{job.status}</span></p>
              </div>
              <div className="flex gap-2">
                <select 
                  value={job.status} 
                  onChange={(e) => updateStatus(job.id, e.target.value)} 
                  className="p-2 border rounded"
                >
                  <option value="Applied">Applied</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Offer Received">Offer Received</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button onClick={() => deleteJob(job.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
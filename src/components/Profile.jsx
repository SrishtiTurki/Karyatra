import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const Profile = () => {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const user = auth.currentUser;
  const [details, setDetails] = useState({
    name: "",
    email: "",
    age: "",
    status: "",
    qualifications: "",
    resumeURL: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });
  const [resume, setResume] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setDetails(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setSaveMessage({ text: "Failed to load profile data", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDetails();
  }, [user, db]);

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      let updatedDetails = { ...details };

      // Handle resume upload if there's a new file
      if (resume) {
        // Delete existing resume if there is one
        if (details.resumeURL) {
          try {
            const oldResumeRef = ref(storage, details.resumeURL);
            await deleteObject(oldResumeRef);
          } catch (error) {
            console.error("Error deleting old resume:", error);
          }
        }

        // Upload new resume
        const resumeRef = ref(storage, `resumes/${user.uid}/${resume.name}`);
        await uploadBytes(resumeRef, resume);
        const downloadURL = await getDownloadURL(resumeRef);
        updatedDetails.resumeURL = downloadURL;
      }

      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, updatedDetails);
      setDetails(updatedDetails);
      setResume(null);
      setSaveMessage({ text: "Profile updated successfully!", type: "success" });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage({ text: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveMessage({ text: "Failed to update profile", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-700 border-r-transparent"></div>
          <p className="mt-4 text-lg text-gray-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-3xl">
        <h2 className="text-4xl font-bold mb-8 text-center text-purple-700">Edit Your Profile</h2>
        
        {saveMessage.text && (
          <div className={`mb-6 p-4 rounded-lg text-center ${
            saveMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {saveMessage.text}
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              id="name"
              name="name" 
              value={details.name} 
              onChange={handleChange} 
              className="w-full p-4 border rounded-xl text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              placeholder="Enter your full name" 
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              id="email"
              name="email" 
              value={details.email}
              onChange={handleChange}
              className="w-full p-4 border rounded-xl text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              placeholder="Enter your email address"
            />
          </div>
          
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input 
              id="age"
              name="age" 
              value={details.age} 
              onChange={handleChange} 
              type="number" 
              className="w-full p-4 border rounded-xl text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              placeholder="Enter your age" 
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
            <select 
              id="status"
              name="status" 
              value={details.status} 
              onChange={handleChange} 
              className="w-full p-4 border rounded-xl text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select your status</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Student">Student</option>
              <option value="Employed">Employed</option>
              <option value="Freelancer">Freelancer</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
            <textarea 
              id="qualifications"
              name="qualifications" 
              value={details.qualifications} 
              onChange={handleChange} 
              rows="3"
              className="w-full p-4 border rounded-xl text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              placeholder="Enter your qualifications (degrees, certifications, etc.)" 
            />
          </div>
          
          <div>
            <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
            <div className="mt-1">
              {details.resumeURL && (
                <div className="mb-2 text-sm text-gray-600">
                  Current resume: {details.resumeURL ? details.resumeURL.split('/').pop() : "None"}
                </div>
              )}
              <input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                onChange={handleFileChange}
              />
              <p className="mt-1 text-xs text-gray-500">Upload your resume in PDF, DOC, or DOCX format</p>
            </div>
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`${
              isSaving ? 'bg-purple-500' : 'bg-purple-700 hover:bg-purple-800'
            } text-white px-8 py-4 rounded-xl text-xl w-full transition duration-300 flex items-center justify-center`}
          >
            {isSaving ? (
              <>
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
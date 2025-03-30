import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const AdditionalDetails = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [status, setStatus] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!auth.currentUser) {
      setError("No authenticated user found!");
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;

    try {
      await setDoc(doc(collection(db, "users"), userId), {
        name,
        age,
        status,
        qualifications,
        resumeURL: resume ? resume.name : null, // Save file name (storage integration needed for actual upload)
        userId,
      });

      console.log("User details saved successfully");
      navigate('/dashboard'); // Redirect to Dashboard
    } catch (error) {
      console.error("Error saving user details:", error);
      setError("Failed to save details. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#CDC1FF]">
      <div className="bg-white shadow-lg rounded-lg p-12 w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">Complete Your Profile</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            required
            className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="number"
            required
            className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />

          <select
            required
            className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="" disabled>Select Employment Status</option>
            <option value="Unemployed">Unemployed</option>
            <option value="Student">Student</option>
          </select>

          <input
            type="text"
            required
            className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Qualifications"
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            required
            className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            onChange={handleFileChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white text-lg py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            {loading ? "Saving..." : "Submit & Go to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdditionalDetails;



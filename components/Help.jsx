import React from "react";

const Help = () => {
  const helpTopics = [
    {
      title: "User Profile & Job Application Tracker",
      description: "Track all your job applications in one place with status updates.",
      steps: [
        "Go to Dashboard to view all your applications",
        "Click '+ Add Job' to add a new application",
        "Update status using the dropdown menu for each job",
        "Click on any job card to see full details"
      ]
    },
    {
      title: "Skill Gap Analysis",
      description: "Find out which skills you need to develop for your target jobs.",
      steps: [
        "Upload a job description or paste URL on the 'Analyze Job' page",
        "Review the highlighted missing skills in your profile",
        "Click on any skill to see recommended resources"
      ]
    },
    {
      title: "Resource Recommendations",
      description: "Get personalized course and practice recommendations.",
      steps: [
        "Go to the 'Resources' tab to see all recommendations",
        "Filter by skill or job to get targeted results",
        "Click on any resource to be directed to the learning platform"
      ]
    },
    {
      title: "Chatbot & Voice Assistant",
      description: "Get quick answers and assistance with your job search.",
      steps: [
        "Click the chat icon in the bottom right corner",
        "Type your question or click the microphone for voice mode",
        "Ask things like 'Show me my upcoming interviews' or 'What skills do I need for my Amazon application?'"
      ]
    },
    {
      title: "Deadline Reminders",
      description: "Never miss an application deadline or interview again.",
      steps: [
        "All deadlines appear in the 'Calendar' section",
        "Click 'Set Reminder' when adding a new application",
        "Adjust notification settings in your profile"
      ]
    },
    {
      title: "Bookmarking Jobs",
      description: "Save interesting job postings to apply later.",
      steps: [
        "Click the bookmark icon on any job listing",
        "Use our Chrome extension to save jobs from other websites",
        "View all bookmarked jobs in the 'Saved' tab"
      ]
    },
    {
      title: "Chrome Extension",
      description: "Track jobs while browsing LinkedIn, Indeed, or other job sites.",
      steps: [
        "Install our extension from the Chrome Web Store",
        "Click the Karyatra icon when viewing a job posting",
        "Select 'Add to Tracker' to import the job details automatically"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-violet-800 mb-4">Karyatra Help Center</h1>
          <p className="text-lg text-gray-600">
            Find guides and instructions for using all features of the Karyatra job application tracker
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 bg-violet-700 text-white">
            <h2 className="text-xl font-bold">Quick Navigation Guide</h2>
            <p className="mt-1 text-violet-100">Step-by-step instructions for all features</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {helpTopics.map((topic, index) => (
              <details key={index} className="group">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-medium text-violet-800 hover:bg-violet-50">
                  <span className="flex items-center">
                    <span className="bg-violet-100 text-violet-800 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    {topic.title}
                  </span>
                  <span className="text-violet-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-6 pt-2 bg-gray-50">
                  <p className="mb-4 text-gray-700">{topic.description}</p>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-violet-700 mb-3">How to use this feature:</h4>
                    <ol className="list-decimal pl-5 space-y-2">
                      {topic.steps.map((step, i) => (
                        <li key={i} className="text-gray-700">{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium text-violet-700 mb-4">Still need help?</h3>
          <p className="text-gray-600">
            Contact our support team at <strong>help@karyatra.com</strong> or use the chatbot to get immediate assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Help;
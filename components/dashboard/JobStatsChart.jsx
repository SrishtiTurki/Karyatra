import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const JobStatsChart = ({ jobs }) => {
  const [activeView, setActiveView] = useState('bar');
  const [statsData, setStatsData] = useState([]);
  
  // Colors for different statuses
  const COLORS = {
    'Applied': '#3B82F6', // blue
    'Interview Scheduled': '#10B981', // green
    'Offer Received': '#6366F1', // indigo
    'Rejected': '#EF4444', // red
  };
  
  useEffect(() => {
    if (!jobs || !jobs.length) return;
    
    // Calculate statistics
    const totalApplications = jobs.length;
    const interviewScheduled = jobs.filter(job => job.status === "Interview Scheduled").length;
    const offersReceived = jobs.filter(job => job.status === "Offer Received").length;
    const rejectedApplications = jobs.filter(job => job.status === "Rejected").length;
    const applied = totalApplications - interviewScheduled - offersReceived - rejectedApplications;
    
    // Format data for charts
    const data = [
      { name: 'Applied', value: applied, color: COLORS['Applied'] },
      { name: 'Interview', value: interviewScheduled, color: COLORS['Interview Scheduled'] },
      { name: 'Offers', value: offersReceived, color: COLORS['Offer Received'] },
      { name: 'Rejected', value: rejectedApplications, color: COLORS['Rejected'] },
    ];
    
    setStatsData(data);
  }, [jobs]);
  
  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow rounded border border-gray-200">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Application Statistics</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveView('bar')} 
            className={`px-3 py-1 rounded text-sm ${
              activeView === 'bar' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Bar
          </button>
          <button 
            onClick={() => setActiveView('pie')} 
            className={`px-3 py-1 rounded text-sm ${
              activeView === 'pie' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pie
          </button>
        </div>
      </div>
      
      <div className="h-64">
        {statsData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {activeView === 'bar' ? (
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value">
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={statsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No job application data available</p>
          </div>
        )}
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {statsData.map((stat) => (
          <div key={stat.name} className="p-3 rounded-lg text-center" style={{ backgroundColor: `${stat.color}20` }}>
            <h3 className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</h3>
            <p className="text-gray-700">{stat.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobStatsChart;
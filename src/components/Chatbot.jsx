import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircleIcon, MicIcon, StopCircleIcon, SendIcon, VolumeXIcon } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import ReactMarkdown from 'react-markdown';

const Chatbot = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const API_KEY = "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"; 

  // Speech Recognition Hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Function to handle common conversational phrases
  const handleConversationalPhrases = (text) => {
    const lowercaseText = text.toLowerCase().trim();
    
    const phrases = {
      'hi': "Hello! I'm a job skills chatbot. How can I assist you with your career-related questions?",
      'hello': "Hello! I'm a job skills chatbot. How can I assist you with your career-related questions?",
      'hey': "Hello! I'm a job skills chatbot. How can I assist you with your career-related questions?",
      'thank you': "You're welcome! Is there anything else I can help you with about jobs or careers?",
      'thanks': "You're welcome! Is there anything else I can help you with about jobs or careers?",
      'bye': "Goodbye! Feel free to come back if you need career advice.",
      'goodbye': "Goodbye! Feel free to come back if you need career advice."
    };

    return phrases[lowercaseText] || null;
  };

  // Function to check if the query is job-related
  const isJobRelatedQuery = (text) => {
    const jobRelatedKeywords = [
      'job', 'career', 'work', 'profession', 'role', 
      'skill', 'employment', 'interview', 'resume', 
      'salary', 'company', 'industry', 'certification',
      'professional', 'workplace', 'hiring', 'employee',
      'recruitment', 'occupation', 'position', 'internship'
    ];

    const lowercaseText = text.toLowerCase();
    return jobRelatedKeywords.some(keyword => 
      lowercaseText.includes(keyword)
    );
  };

  // Function to convert markdown to plain text for speech
  const markdownToPlainText = (markdown) => {
    // Remove headers (lines starting with #)
    let plainText = markdown.replace(/^#+\s+/gm, '');
    
    // Remove bullet points
    plainText = plainText.replace(/^\s*[\*\-]\s+/gm, '');
    
    // Remove numbered lists
    plainText = plainText.replace(/^\s*\d+\.\s+/gm, '');
    
    // Remove bold and italic formatting
    plainText = plainText.replace(/\*\*(.*?)\*\*/g, '$1');
    plainText = plainText.replace(/\*(.*?)\*/g, '$1');
    
    return plainText;
  };

  // Text-to-Speech Function
  const speak = (text) => {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Convert markdown to plain text for speech
    const plainText = markdownToPlainText(text);
    
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 0.9; // Adjust speaking rate
    
    // Track speaking state
    setIsSpeaking(true);
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Stop Speaking Function
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Start Listening
  const startListening = () => {
    try {
      SpeechRecognition.startListening({ 
        continuous: true,
        language: 'en-US'
      });
      setIsListening(true);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      alert("Speech recognition is not supported in this browser or permission was denied.");
    }
  };

  // Stop Listening
  const stopListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
  };

  // Use transcript to update query when listening
  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);

  const handleQuerySubmit = async (e) => {
    // Allow submission from both form and voice
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const currentQuery = query || transcript;
    if (!currentQuery.trim()) return;

    // Check for conversational phrases first
    const conversationalResponse = handleConversationalPhrases(currentQuery);
    if (conversationalResponse) {
      const newChatHistory = [
        ...chatHistory, 
        { type: 'user', text: currentQuery },
        { type: 'bot', text: conversationalResponse }
      ];
      setChatHistory(newChatHistory);
      speak(conversationalResponse);
      setQuery('');
      resetTranscript();
      return;
    }

    // Check if the query is job-related
    if (!isJobRelatedQuery(currentQuery)) {
      const nonJobResponse = "I can only assist with job and career-related questions. Please ask about:\n• Job roles\n• Career skills\n• Professional development\n• Job market information\n• Interview preparation";
      
      const newChatHistory = [
        ...chatHistory, 
        { type: 'user', text: currentQuery },
        { type: 'bot', text: nonJobResponse }
      ];
      
      setChatHistory(newChatHistory);
      speak(nonJobResponse);
      setQuery('');
      resetTranscript();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: "qwen/qwen2.5-vl-3b-instruct:free",
        messages: [
          {
            role: 'system',
            content: 'You are a professional career assistant. Provide precise, informative responses about jobs, careers, professional skills, and workplace information. Focus on giving clear, actionable career advice.'
          },
          {
            role: 'user',
            content: currentQuery
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const botResponse = apiResponse.data.choices[0].message.content;
      
      // Update chat history
      const newChatHistory = [
        ...chatHistory, 
        { type: 'user', text: currentQuery },
        { type: 'bot', text: botResponse }
      ];
      
      setChatHistory(newChatHistory);
      speak(botResponse);
      setQuery(''); // Clear input after submission
      resetTranscript();
    } catch (err) {
      const errorMessage = 'Failed to fetch response. Please try again.';
      setError(errorMessage);
      speak(errorMessage);
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check Browser Support
  if (!browserSupportsSpeechRecognition) {
    return <div>Browser does not support speech recognition</div>;
  }

  // Custom component to render messages with proper formatting
  const MessageDisplay = ({ message }) => {
    if (message.type === 'user') {
      return <div className="mb-2 p-2 rounded bg-blue-100 text-right">{message.text}</div>;
    } else {
      return (
        <div className="mb-2 p-2 rounded bg-gray-100 text-left">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow-md rounded-lg relative">
      <h2 className="text-2xl font-bold mb-4 text-center">Career Voice Assistant</h2>
      
      {/* Scrollable Chat History */}
      <div className="h-64 overflow-y-auto border border-gray-200 mb-4 p-2 rounded">
        {chatHistory.map((message, index) => (
          <MessageDisplay key={index} message={message} />
        ))}
      </div>
      
      {/* Transcript Display */}
      <div className="mb-4 p-2 bg-gray-50 rounded">
        <p className="text-gray-600">{transcript}</p>
      </div>
      
      <form onSubmit={handleQuerySubmit} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about job roles, skills, or career paths..."
            className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || (!query.trim() && !transcript.trim())}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Ask'}
          </button>
        </div>
      </form>

      {/* Voice Control Buttons */}
      <div className="flex justify-center space-x-4 mb-4">
        <button 
          onClick={startListening}
          disabled={isListening}
          className="bg-green-500 text-white p-2 rounded-full disabled:opacity-50"
        >
          <MicIcon size={24} />
        </button>
        
        <button 
          onClick={stopListening}
          disabled={!isListening}
          className="bg-red-500 text-white p-2 rounded-full disabled:opacity-50"
        >
          <StopCircleIcon size={24} />
        </button>
        
        <button 
          onClick={() => handleQuerySubmit()}
          disabled={!transcript.trim() || isLoading}
          className="bg-blue-500 text-white p-2 rounded-full disabled:opacity-50"
        >
          <SendIcon size={24} />
        </button>

        {/* Stop Speaking Button */}
        {isSpeaking && (
          <button 
            onClick={stopSpeaking}
            className="bg-yellow-500 text-white p-2 rounded-full"
          >
            <VolumeXIcon size={24} />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

const ChatbotWrapper = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Chatbot Icon */}
      {!isChatbotOpen && (
        <button 
          onClick={toggleChatbot}
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300"
        >
          <MessageCircleIcon size={24} />
        </button>
      )}

      {/* Chatbot Modal */}
      {isChatbotOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-full">
          <div className="bg-white shadow-xl rounded-lg">
            {/* Close Button */}
            <div className="flex justify-end p-2">
              <button 
                onClick={toggleChatbot}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Chatbot Component */}
            <Chatbot />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWrapper;
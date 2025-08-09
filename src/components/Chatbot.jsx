import React, { useState, useEffect } from 'react';
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
  const API_KEY = "YOUR_API_KEY";

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

  // Improved job-related query check with regex
  const isJobRelatedQuery = (text) => {
    const jobRelatedPattern = /\b(job|career|work|profession|role|skill|employment|interview|resume|salary|company|industry|certification|professional|workplace|hiring|employee|recruitment|occupation|position|internship)\b/i;
    return jobRelatedPattern.test(text);
  };

  // Function to convert markdown to plain text for speech
  const markdownToPlainText = (markdown) => {
    let plainText = markdown
      .replace(/^#+\s+/gm, '')      // Remove headers
      .replace(/^\s*[\*\-]\s+/gm, '') // Remove bullet points
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1');   // Remove italics
    
    return plainText;
  };

  // Text-to-Speech Function with browser support check
  const speak = (text) => {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis not supported");
      return;
    }

    window.speechSynthesis.cancel();
    const plainText = markdownToPlainText(text);
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 0.9;
    
    setIsSpeaking(true);
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  // Stop Speaking Function
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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
      setError("Speech recognition is not supported in this browser or permission was denied.");
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

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleQuerySubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

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
      const apiResponse = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
          message: currentQuery,
          model: "command-r-plus",
          chat_history: chatHistory.map(msg => ({
            role: msg.type === 'user' ? 'USER' : 'CHATBOT',
            message: msg.text
          })),
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Cohere-Version': '2022-12-06'
          }
        }
      );

      const botResponse = apiResponse.data.text;
      
      const newChatHistory = [
        ...chatHistory, 
        { type: 'user', text: currentQuery },
        { type: 'bot', text: botResponse }
      ];
      
      setChatHistory(newChatHistory);
      speak(botResponse);
      setQuery('');
      resetTranscript();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch response. Please try again.';
      setError(errorMessage);
      speak(errorMessage);
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Check Browser Support
  if (!browserSupportsSpeechRecognition) {
    return <div className="p-4 text-red-500">Browser does not support speech recognition</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow-md rounded-lg relative">
      <h2 className="text-2xl font-bold mb-4 text-center">Career Voice Assistant</h2>
      
      {/* Scrollable Chat History */}
      <div className="h-64 overflow-y-auto border border-gray-200 mb-4 p-2 rounded">
        {chatHistory.length > 0 ? (
          chatHistory.map((message, index) => (
            <MessageDisplay key={index} message={message} />
          ))
        ) : (
          <div className="text-gray-500 text-center py-8">
            Ask me about job skills, career paths, or interview tips
          </div>
        )}
      </div>
      
      {/* Transcript Display when listening */}
      {isListening && (
        <div className="mb-4 p-2 bg-gray-50 rounded">
          <p className="text-gray-600">{transcript || "Listening..."}</p>
        </div>
      )}
      
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
          className={`p-2 rounded-full ${isListening ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          <MicIcon size={24} />
        </button>
        
        <button 
          onClick={stopListening}
          disabled={!isListening}
          className={`p-2 rounded-full ${!isListening ? 'bg-gray-300' : 'bg-red-500 hover:bg-red-600 text-white'}`}
        >
          <StopCircleIcon size={24} />
        </button>
        
        <button 
          onClick={() => handleQuerySubmit()}
          disabled={!transcript.trim() || isLoading}
          className={`p-2 rounded-full ${(!transcript.trim() || isLoading) ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          <SendIcon size={24} />
        </button>

        {/* Stop Speaking Button */}
        {isSpeaking && (
          <button 
            onClick={stopSpeaking}
            className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600"
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
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center"
          style={{ width: '56px', height: '56px' }}
        >
          <MessageCircleIcon size={28} />
        </button>
      )}

      {/* Chatbot Modal */}
      {isChatbotOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-full">
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            {/* Header with close button */}
            <div className="bg-blue-500 text-white p-3 flex justify-between items-center">
              <h3 className="font-semibold">Career Assistant</h3>
              <button 
                onClick={toggleChatbot}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Chatbot Component */}
            <div className="max-h-[80vh] overflow-hidden">
              <Chatbot />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWrapper;
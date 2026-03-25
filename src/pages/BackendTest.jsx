import React, { useState } from 'react';

export default function BackendTest() {
  const [response, setResponse] = useState('');

  const testBackend = () => {
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(data => setResponse(data.status))
      .catch(err => setResponse('Error connecting to backend'));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative p-4">
      <h1 className="text-3xl font-bold mb-6">Backend API Connection Test</h1>
      
      <button 
        onClick={testBackend}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow mb-4"
      >
        Ping FastAPI Backend on Port 8000
      </button>

      <div className="w-full max-w-md p-6 bg-white rounded shadow text-center">
        <p className="text-lg font-mono text-gray-700">
          Response: <span className="text-blue-500">{response || "Waiting..."}</span>
        </p>
      </div>
      <div className="mt-8">
          <a href="/" className="text-blue-500 hover:underline">返回主页 (Back to Home)</a>
      </div>
    </div>
  );
}

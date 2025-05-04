import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Make Papa Parse available globally for the app
import Papa from 'papaparse';
window.Papa = Papa;

// Create a mock fs API for file operations
// In a real deployment, you'd replace this with actual file handling
window.fs = {
  readFile: async (path, options = {}) => {
    // In a real app, this would fetch from an API or local file system
    // For GitHub deployment, you'd need to place CSV files in the public folder
    // and fetch them using fetch API
    try {
      const response = await fetch(`/${path}`);
      if (options.encoding === 'utf8') {
        return await response.text();
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      throw error;
    }
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
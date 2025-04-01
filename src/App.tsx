import React from 'react';
import { Auth } from './components/Auth';
import { useAuthStore } from './store/authStore';
import { FileUpload } from './components/FileUpload';

function App() {
  const { isLoggedIn } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-900">
      {!isLoggedIn ? <Auth /> : <FileUpload />}
    </div>
  );
}

export default App;
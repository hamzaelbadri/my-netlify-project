import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { PostManager } from './components/PostManager';
import { usePostStore } from './store';
import { facebookAuth } from './lib/facebook';
import { Notification } from './components/Notification';

function App() {
  const { isAuthenticated, login, logout } = usePostStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [isInitializing, setIsInitializing] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const initializeFacebook = async () => {
      try {
        await facebookAuth.initialize();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Facebook SDK');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeFacebook();
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      await login();
      setNotification({
        type: 'success',
        message: 'Successfully connected to Facebook!'
      });
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to connect to Facebook. Please try again.';
      
      setError(errorMessage);
      setNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setNotification({
        type: 'success',
        message: 'Successfully logged out'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to logout. Please try again.'
      });
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <>
          <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
          <PostManager />
        </>
      ) : (
        <Login onLogin={handleLogin} isLoading={isLoading} error={error} />
      )}

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;
import { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import StationsSidebar from './components/StationsSidebar';

interface AppProps {
  user?: { username: string };
  handleSignOut?: () => void;
}

function App({ user, handleSignOut }: AppProps) {
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('header');
      if (header) {
        const headerRect = header.getBoundingClientRect();
        setHeaderVisible(headerRect.bottom > 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <main className="w-full min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">welcome to bodeEV</h1>
          <p className="text-gray-600 mt-1">bodeEV backoffice and admin portal</p>
        </div>
        {user && handleSignOut && (
          <div className="flex items-center">
            <span className="text-gray-700 mr-4">welcome {user.username}</span>
            <button 
              onClick={handleSignOut} 
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <div className="flex gap-4 p-6">
        {/* Map - 2/3 width - Sticky */}
        <div 
          className="flex-[2] sticky bg-white rounded-lg shadow-sm border border-gray-200" 
          style={{ 
            top: '24px', 
            height: headerVisible ? 'calc(100vh - 140px)' : 'calc(100vh - 48px)',
            alignSelf: 'flex-start',
            transition: 'height 0.2s ease'
          }}
        >
          <MapComponent className="h-full w-full" />
        </div>

        {/* Stations Sidebar - 1/3 width - Scrollable */}
        <div className="flex-[1]">
          <StationsSidebar onStationSelect={(station) => {
            console.log('Selected station:', station);
            // TODO: Center map on selected station
          }} />
        </div>
      </div>
    </main>
  );
}

export default App;
import MapComponent from './components/MapComponent';
import StationsSidebar from './components/StationsSidebar';

function App() {
  return (
    <main className="w-full min-h-screen flex flex-col pt-20">
      {/* Main Content */}
      <div className="flex gap-4 p-6">
        {/* Map - 2/3 width - Sticky */}
        <div 
          className="flex-[2] sticky bg-white rounded-lg shadow-sm border border-gray-200" 
          style={{ 
            top: '24px', 
            height: 'calc(100vh - 140px)',
            alignSelf: 'flex-start'
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
import MapComponent from './components/MapComponent';
import StationsSidebar from './components/StationsSidebar';

function App() {
  return (
    <>
      <main className="w-full h-screen">
        {/* Map - Full screen */}
        <div className="absolute inset-0">
          <MapComponent className="h-full w-full" />
        </div>
      </main>

      {/* Stations Sidebar - Fixed position overlay */}
      <div className="fixed right-4 top-16 bottom-4 w-80 z-[9998]">
        <StationsSidebar onStationSelect={() => {
          // Handle station selection
        }} />
      </div>
    </>
  );
}

export default App;
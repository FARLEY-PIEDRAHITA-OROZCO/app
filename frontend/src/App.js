import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Scraping from './pages/Scraping';
import Predictions from './pages/Predictions';
import JornadaPredictions from './pages/JornadaPredictions';
import Classification from './pages/Classification';
import TeamStats from './pages/TeamStats';
import Layout from './components/Layout';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="jornada" element={<JornadaPredictions />} />
            <Route path="classification" element={<Classification />} />
            <Route path="teams" element={<TeamStats />} />
            <Route path="matches" element={<Matches />} />
            <Route path="scraping" element={<Scraping />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
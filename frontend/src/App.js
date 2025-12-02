import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Scraping from './pages/Scraping';
import Layout from './components/Layout';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="matches" element={<Matches />} />
            <Route path="scraping" element={<Scraping />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import RoadConditions from './pages/RoadConditions';
import TrafficAnalytics from './pages/TrafficAnalytics';
import Incidents from './pages/Incidents';
import InfrastructureAudit from './pages/InfrastructureAudit';
import PedestrianSafety from './pages/PedestrianSafety';
import FleetManagement from './pages/FleetManagement';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live-map" element={<LiveMap />} />
        <Route path="/road-conditions" element={<RoadConditions />} />
        <Route path="/traffic" element={<TrafficAnalytics />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/infrastructure" element={<InfrastructureAudit />} />
        <Route path="/pedestrian-safety" element={<PedestrianSafety />} />
        <Route path="/fleet" element={<FleetManagement />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

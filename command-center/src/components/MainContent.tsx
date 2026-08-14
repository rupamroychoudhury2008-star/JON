import { useApp } from '../context/AppContext';
import VoiceModeView from '../views/VoiceModeView';
import SessionHistoryView from '../views/SessionHistoryView';
import AppearanceView from '../views/AppearanceView';
import ConnectivityView from '../views/ConnectivityView';
import SettingsView from '../views/SettingsView';

const VIEW_MAP: Record<string, React.FC> = {
  voice: VoiceModeView,
  session: SessionHistoryView,
  appearance: AppearanceView,
  connectivity: ConnectivityView,
  settings: SettingsView,
};

export default function MainContent() {
  const { activeView } = useApp();
  const ViewComponent = VIEW_MAP[activeView] || VoiceModeView;

  return (
    <main className="flex-1 overflow-hidden h-full">
      <ViewComponent />
    </main>
  );
}

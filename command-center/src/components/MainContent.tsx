import { useApp } from '../context/AppContext';
import VoiceModeView from '../views/VoiceModeView';
import SessionHistoryView from '../views/SessionHistoryView';
import MetricsView from '../views/MetricsView';
import DiagnosticLogsView from '../views/DiagnosticLogsView';
import AppearanceView from '../views/AppearanceView';
import ConnectivityView from '../views/ConnectivityView';
import DiagnosticsView from '../views/DiagnosticsView';
import SettingsView from '../views/SettingsView';

const VIEW_MAP: Record<string, React.FC> = {
  voice: VoiceModeView,
  session: SessionHistoryView,
  metrics: MetricsView,
  logs: DiagnosticLogsView,
  appearance: AppearanceView,
  connectivity: ConnectivityView,
  diagnostics: DiagnosticsView,
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

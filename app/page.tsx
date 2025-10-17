
import { App } from '@/components/App';
import { ConversationProvider } from '@/components/providers/ConversationProvider';
import { LogProvider } from '@/components/providers/LogProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { UIStateProvider } from '@/components/providers/UIStateProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';

export default function HomePage() {
  return (
    <LogProvider>
      <NotificationProvider>
        <SettingsProvider>
          <UIStateProvider>
            <ConversationProvider>
              <App />
            </ConversationProvider>
          </UIStateProvider>
        </SettingsProvider>
      </NotificationProvider>
    </LogProvider>
  );
}
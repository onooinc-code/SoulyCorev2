
import { App } from '@/components/App';
import { ConversationProvider } from '@/components/providers/ConversationProvider';
import { LogProvider } from '@/components/providers/LogProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
// FIX: The import path for UIStateProvider was incorrect, causing a module resolution error during the build process. Corrected the path to use the `@` alias, ensuring consistent and correct module imports across the application.
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
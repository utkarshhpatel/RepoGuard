import React, { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  banner?: ReactNode;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  sidebar,
  topbar,
  banner,
  leftPanel,
  rightPanel,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-rg-bg text-rg-text">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar */}
        {topbar}

        {/* Optional Banner (Demo Mode or Offline) */}
        {banner}

        {/* Split Main Workspace */}
        <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-rg-border">
          {/* Left Panel: Diff Input / Inspector */}
          <section className="flex-1 lg:w-1/2 flex flex-col min-h-0 overflow-hidden">
            {leftPanel}
          </section>

          {/* Right Panel: Review Summary & Findings */}
          <section className="flex-1 lg:w-1/2 flex flex-col min-h-0 overflow-hidden bg-rg-panel/30">
            {rightPanel}
          </section>
        </main>
      </div>
    </div>
  );
};

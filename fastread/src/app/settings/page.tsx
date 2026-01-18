'use client';

import Link from 'next/link';

import { SpeedSettings, DisplaySettings, CitationSettings } from '@/components/settings';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-primary/80 backdrop-blur-lg border-b border-border-primary">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-bg-secondary transition-colors"
            aria-label="Back to reader"
          >
            <svg
              className="w-6 h-6 text-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Speed Settings Section */}
          <section className="bg-bg-secondary rounded-xl p-6 border border-border-primary">
            <SpeedSettings />
          </section>

          {/* Display Settings Section */}
          <section className="bg-bg-secondary rounded-xl p-6 border border-border-primary">
            <DisplaySettings />
          </section>

          {/* Citation Settings Section */}
          <section className="bg-bg-secondary rounded-xl p-6 border border-border-primary">
            <CitationSettings />
          </section>

          {/* About Section */}
          <section className="bg-bg-secondary rounded-xl p-6 border border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary mb-4">About</h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <p>
                <span className="font-medium text-text-primary">FastRead</span> is a speed reading
                application designed for academic articles and research papers.
              </p>
              <p>
                Using RSVP (Rapid Serial Visual Presentation) technology, FastRead helps you read
                faster while maintaining comprehension.
              </p>
              <div className="pt-3 border-t border-border-primary">
                <p className="text-text-tertiary">Version 0.1.0</p>
              </div>
            </div>
          </section>

          {/* Reset Settings */}
          <section className="bg-bg-secondary rounded-xl p-6 border border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Reset</h3>
            <p className="text-sm text-text-secondary mb-4">
              Reset all settings to their default values. This cannot be undone.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all settings to defaults?')) {
                  // Reset will happen through stores
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-medium
                       hover:bg-red-500/20 transition-colors"
              data-testid="reset-settings-btn"
            >
              Reset All Settings
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

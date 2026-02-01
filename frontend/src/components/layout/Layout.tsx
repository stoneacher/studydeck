import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>
              StudyDeck - Building decks to help you study
            </p>
            <p className="mt-1">
              Open source flashcard app with spaced repetition
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

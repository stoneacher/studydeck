import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Brain, 
  Calendar, 
  Flame, 
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import { study, decks as decksApi } from '../services/api';
import type { StudyStats, Deck } from '../types';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [recentDecks, setRecentDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([study.getStats(), decksApi.list()])
      .then(([statsData, decksData]) => {
        setStats(statsData);
        // Get first few top-level decks
        setRecentDecks(decksData.slice(0, 4));
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {user?.name || 'Student'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's your study progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCards ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.dueToday ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Reviewed Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.todayReviews ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Flame className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Study Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.streak ?? 0} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(stats?.dueToday ?? 0) > 0 && (
        <div className="card p-6 mb-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="h-10 w-10" />
              <div>
                <h2 className="text-xl font-semibold">You have {stats?.dueToday} cards to review</h2>
                <p className="text-primary-100">Keep your streak going!</p>
              </div>
            </div>
            <Link
              to="/decks"
              className="btn bg-white text-primary-600 hover:bg-primary-50"
            >
              Start Studying
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Recent Decks */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Decks</h2>
          <Link to="/decks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>

        {recentDecks.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentDecks.map((deck) => (
              <Link
                key={deck.id}
                to={`/decks/${deck.id}`}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-900 mb-1">{deck.name}</h3>
                <div className="text-sm text-gray-500">
                  {deck.cardCount ?? 0} cards
                  {(deck.dueCount ?? 0) > 0 && (
                    <span className="text-orange-600 ml-2">
                      ({deck.dueCount} due)
                    </span>
                  )}
                </div>
              </Link>
            ))}
            <Link
              to="/decks"
              className="card p-4 hover:shadow-md transition-shadow border-dashed flex items-center justify-center text-gray-500 hover:text-primary-600"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Deck
            </Link>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No decks yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first deck to start learning
            </p>
            <Link to="/decks" className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Deck
            </Link>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="card p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">💡 Study Tips</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Study a little every day rather than cramming</li>
          <li>• Review cards when they're due for optimal retention</li>
          <li>• Use keyboard shortcuts during study: 1-4 for rating cards</li>
          <li>• Create cloze deletions for better active recall</li>
        </ul>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Info } from 'lucide-react';
import { decks as decksApi, cards as cardsApi, study } from '../services/api';
import type { Deck, Card, StudySession } from '../types';
import { Flashcard, RatingButtons } from '../components/cards/Flashcard';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import { Alert } from '../components/ui/Alert';
import { useKeyboardShortcuts, STUDY_SHORTCUTS } from '../hooks/useKeyboardShortcuts';

export function StudyPage() {
  const { id } = useParams<{ id: string }>();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [session, setSession] = useState<StudySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    total: 0,
  });
  const [showShortcuts, setShowShortcuts] = useState(false);

  const currentCard = dueCards[currentIndex];

  const loadStudySession = useCallback(async () => {
    if (!id) return;
    try {
      const [deckData, cardsData] = await Promise.all([
        decksApi.get(id),
        decksApi.getDueCards(id, 50, true),
      ]);
      setDeck(deckData);
      setDueCards(cardsData);
      setSessionStats((prev) => ({ ...prev, total: cardsData.length }));

      // Create study session
      if (cardsData.length > 0) {
        const sessionData = await study.createSession(id);
        setSession(sessionData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study session');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStudySession();
  }, [loadStudySession]);

  const handleRate = async (quality: number) => {
    if (!currentCard || !session) return;

    try {
      await cardsApi.review(currentCard.id, quality, session.id);
      
      setSessionStats((prev) => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      }));

      // Move to next card
      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        await study.endSession(session.id);
        setSession(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts(
    [
      { key: STUDY_SHORTCUTS.SHOW_ANSWER, handler: () => setIsFlipped(true) },
      { key: STUDY_SHORTCUTS.FLIP, handler: handleFlip },
      { key: STUDY_SHORTCUTS.AGAIN, handler: () => isFlipped && handleRate(0) },
      { key: STUDY_SHORTCUTS.HARD, handler: () => isFlipped && handleRate(2) },
      { key: STUDY_SHORTCUTS.GOOD, handler: () => isFlipped && handleRate(3) },
      { key: STUDY_SHORTCUTS.EASY, handler: () => isFlipped && handleRate(5) },
    ],
    !!currentCard
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!deck) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert type="error" message="Deck not found" />
        <Link to="/decks" className="btn-primary mt-4">
          Back to Decks
        </Link>
      </div>
    );
  }

  // Session complete or no cards
  if (!currentCard) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 mb-6">
            <Check className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {sessionStats.reviewed > 0 ? 'Session Complete!' : 'No Cards Due'}
          </h1>
          {sessionStats.reviewed > 0 ? (
            <>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You reviewed {sessionStats.reviewed} cards with{' '}
                {Math.round((sessionStats.correct / sessionStats.reviewed) * 100)}% accuracy
              </p>
              <div className="flex justify-center gap-4 text-sm mb-8">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{sessionStats.reviewed}</div>
                  <div className="text-gray-500 dark:text-gray-400">Reviewed</div>
                </div>
                <div className="px-4 py-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sessionStats.correct}</div>
                  <div className="text-green-700 dark:text-green-300">Correct</div>
                </div>
                <div className="px-4 py-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{sessionStats.reviewed - sessionStats.correct}</div>
                  <div className="text-red-700 dark:text-red-300">Again</div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Great job! Come back later when more cards are due.
            </p>
          )}
          <div className="flex justify-center gap-4">
            <Link to={`/decks/${deck.id}`} className="btn-secondary">
              Back to Deck
            </Link>
            <Link to="/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to={`/decks/${deck.id}`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">{deck.name}</span>
          </Link>
          
          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {currentIndex + 1} / {dueCards.length}
            </div>
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }}
              />
            </div>
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Keyboard shortcuts"
            >
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Shortcuts Help */}
      {showShortcuts && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-blue-800 dark:text-blue-200">
              <div><kbd className="px-1 bg-blue-100 dark:bg-blue-800 rounded">Space</kbd> Show answer</div>
              <div><kbd className="px-1 bg-blue-100 dark:bg-blue-800 rounded">F</kbd> Flip card</div>
              <div><kbd className="px-1 bg-blue-100 dark:bg-blue-800 rounded">1</kbd> Again</div>
              <div><kbd className="px-1 bg-blue-100 dark:bg-blue-800 rounded">2</kbd> Hard</div>
              <div><kbd className="px-1 bg-blue-100 dark:bg-blue-800 rounded">3</kbd> Good</div>
              <div><kbd className="px-1 bg-blue-100 dark:bg-blue-800 rounded">4</kbd> Easy</div>
            </div>
          </div>
        </div>
      )}

      {/* Card Display */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Flashcard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        </div>
      </div>

      {/* Rating Buttons */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {isFlipped ? (
            <RatingButtons onRate={handleRate} />
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleFlip}
                className="btn-primary btn-lg"
              >
                Show Answer
                <span className="ml-2 text-xs opacity-75">(Space)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

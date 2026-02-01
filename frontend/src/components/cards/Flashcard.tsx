import type { Card } from '../../types';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {
  const renderContent = (content: string, isCloze: boolean, showAnswer: boolean) => {
    if (!isCloze) {
      return <p className="text-lg">{content}</p>;
    }

    // Parse cloze deletions
    const parts = content.split(/(\{\{c\d+::[^}]+\}\})/g);
    
    return (
      <p className="text-lg">
        {parts.map((part, index) => {
          const clozeMatch = part.match(/\{\{c(\d+)::([^}:]+)(?:::([^}]+))?\}\}/);
          if (clozeMatch) {
            const [, , hidden, hint] = clozeMatch;
            if (showAnswer) {
              return (
                <span key={index} className="cloze">
                  {hidden}
                </span>
              );
            }
            return (
              <span key={index} className="cloze-hidden" title="Click to reveal">
                {hint || '[...]'}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </p>
    );
  };

  return (
    <div className="flashcard" onClick={onFlip}>
      <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
        {/* Front */}
        <div className="flashcard-face flashcard-front">
          <div className="w-full">
            {card.type === 'BASIC' ? (
              <p className="text-xl">{card.front}</p>
            ) : (
              renderContent(card.front, true, false)
            )}
            <p className="text-sm text-gray-400 mt-4">
              Click to reveal answer
            </p>
          </div>
        </div>
        
        {/* Back */}
        <div className="flashcard-face flashcard-back">
          <div className="w-full">
            {card.type === 'BASIC' ? (
              <>
                <p className="text-gray-500 text-sm mb-2">{card.front}</p>
                <p className="text-xl font-medium">{card.back}</p>
              </>
            ) : (
              <>
                {renderContent(card.front, true, true)}
                {card.back && (
                  <p className="text-gray-600 mt-4 text-sm">{card.back}</p>
                )}
              </>
            )}
            {card.notes && (
              <p className="text-gray-500 text-sm mt-4 italic">{card.notes}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RatingButtonsProps {
  onRate: (quality: number) => void;
  disabled?: boolean;
}

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  const buttons = [
    { quality: 0, label: 'Again', color: 'bg-red-500 hover:bg-red-600', key: '1' },
    { quality: 2, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600', key: '2' },
    { quality: 3, label: 'Good', color: 'bg-green-500 hover:bg-green-600', key: '3' },
    { quality: 5, label: 'Easy', color: 'bg-blue-500 hover:bg-blue-600', key: '4' },
  ];

  return (
    <div className="flex gap-3 justify-center">
      {buttons.map(({ quality, label, color, key }) => (
        <button
          key={quality}
          onClick={() => onRate(quality)}
          disabled={disabled}
          className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${color} disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center min-w-[80px]`}
        >
          <span>{label}</span>
          <span className="text-xs opacity-75">({key})</span>
        </button>
      ))}
    </div>
  );
}

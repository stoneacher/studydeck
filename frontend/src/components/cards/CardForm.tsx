import { useState } from 'react';
import type { Card, CardType } from '../../types';
import { Alert } from '../ui/Alert';

interface CardFormProps {
  initialData?: Partial<Card>;
  onSubmit: (data: { type: CardType; front: string; back: string; notes?: string }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function CardForm({ initialData, onSubmit, onCancel, submitLabel = 'Save' }: CardFormProps) {
  const [type, setType] = useState<CardType>(initialData?.type || 'BASIC');
  const [front, setFront] = useState(initialData?.front || '');
  const [back, setBack] = useState(initialData?.back || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit({ type, front, back, notes: notes || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Card Type */}
      <div>
        <label className="label">Card Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="BASIC"
              checked={type === 'BASIC'}
              onChange={() => setType('BASIC')}
              className="w-4 h-4 text-primary-600"
            />
            <span>Basic (Front/Back)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="CLOZE"
              checked={type === 'CLOZE'}
              onChange={() => setType('CLOZE')}
              className="w-4 h-4 text-primary-600"
            />
            <span>Cloze Deletion</span>
          </label>
        </div>
      </div>

      {/* Front */}
      <div>
        <label htmlFor="front" className="label">
          {type === 'BASIC' ? 'Front (Question)' : 'Text with Cloze Deletions'}
        </label>
        <textarea
          id="front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder={
            type === 'BASIC'
              ? 'Enter the question...'
              : 'Use {{c1::word}} to create cloze deletions'
          }
          className="input min-h-[100px] resize-y"
          required
        />
        {type === 'CLOZE' && (
          <p className="text-sm text-gray-500 mt-1">
            Example: The capital of France is {'{{c1::Paris}}'}.
          </p>
        )}
      </div>

      {/* Back */}
      <div>
        <label htmlFor="back" className="label">
          {type === 'BASIC' ? 'Back (Answer)' : 'Extra Info (Optional)'}
        </label>
        <textarea
          id="back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder={
            type === 'BASIC'
              ? 'Enter the answer...'
              : 'Additional information shown on the back'
          }
          className="input min-h-[100px] resize-y"
          required={type === 'BASIC'}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="label">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes for yourself..."
          className="input min-h-[60px] resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

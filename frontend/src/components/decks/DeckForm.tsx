import { useState, useEffect } from 'react';
import type { Deck } from '../../types';
import { Alert } from '../ui/Alert';
import { decks as decksApi } from '../../services/api';

interface DeckFormProps {
  initialData?: Partial<Deck>;
  parentDeck?: Deck;
  onSubmit: (data: { name: string; description?: string; parentId?: string }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function DeckForm({ initialData, parentDeck, onSubmit, onCancel, submitLabel = 'Save' }: DeckFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [parentId, setParentId] = useState<string>(initialData?.parentId || parentDeck?.id || '');
  const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load available decks for parent selection
    decksApi.list().then((decks) => {
      // Flatten deck hierarchy
      const flatDecks: Deck[] = [];
      const flatten = (deck: Deck) => {
        flatDecks.push(deck);
        deck.children?.forEach(flatten);
      };
      decks.forEach(flatten);
      
      // Filter out the current deck and its children if editing
      if (initialData?.id) {
        const filtered = flatDecks.filter((d) => d.id !== initialData.id);
        setAvailableDecks(filtered);
      } else {
        setAvailableDecks(flatDecks);
      }
    });
  }, [initialData?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit({
        name,
        description: description || undefined,
        parentId: parentId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deck');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Name */}
      <div>
        <label htmlFor="name" className="label">
          Deck Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter deck name..."
          className="input"
          required
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="label">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this deck about?"
          className="input min-h-[80px] resize-y"
        />
      </div>

      {/* Parent Deck */}
      <div>
        <label htmlFor="parentId" className="label">
          Parent Deck (Optional)
        </label>
        <select
          id="parentId"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="input"
        >
          <option value="">None (Top Level)</option>
          {availableDecks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Organize your deck within another deck
        </p>
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

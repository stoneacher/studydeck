import { useEffect, useState, useCallback } from 'react';
import { Plus, Upload, Search } from 'lucide-react';
import { decks as decksApi } from '../services/api';
import type { Deck } from '../types';
import { DeckCard } from '../components/decks/DeckCard';
import { DeckForm } from '../components/decks/DeckForm';
import { Modal } from '../components/ui/Modal';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';

export function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadDecks = useCallback(async (search?: string) => {
    try {
      const data = await decksApi.list(search);
      setDecks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecks(debouncedSearch);
  }, [loadDecks, debouncedSearch]);

  const handleCreateDeck = async (data: { name: string; description?: string; parentId?: string }) => {
    await decksApi.create(data);
    setShowCreateModal(false);
    loadDecks(debouncedSearch);
  };

  const handleUpdateDeck = async (data: { name: string; description?: string; parentId?: string }) => {
    if (!editingDeck) return;
    await decksApi.update(editingDeck.id, data);
    setEditingDeck(null);
    loadDecks(debouncedSearch);
  };

  const handleDeleteDeck = async () => {
    if (!deletingDeck) return;
    await decksApi.delete(deletingDeck.id);
    setDeletingDeck(null);
    loadDecks(debouncedSearch);
  };

  const handleImport = async (deckId: string, file: File) => {
    try {
      await decksApi.importCsv(deckId, file);
      setShowImportModal(false);
      loadDecks(debouncedSearch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Flatten decks for display with indentation
  const flattenDecks = (deckList: Deck[], level = 0): (Deck & { level: number })[] => {
    const result: (Deck & { level: number })[] = [];
    for (const deck of deckList) {
      result.push({ ...deck, level });
      if (deck.children && deck.children.length > 0) {
        result.push(...flattenDecks(deck.children, level + 1));
      }
    }
    return result;
  };

  const flatDecks = flattenDecks(decks);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Decks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize and manage your flashcard decks
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowImportModal(true)} className="btn-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Deck
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks..."
            className="input pl-10"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Decks Grid */}
      {decks.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {flatDecks.filter(d => d.level === 0).map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={() => setEditingDeck(deck)}
              onDelete={() => setDeletingDeck(deck)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Plus className="h-12 w-12" />}
          title="No decks yet"
          description="Create your first deck to start organizing your flashcards."
          action={
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Deck
            </button>
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Deck"
      >
        <DeckForm
          onSubmit={handleCreateDeck}
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Create Deck"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingDeck}
        onClose={() => setEditingDeck(null)}
        title="Edit Deck"
      >
        {editingDeck && (
          <DeckForm
            initialData={editingDeck}
            onSubmit={handleUpdateDeck}
            onCancel={() => setEditingDeck(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingDeck}
        onClose={() => setDeletingDeck(null)}
        title="Delete Deck"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deletingDeck?.name}</strong>?
            This will also delete all cards and sub-decks. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeletingDeck(null)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleDeleteDeck} className="btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Cards"
      >
        <ImportForm
          decks={flatDecks}
          onImport={handleImport}
          onCancel={() => setShowImportModal(false)}
        />
      </Modal>
    </div>
  );
}

interface ImportFormProps {
  decks: Deck[];
  onImport: (deckId: string, file: File) => Promise<void>;
  onCancel: () => void;
}

function ImportForm({ decks, onImport, onCancel }: ImportFormProps) {
  const [selectedDeck, setSelectedDeck] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeck || !file) return;
    
    setIsLoading(true);
    try {
      await onImport(selectedDeck, file);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="deck" className="label">
          Import to Deck
        </label>
        <select
          id="deck"
          value={selectedDeck}
          onChange={(e) => setSelectedDeck(e.target.value)}
          className="input"
          required
        >
          <option value="">Select a deck</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="file" className="label">
          CSV File
        </label>
        <input
          id="file"
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="input"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          CSV should have columns: front, back, type (BASIC or CLOZE), notes, tags
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading || !selectedDeck || !file}>
          {isLoading ? 'Importing...' : 'Import'}
        </button>
      </div>
    </form>
  );
}

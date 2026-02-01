import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Play, 
  Download, 
  Upload,
  Trash2,
  Edit2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { decks as decksApi, cards as cardsApi } from '../services/api';
import type { Deck, Card, CardType } from '../types';
import { CardForm } from '../components/cards/CardForm';
import { Modal } from '../components/ui/Modal';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';

export function DeckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ cardsImported: number; errors: string[] } | null>(null);

  const loadDeck = useCallback(async () => {
    if (!id) return;
    try {
      const [deckData, cardsData] = await Promise.all([
        decksApi.get(id),
        decksApi.getCards(id),
      ]);
      setDeck(deckData);
      setDeckCards(cardsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const handleAddCard = async (data: { type: CardType; front: string; back: string; notes?: string }) => {
    if (!id) return;
    await cardsApi.create({ ...data, deckId: id });
    setShowAddCard(false);
    loadDeck();
  };

  const handleUpdateCard = async (data: { type: CardType; front: string; back: string; notes?: string }) => {
    if (!editingCard) return;
    await cardsApi.update(editingCard.id, data);
    setEditingCard(null);
    loadDeck();
  };

  const handleDeleteCard = async () => {
    if (!deletingCard) return;
    await cardsApi.delete(deletingCard.id);
    setDeletingCard(null);
    loadDeck();
  };

  const handleExport = async () => {
    if (!id) return;
    try {
      const blob = await decksApi.exportCsv(id, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck?.name || 'deck'}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export deck');
    }
  };

  const handleImport = async () => {
    if (!id || !importFile) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await decksApi.importCsv(id, importFile);
      setImportResult({ cardsImported: result.cardsImported, errors: result.errors || [] });
      if (result.cardsImported > 0) {
        loadDeck();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
      setShowImportModal(false);
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!deck) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert type="error" message="Deck not found" />
        <Link to="/decks" className="btn-primary mt-4">
          Back to Decks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/decks" className="hover:text-primary-600 dark:hover:text-primary-400">
          Decks
        </Link>
        {deck.parent && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/decks/${deck.parent.id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
              {deck.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 dark:text-white font-medium">{deck.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{deck.name}</h1>
          {deck.description && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">{deck.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{deckCards.length} cards</span>
            <span>{deckCards.filter(c => new Date(c.nextReviewAt) <= new Date()).length} due</span>
            <span>{deckCards.filter(c => c.repetitions === 0).length} new</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowImportModal(true)} className="btn-secondary btn-sm">
            <Upload className="h-4 w-4 mr-1" />
            Import
          </button>
          <button onClick={handleExport} className="btn-secondary btn-sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </button>
          {deckCards.length > 0 && (
            <Link to={`/study/${deck.id}`} className="btn-primary">
              <Play className="h-4 w-4 mr-2" />
              Study Now
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Sub-decks */}
      {deck.children && deck.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sub-decks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deck.children.map((child) => (
              <Link
                key={child.id}
                to={`/decks/${child.id}`}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">{child.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{child.cardCount ?? 0} cards</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Add Card Button */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setShowAddCard(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </button>
        <button onClick={() => setShowGenerateModal(true)} className="btn-secondary">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate with AI
        </button>
      </div>

      {/* Cards List */}
      {deckCards.length > 0 ? (
        <div className="space-y-4">
          {deckCards.map((card) => (
            <div key={card.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      card.type === 'CLOZE' 
                        ? 'bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-300' 
                        : 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    }`}>
                      {card.type}
                    </span>
                    {card.repetitions === 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        New
                      </span>
                    )}
                    {new Date(card.nextReviewAt) <= new Date() && card.repetitions > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                        Due
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white line-clamp-2">{card.front}</p>
                  {card.type === 'BASIC' && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{card.back}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCard(card)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCard(card)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Plus className="h-12 w-12" />}
          title="No cards yet"
          description="Add your first flashcard to start studying."
          action={
            <button onClick={() => setShowAddCard(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Card
            </button>
          }
        />
      )}

      {/* Add Card Modal */}
      <Modal
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        title="Add New Card"
        size="lg"
      >
        <CardForm
          onSubmit={handleAddCard}
          onCancel={() => setShowAddCard(false)}
          submitLabel="Add Card"
        />
      </Modal>

      {/* Edit Card Modal */}
      <Modal
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        title="Edit Card"
        size="lg"
      >
        {editingCard && (
          <CardForm
            initialData={editingCard}
            onSubmit={handleUpdateCard}
            onCancel={() => setEditingCard(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete Card Modal */}
      <Modal
        isOpen={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        title="Delete Card"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this card? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeletingCard(null)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleDeleteCard} className="btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* AI Generate Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Cards with AI"
        size="lg"
      >
        <GenerateCardsForm
          deckId={id!}
          onGenerated={() => {
            setShowGenerateModal(false);
            loadDeck();
          }}
          onCancel={() => setShowGenerateModal(false)}
        />
      </Modal>

      {/* Import CSV Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
        }}
        title="Import Cards from CSV"
        size="md"
      >
        <div className="space-y-4">
          {importResult ? (
            <>
              <div className={`p-4 rounded-lg ${importResult.cardsImported > 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <p className={`font-medium ${importResult.cardsImported > 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                  {importResult.cardsImported > 0
                    ? `✓ Successfully imported ${importResult.cardsImported} cards!`
                    : 'No cards were imported.'}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-yellow-700">Some rows had issues:</p>
                    <ul className="text-sm text-yellow-600 list-disc list-inside mt-1">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  className="btn-primary"
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Upload a CSV file with your flashcards. The file should have columns for:
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li><code className="bg-gray-100 px-1 rounded">front</code> - The question or front of the card</li>
                  <li><code className="bg-gray-100 px-1 rounded">back</code> - The answer or back of the card</li>
                  <li><code className="bg-gray-100 px-1 rounded">type</code> - Optional: BASIC or CLOZE (defaults to BASIC)</li>
                  <li><code className="bg-gray-100 px-1 rounded">notes</code> - Optional: Additional notes</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  {importFile ? (
                    <span className="text-primary-600 font-medium">{importFile.name}</span>
                  ) : (
                    <>
                      <span className="text-primary-600 font-medium">Click to upload</span>
                      <span className="text-sm text-gray-500">or drag and drop</span>
                    </>
                  )}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className="btn-primary"
                >
                  {isImporting ? 'Importing...' : 'Import Cards'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

interface GenerateCardsFormProps {
  deckId: string;
  onGenerated: () => void;
  onCancel: () => void;
}

function GenerateCardsForm({ deckId, onGenerated, onCancel }: GenerateCardsFormProps) {
  const [text, setText] = useState('');
  const [generatedCards, setGeneratedCards] = useState<{ front: string; back: string; type: CardType }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const cards = await cardsApi.generate(text);
      setGeneratedCards(cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cards');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (generatedCards.length === 0) return;
    setIsSaving(true);
    try {
      await cardsApi.createBulk(
        generatedCards.map((card) => ({
          ...card,
          deckId,
        }))
      );
      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cards');
    } finally {
      setIsSaving(false);
    }
  };

  const removeCard = (index: number) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {generatedCards.length === 0 ? (
        <>
          <div>
            <label htmlFor="text" className="label">
              Paste your study material
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text from your notes, textbook, or any learning material. The AI will extract key concepts and generate flashcards."
              className="input min-h-[200px] resize-y"
              required
            />
          </div>
          <p className="text-sm text-gray-500">
            💡 Tip: The AI works best with structured text containing definitions, facts, or Q&A pairs.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || text.length < 10}
              className="btn-primary"
            >
              {isGenerating ? 'Generating...' : 'Generate Cards'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {generatedCards.map((card, index) => (
              <div key={index} className="card p-3 relative">
                <button
                  onClick={() => removeCard(index)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mb-2 inline-block">
                  {card.type}
                </span>
                <p className="font-medium text-sm">{card.front}</p>
                {card.back && <p className="text-gray-600 text-sm mt-1">{card.back}</p>}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            {generatedCards.length} cards generated. Remove any you don't want.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setGeneratedCards([])} className="btn-secondary">
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || generatedCards.length === 0}
              className="btn-primary"
            >
              {isSaving ? 'Saving...' : `Add ${generatedCards.length} Cards`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

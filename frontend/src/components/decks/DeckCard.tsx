import { Link } from 'react-router-dom';
import { BookOpen, Play, MoreVertical, Folder, FolderOpen } from 'lucide-react';
import type { Deck } from '../../types';
import { useState } from 'react';

interface DeckCardProps {
  deck: Deck;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = deck.children && deck.children.length > 0;

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <FolderOpen className="h-8 w-8 text-primary-500" />
            ) : (
              <Folder className="h-8 w-8 text-primary-500" />
            )}
            <div>
              <Link 
                to={`/decks/${deck.id}`}
                className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {deck.name}
              </Link>
              {deck.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{deck.description}</p>
              )}
            </div>
          </div>
          
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <button
                    onClick={() => {
                      onEdit?.();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 last:rounded-b-lg"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{deck.cardCount ?? 0} cards</span>
          </div>
          {(deck.dueCount ?? 0) > 0 && (
            <div className="text-orange-600 dark:text-orange-400 font-medium">
              {deck.dueCount} due
            </div>
          )}
          {(deck.newCount ?? 0) > 0 && (
            <div className="text-blue-600 dark:text-blue-400">
              {deck.newCount} new
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link
            to={`/decks/${deck.id}`}
            className="btn-secondary btn-sm flex-1"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Browse
          </Link>
          {(deck.cardCount ?? 0) > 0 && (
            <Link
              to={`/study/${deck.id}`}
              className="btn-primary btn-sm flex-1"
            >
              <Play className="h-4 w-4 mr-1" />
              Study
            </Link>
          )}
        </div>
      </div>
      
      {/* Sub-decks */}
      {hasChildren && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-5 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sub-decks:</p>
          <div className="flex flex-wrap gap-2">
            {deck.children!.slice(0, 3).map((child) => (
              <Link
                key={child.id}
                to={`/decks/${child.id}`}
                className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors dark:text-gray-300"
              >
                {child.name}
              </Link>
            ))}
            {deck.children!.length > 3 && (
              <span className="text-xs text-gray-400">
                +{deck.children!.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

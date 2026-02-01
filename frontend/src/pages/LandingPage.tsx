import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  BookOpen, 
  Brain, 
  Download, 
  Sparkles, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: 'Hierarchical Decks',
      description: 'Organize your flashcards with decks and sub-decks for structured learning.',
    },
    {
      icon: Brain,
      title: 'Spaced Repetition',
      description: 'Learn efficiently with SM-2 algorithm that schedules reviews at optimal intervals.',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered',
      description: 'Generate flashcards from text and get cloze deletion suggestions automatically.',
    },
    {
      icon: Download,
      title: 'CSV Import/Export',
      description: 'Easily import existing cards or export your decks for backup.',
    },
  ];

  const cardTypes = [
    {
      title: 'Basic Cards',
      description: 'Simple front/back flashcards for straightforward Q&A learning.',
      example: { front: 'What is the capital of France?', back: 'Paris' },
    },
    {
      title: 'Cloze Deletion',
      description: 'Fill-in-the-blank style cards that hide key information.',
      example: { text: 'The {{c1::mitochondria}} is the powerhouse of the cell.' },
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img src="/logo.svg" alt="StudyDeck" className="h-20 w-20" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
              Building decks to help you{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                study
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              A modern, open-source flashcard app with spaced repetition. 
              Learn anything more effectively with science-backed study methods.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary btn-lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary btn-lg">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/login" className="btn-secondary btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything you need to study effectively
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful features designed for students
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="card p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 text-primary-600 mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Card Types Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Multiple card types
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Create the perfect flashcards for any subject
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {cardTypes.map((cardType) => (
              <div key={cardType.title} className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {cardType.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {cardType.description}
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  {'front' in cardType.example ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Front:</div>
                      <div className="font-medium">{cardType.example.front}</div>
                      <div className="text-sm text-gray-500 mt-2">Back:</div>
                      <div className="font-medium text-primary-600">{cardType.example.back}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Example:</div>
                      <div className="font-medium">
                        The <span className="bg-primary-100 text-primary-700 px-1 rounded">mitochondria</span> is the powerhouse of the cell.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why use spaced repetition?
              </h2>
              <div className="space-y-4">
                {[
                  'Reduce study time by focusing on what you need to review',
                  'Improve long-term retention with optimally timed reviews',
                  'Track your progress and see your knowledge grow',
                  'Study at your own pace with daily limits',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary-200 flex-shrink-0" />
                    <span className="text-primary-100">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-8">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">90%</div>
                <div className="text-primary-200">
                  of information can be retained using spaced repetition
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to start learning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create your first deck in minutes. No credit card required.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn-primary btn-lg">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

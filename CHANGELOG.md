# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-02-01

### Added

- Dark mode support with system preference detection and manual toggle
- Statistics dashboard with activity charts and progress tracking
- Profile settings page with name/email editing and password change
- CSV import modal with drag-and-drop file upload
- Search functionality with debounced queries on decks page
- Seed data script with demo user and sample flashcards
- Adminer service for database management GUI (port 8080)
- User stats API endpoints (`/api/stats`)
- User profile API endpoints (`/api/user/me`)

### Changed

- Enhanced dashboard with 8 stat cards and 7-day activity chart
- Improved navbar with theme toggle and profile link
- Updated all pages and components with dark mode variants

### Fixed

- Backend TypeScript build errors in routes
- Prisma seed script unique constraint field ordering
- Docker build process for production seed compilation

## [0.1.0] - 2026-01-31

### Added

- Initial release of StudyDeck flashcard application
- Hierarchical deck organization with parent/child relationships
- Basic and cloze deletion card types
- SM-2 spaced repetition algorithm implementation
- Study sessions with progress tracking
- Keyboard shortcuts for efficient card reviews
- CSV import/export functionality
- AI-powered card generation (optional)
- JWT-based authentication with bcrypt password hashing
- Docker Compose setup for easy deployment
- PostgreSQL database with Prisma ORM
- React frontend with Tailwind CSS styling
- Express.js REST API backend

[unreleased]: https://github.com/stoneacher/studydeck/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/stoneacher/studydeck/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/stoneacher/studydeck/releases/tag/v0.1.0

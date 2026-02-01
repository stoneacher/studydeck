import { PrismaClient, CardType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@studydeck.app' },
    update: {},
    create: {
      email: 'demo@studydeck.app',
      passwordHash: hashedPassword,
      name: 'Demo User',
    },
  });

  console.log('✓ Created demo user:', demoUser.email);

  // Create sample decks
  const languagesDeck = await prisma.deck.upsert({
    where: { id: 'seed-languages-deck' },
    update: {},
    create: {
      id: 'seed-languages-deck',
      name: 'Languages',
      description: 'Learn vocabulary from different languages',
      userId: demoUser.id,
    },
  });

  const spanishDeck = await prisma.deck.upsert({
    where: { id: 'seed-spanish-deck' },
    update: {},
    create: {
      id: 'seed-spanish-deck',
      name: 'Spanish Basics',
      description: 'Essential Spanish vocabulary for beginners',
      userId: demoUser.id,
      parentId: languagesDeck.id,
    },
  });

  const frenchDeck = await prisma.deck.upsert({
    where: { id: 'seed-french-deck' },
    update: {},
    create: {
      id: 'seed-french-deck',
      name: 'French Basics',
      description: 'Essential French vocabulary for beginners',
      userId: demoUser.id,
      parentId: languagesDeck.id,
    },
  });

  const programmingDeck = await prisma.deck.upsert({
    where: { id: 'seed-programming-deck' },
    update: {},
    create: {
      id: 'seed-programming-deck',
      name: 'Programming Concepts',
      description: 'Core programming and computer science concepts',
      userId: demoUser.id,
    },
  });

  const scienceDeck = await prisma.deck.upsert({
    where: { id: 'seed-science-deck' },
    update: {},
    create: {
      id: 'seed-science-deck',
      name: 'Science Facts',
      description: 'Interesting facts from various scientific fields',
      userId: demoUser.id,
    },
  });

  console.log('✓ Created sample decks');

  // Spanish cards
  const spanishCards = [
    { front: 'Hello', back: 'Hola' },
    { front: 'Goodbye', back: 'Adiós' },
    { front: 'Thank you', back: 'Gracias' },
    { front: 'Please', back: 'Por favor' },
    { front: 'Yes', back: 'Sí' },
    { front: 'No', back: 'No' },
    { front: 'Good morning', back: 'Buenos días' },
    { front: 'Good night', back: 'Buenas noches' },
    { front: 'How are you?', back: '¿Cómo estás?' },
    { front: 'I love you', back: 'Te quiero' },
  ];

  // French cards
  const frenchCards = [
    { front: 'Hello', back: 'Bonjour' },
    { front: 'Goodbye', back: 'Au revoir' },
    { front: 'Thank you', back: 'Merci' },
    { front: 'Please', back: "S'il vous plaît" },
    { front: 'Yes', back: 'Oui' },
    { front: 'No', back: 'Non' },
    { front: 'Good morning', back: 'Bonjour' },
    { front: 'Good night', back: 'Bonne nuit' },
    { front: 'How are you?', back: 'Comment allez-vous?' },
    { front: 'I love you', back: "Je t'aime" },
  ];

  // Programming cards (using cloze deletion)
  const programmingCards = [
    { front: 'What is Big O notation for binary search?', back: 'O(log n)', type: CardType.BASIC },
    { front: 'What data structure uses LIFO (Last In, First Out)?', back: 'Stack', type: CardType.BASIC },
    { front: 'What data structure uses FIFO (First In, First Out)?', back: 'Queue', type: CardType.BASIC },
    { front: 'The {{c1::time complexity}} of a hash table lookup is O(1) on average.', back: '', type: CardType.CLOZE },
    { front: 'A {{c1::binary tree}} has at most {{c2::two}} children per node.', back: '', type: CardType.CLOZE },
    { front: 'What is the purpose of an index in a database?', back: 'To speed up data retrieval operations by providing quick access paths to rows', type: CardType.BASIC },
    { front: 'What does REST stand for?', back: 'Representational State Transfer', type: CardType.BASIC },
    { front: 'HTTP status code 404 means...', back: 'Not Found - The requested resource does not exist', type: CardType.BASIC },
    { front: 'HTTP status code 500 means...', back: 'Internal Server Error - Something went wrong on the server', type: CardType.BASIC },
    { front: 'What is the difference between == and === in JavaScript?', back: '== compares values with type coercion, === compares values and types strictly', type: CardType.BASIC },
  ];

  // Science cards
  const scienceCards = [
    { front: 'What is the speed of light in a vacuum?', back: '299,792,458 meters per second (approximately 300,000 km/s)' },
    { front: 'What is the chemical formula for water?', back: 'H₂O' },
    { front: 'What planet is known as the Red Planet?', back: 'Mars' },
    { front: 'What is the powerhouse of the cell?', back: 'Mitochondria' },
    { front: 'What is the most abundant gas in Earth\'s atmosphere?', back: 'Nitrogen (about 78%)' },
    { front: 'What is the atomic number of Carbon?', back: '6' },
    { front: 'What is the hardest natural substance on Earth?', back: 'Diamond' },
    { front: 'How many bones are in the adult human body?', back: '206' },
    { front: 'What is the largest organ in the human body?', back: 'Skin' },
    { front: 'What is the approximate age of the Earth?', back: '4.54 billion years' },
  ];

  // Insert cards
  for (const card of spanishCards) {
    await prisma.card.create({
      data: {
        deckId: spanishDeck.id,
        front: card.front,
        back: card.back,
        type: CardType.BASIC,
      },
    });
  }

  for (const card of frenchCards) {
    await prisma.card.create({
      data: {
        deckId: frenchDeck.id,
        front: card.front,
        back: card.back,
        type: CardType.BASIC,
      },
    });
  }

  for (const card of programmingCards) {
    await prisma.card.create({
      data: {
        deckId: programmingDeck.id,
        front: card.front,
        back: card.back,
        type: card.type || CardType.BASIC,
      },
    });
  }

  for (const card of scienceCards) {
    await prisma.card.create({
      data: {
        deckId: scienceDeck.id,
        front: card.front,
        back: card.back,
        type: CardType.BASIC,
      },
    });
  }

  console.log('✓ Created sample cards');

  // Create some tags
  const tags = ['vocabulary', 'beginner', 'programming', 'science', 'language'];
  for (const tagName of tags) {
    await prisma.tag.upsert({
      where: {
        userId_name: {
          name: tagName,
          userId: demoUser.id,
        },
      },
      update: {},
      create: {
        name: tagName,
        userId: demoUser.id,
      },
    });
  }

  console.log('✓ Created sample tags');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Demo account credentials:');
  console.log('  Email: demo@studydeck.app');
  console.log('  Password: demo1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

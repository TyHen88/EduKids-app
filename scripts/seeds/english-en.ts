import { assist, select, seedCourse, text, type CourseContent } from "./_content";

import type { Seed } from "../seed";

// ---------------------------------------------------------------------------
// English for grades 2–3 — the English counterpart to `math-kh`.
//
// Six units, two lessons each, five questions per lesson (60 questions). Each
// lesson opens with a TEXT block carrying the worked example, because the
// schema has no per-question explanation field.
//
// This is a *separate* course from the beginner "English" seeded by `db:prod`
// — `seedCourse` matches on title, so the two never collide.
// ---------------------------------------------------------------------------

const COURSE: CourseContent = {
  title: "English (Grades 2–3)",
  imageSrc: "/en.svg",
  category: "Language",
  difficulty: "Intermediate",
  description:
    "Multiple-choice English practice for grades 2 to 3 — vocabulary, nouns, verbs, adjectives, sentences, punctuation and short reading passages.",
  units: [
    // ===================================================== 1. Words We Know
    {
      title: "Unit 1 · Words We Know",
      description: "Everyday words for school, home and family",
      lessons: [
        {
          title: "School Words",
          blocks: [
            text(
              "We use special words for the things we see at school. 🏫\n\nExample: You write with a pencil. You read a book."
            ),
            select("Sara opens her ____ and starts to read the story.", [
              { text: "book", correct: true },
              { text: "chair" },
              { text: "door" },
              { text: "window" },
            ]),
            select("Which one do you use to write?", [
              { text: "A spoon" },
              { text: "A pencil", correct: true },
              { text: "A shoe" },
              { text: "A plate" },
            ]),
            select("The person who teaches the class is called a ____.", [
              { text: "doctor" },
              { text: "farmer" },
              { text: "teacher", correct: true },
              { text: "driver" },
            ]),
            select("Which word does NOT belong with the others?", [
              { text: "pen" },
              { text: "ruler" },
              { text: "eraser" },
              { text: "banana", correct: true },
            ]),
            assist("We put our books inside our ____ before we walk to school.", [
              { text: "bag", correct: true },
              { text: "cup" },
              { text: "hat" },
              { text: "clock" },
            ]),
          ],
        },
        {
          title: "Family and Home",
          blocks: [
            text(
              "Family words tell us who people are. 👨‍👩‍👧\n\nExample: My mother's son is my brother. My father's daughter is my sister."
            ),
            select("Your mother's mother is your ____.", [
              { text: "aunt" },
              { text: "sister" },
              { text: "grandmother", correct: true },
              { text: "cousin" },
            ]),
            select("Dara has one brother and one sister. How many children are in the family?", [
              { text: "Two" },
              { text: "Three", correct: true },
              { text: "Four" },
              { text: "Five" },
            ]),
            select("We cook our food in the ____.", [
              { text: "kitchen", correct: true },
              { text: "bedroom" },
              { text: "garden" },
              { text: "garage" },
            ]),
            select("Which word names a room where you sleep?", [
              { text: "Bathroom" },
              { text: "Bedroom", correct: true },
              { text: "Kitchen" },
              { text: "Classroom" },
            ]),
            assist("My father's brother is my ____.", [
              { text: "uncle", correct: true },
              { text: "aunt" },
              { text: "nephew" },
              { text: "grandfather" },
            ]),
          ],
        },
      ],
    },

    // ========================================================== 2. Nouns
    {
      title: "Unit 2 · Nouns",
      description: "Naming words, one and many",
      lessons: [
        {
          title: "One and Many",
          blocks: [
            text(
              "To talk about more than one thing, we usually add -s.\n\nExample: one cat → two cats\n\nAfter -s, -x, -ch or -sh we add -es: one box → two boxes."
            ),
            select("What is the plural of 'dog'?", [
              { text: "dog" },
              { text: "dogs", correct: true },
              { text: "doges" },
              { text: "dogies" },
            ]),
            select("What is the plural of 'box'?", [
              { text: "boxs" },
              { text: "boxies" },
              { text: "boxes", correct: true },
              { text: "box" },
            ]),
            select("Choose the correct sentence.", [
              { text: "I have three book." },
              { text: "I have three books.", correct: true },
              { text: "I have three bookes." },
              { text: "I have three bookies." },
            ]),
            select("What is the plural of 'baby'?", [
              { text: "babys" },
              { text: "babies", correct: true },
              { text: "babyes" },
              { text: "baby" },
            ]),
            assist("What is the plural of 'child'?", [
              { text: "childs" },
              { text: "childes" },
              { text: "children", correct: true },
              { text: "childrens" },
            ]),
          ],
        },
        {
          title: "Naming Words",
          blocks: [
            text(
              "A noun names a person, a place, an animal or a thing.\n\nWe say 'a' before a consonant sound and 'an' before a vowel sound (a, e, i, o, u).\n\nExample: a banana, an apple."
            ),
            select("Which word is a noun?", [
              { text: "run" },
              { text: "happy" },
              { text: "river", correct: true },
              { text: "quickly" },
            ]),
            select("Choose the correct word: I ate ____ orange for breakfast.", [
              { text: "a" },
              { text: "an", correct: true },
              { text: "the one" },
              { text: "some of" },
            ]),
            select("Choose the correct word: My friend has ____ new bicycle.", [
              { text: "a", correct: true },
              { text: "an" },
              { text: "any" },
              { text: "much" },
            ]),
            select("Which noun names a place?", [
              { text: "market", correct: true },
              { text: "jump" },
              { text: "loud" },
              { text: "slowly" },
            ]),
            assist("Which word should begin with a capital letter because it is a name?", [
              { text: "city" },
              { text: "boy" },
              { text: "phnom penh", correct: true },
              { text: "school" },
            ]),
          ],
        },
      ],
    },

    // ========================================================== 3. Verbs
    {
      title: "Unit 3 · Verbs",
      description: "Action words, present and past",
      lessons: [
        {
          title: "Action Words",
          blocks: [
            text(
              "A verb tells what someone does. 🏃\n\nWith he, she or it we add -s to the verb.\n\nExample: I run. → She runs."
            ),
            select("Which word is an action word (a verb)?", [
              { text: "table" },
              { text: "swim", correct: true },
              { text: "blue" },
              { text: "under" },
            ]),
            select("Choose the correct sentence.", [
              { text: "She play football every day." },
              { text: "She plays football every day.", correct: true },
              { text: "She playing football every day." },
              { text: "She to play football every day." },
            ]),
            select("The birds ____ in the sky.", [
              { text: "fly", correct: true },
              { text: "flies" },
              { text: "flying" },
              { text: "to fly" },
            ]),
            select("Sok ____ his homework after school.", [
              { text: "do" },
              { text: "does", correct: true },
              { text: "doing" },
              { text: "done" },
            ]),
            assist("Which sentence is correct?", [
              { text: "We eats rice." },
              { text: "We eat rice.", correct: true },
              { text: "We eating rice." },
              { text: "We is eat rice." },
            ]),
          ],
        },
        {
          title: "Past and Present",
          blocks: [
            text(
              "To talk about yesterday we use the past. Many verbs add -ed.\n\nExample: Today I walk. → Yesterday I walked.\n\nSome verbs change: go → went, eat → ate."
            ),
            select("Yesterday I ____ to the market with my mother.", [
              { text: "go" },
              { text: "goes" },
              { text: "went", correct: true },
              { text: "going" },
            ]),
            select("What is the past of 'play'?", [
              { text: "plaid" },
              { text: "played", correct: true },
              { text: "plays" },
              { text: "playing" },
            ]),
            select("Last night we ____ noodles for dinner.", [
              { text: "eat" },
              { text: "eats" },
              { text: "ate", correct: true },
              { text: "eating" },
            ]),
            select("Which sentence tells about the past?", [
              { text: "I clean my room now." },
              { text: "I cleaned my room yesterday.", correct: true },
              { text: "I will clean my room." },
              { text: "I am cleaning my room." },
            ]),
            assist("What is the past of 'see'?", [
              { text: "seed" },
              { text: "seen" },
              { text: "saw", correct: true },
              { text: "sees" },
            ]),
          ],
        },
      ],
    },

    // ========================================= 4. Adjectives and Opposites
    {
      title: "Unit 4 · Adjectives and Opposites",
      description: "Describing words and their opposites",
      lessons: [
        {
          title: "Describing Words",
          blocks: [
            text(
              "An adjective describes a noun. It tells us how something looks, feels or tastes.\n\nExample: a tall tree, a sweet mango, a happy boy."
            ),
            select("Which word is a describing word (an adjective)?", [
              { text: "elephant" },
              { text: "heavy", correct: true },
              { text: "jump" },
              { text: "school" },
            ]),
            select("The ice is very ____.", [
              { text: "cold", correct: true },
              { text: "run" },
              { text: "chair" },
              { text: "sings" },
            ]),
            select("An elephant is a very ____ animal.", [
              { text: "tiny" },
              { text: "big", correct: true },
              { text: "quickly" },
              { text: "eats" },
            ]),
            select("In the sentence 'The red flower is beautiful', which word is the adjective?", [
              { text: "The" },
              { text: "red", correct: true },
              { text: "flower" },
              { text: "is" },
            ]),
            assist("Honey tastes ____.", [
              { text: "sweet", correct: true },
              { text: "loud" },
              { text: "fast" },
              { text: "dark" },
            ]),
          ],
        },
        {
          title: "Opposites",
          blocks: [
            text(
              "Opposites are words that mean the other thing.\n\nExample: hot ↔ cold, big ↔ small, day ↔ night."
            ),
            select("What is the opposite of 'hot'?", [
              { text: "warm" },
              { text: "cold", correct: true },
              { text: "sunny" },
              { text: "dry" },
            ]),
            select("What is the opposite of 'happy'?", [
              { text: "sad", correct: true },
              { text: "glad" },
              { text: "kind" },
              { text: "funny" },
            ]),
            select("What is the opposite of 'open'?", [
              { text: "push" },
              { text: "close", correct: true },
              { text: "enter" },
              { text: "start" },
            ]),
            select("What is the opposite of 'young'?", [
              { text: "small" },
              { text: "new" },
              { text: "old", correct: true },
              { text: "short" },
            ]),
            assist("What is the opposite of 'heavy'?", [
              { text: "light", correct: true },
              { text: "hard" },
              { text: "full" },
              { text: "wide" },
            ]),
          ],
        },
      ],
    },

    // ==================================== 5. Sentences and Punctuation
    {
      title: "Unit 5 · Sentences and Punctuation",
      description: "Word order, capital letters and end marks",
      lessons: [
        {
          title: "Building Sentences",
          blocks: [
            text(
              "A sentence tells a whole idea. English word order is usually:\n\nwho → does what → what\n\nExample: The boy (who) kicks (does what) the ball (what)."
            ),
            select("Put the words in order: 'dog / the / barks'", [
              { text: "Barks the dog." },
              { text: "The dog barks.", correct: true },
              { text: "Dog barks the." },
              { text: "The barks dog." },
            ]),
            select("Put the words in order: 'rice / eat / I'", [
              { text: "I eat rice.", correct: true },
              { text: "Rice I eat." },
              { text: "Eat rice I." },
              { text: "I rice eat." },
            ]),
            select("Which group of words is a complete sentence?", [
              { text: "The big blue" },
              { text: "Under the tall tree" },
              { text: "Birds sing in the morning.", correct: true },
              { text: "Running very fast and" },
            ]),
            select("Choose the correct sentence.", [
              { text: "To school goes she." },
              { text: "She goes to school.", correct: true },
              { text: "Goes she to school." },
              { text: "School she to goes." },
            ]),
            assist("Put the words in order: 'is / my / name / Dara'", [
              { text: "Name my is Dara." },
              { text: "My name is Dara.", correct: true },
              { text: "Is my name Dara." },
              { text: "Dara name my is." },
            ]),
          ],
        },
        {
          title: "Capital Letters and Punctuation",
          blocks: [
            text(
              "Every sentence starts with a CAPITAL letter.\n\nA telling sentence ends with a full stop (.)\nA question ends with a question mark (?)\n\nExample: What is your name?"
            ),
            select("Which sentence is written correctly?", [
              { text: "my sister is six years old." },
              { text: "My sister is six years old.", correct: true },
              { text: "My sister is six years old" },
              { text: "my Sister is six years old" },
            ]),
            select("Which mark belongs at the end? 'Where do you live ____'", [
              { text: "." },
              { text: "?", correct: true },
              { text: "," },
              { text: "!" },
            ]),
            select("Which mark belongs at the end? 'I like to play with my friends ____'", [
              { text: ".", correct: true },
              { text: "?" },
              { text: "," },
              { text: ":" },
            ]),
            select("Which word needs a capital letter?", [
              { text: "table" },
              { text: "monday", correct: true },
              { text: "green" },
              { text: "water" },
            ]),
            assist("Which sentence is written correctly?", [
              { text: "how old are you." },
              { text: "How old are you?", correct: true },
              { text: "how old are you?" },
              { text: "How old are you," },
            ]),
          ],
        },
      ],
    },

    // ======================================= 6. Reading and Mixed Practice
    {
      title: "Unit 6 · Reading and Mixed Practice",
      description: "Short passages and a mix of everything",
      lessons: [
        {
          title: "Read and Answer",
          blocks: [
            text(
              "Read the story slowly, then answer.\n\nMalis has a small garden behind her house. Every morning she gives water to her flowers. She has five red flowers and three yellow flowers. Her cat, Mimi, likes to sleep under the mango tree in the garden."
            ),
            select("Where is Malis's garden?", [
              { text: "In front of her house" },
              { text: "Behind her house", correct: true },
              { text: "At her school" },
              { text: "Next to the market" },
            ]),
            select("How many flowers does Malis have in all?", [
              { text: "Five" },
              { text: "Six" },
              { text: "Eight", correct: true },
              { text: "Nine" },
            ]),
            select("What does Malis do every morning?", [
              { text: "She waters her flowers.", correct: true },
              { text: "She sells her flowers." },
              { text: "She climbs the mango tree." },
              { text: "She feeds the birds." },
            ]),
            select("Where does Mimi like to sleep?", [
              { text: "On the bed" },
              { text: "Under the mango tree", correct: true },
              { text: "Inside the house" },
              { text: "Beside the river" },
            ]),
            assist("What kind of animal is Mimi?", [
              { text: "A dog" },
              { text: "A cat", correct: true },
              { text: "A bird" },
              { text: "A fish" },
            ]),
          ],
        },
        {
          title: "Mixed Practice",
          blocks: [
            text(
              "Now let's use everything together: nouns, verbs, adjectives and punctuation. Read each question carefully. ⭐"
            ),
            select("Choose the correct sentence.", [
              { text: "the two boy runs fast." },
              { text: "The two boys run fast.", correct: true },
              { text: "The two boys runs fast" },
              { text: "Two the boys run fast." },
            ]),
            select("Which word is a verb in this sentence? 'The happy girl sings a song.'", [
              { text: "happy" },
              { text: "girl" },
              { text: "sings", correct: true },
              { text: "song" },
            ]),
            select("Yesterday my brother ____ a big fish in the river.", [
              { text: "catch" },
              { text: "catches" },
              { text: "caught", correct: true },
              { text: "catching" },
            ]),
            select("What is the opposite of 'noisy'?", [
              { text: "quiet", correct: true },
              { text: "angry" },
              { text: "busy" },
              { text: "clean" },
            ]),
            assist("Choose the correct sentence.", [
              { text: "She have an new book." },
              { text: "She has a new book.", correct: true },
              { text: "She has an new book." },
              { text: "She having a new book." },
            ]),
          ],
        },
      ],
    },
  ],
};

const seed: Seed = {
  description: "English practice, grades 2–3 (60 questions)",
  run: (db) => seedCourse(db, COURSE),
};

export default seed;

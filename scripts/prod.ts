import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Seed content (real, distinct data — edit here to add/adjust courses).
//
// A lesson is an ordered list of blocks:
//   - TEXT  → a teaching/reading block (body, optional image)
//   - SELECT/ASSIST → a question with answer options (exactly one `correct`)
// Order is derived from array position, so just reorder the arrays to reorder
// the app. Question answers were verified by hand.
// ---------------------------------------------------------------------------

type Option = { text: string; correct?: boolean };

type Block =
  | {
      type: "TEXT";
      body: string;
      imageSrc?: string;
      caption?: string;
      imagePosition?: "left" | "right";
    }
  | { type: "SELECT" | "ASSIST"; question: string; options: Option[] };

type LessonSeed = { title: string; blocks: Block[] };
type UnitSeed = { title: string; description: string; lessons: LessonSeed[] };
type CourseSeed = {
  title: string;
  imageSrc: string;
  category: string;
  difficulty: string;
  description: string;
  units: UnitSeed[];
};

// Convenience builders to keep the content below readable.
const text = (body: string, extra: Partial<Extract<Block, { type: "TEXT" }>> = {}): Block => ({
  type: "TEXT",
  body,
  ...extra,
});
const select = (question: string, options: Option[]): Block => ({
  type: "SELECT",
  question,
  options,
});
const assist = (question: string, options: Option[]): Block => ({
  type: "ASSIST",
  question,
  options,
});

const COURSES: CourseSeed[] = [
  // ===================================================================== MATH
  {
    title: "Math",
    imageSrc: "/math.svg",
    category: "Math",
    difficulty: "Beginner",
    description: "Count, add and subtract with fun numbers up to 20!",
    units: [
      {
        title: "Unit 1 · Counting & Numbers",
        description: "Learn to count and recognize numbers 1–10",
        lessons: [
          {
            title: "Numbers 1 to 5",
            blocks: [
              text(
                "Let's learn to count! 1, 2, 3, 4, 5. Hold up your fingers and count along with me. 🖐️"
              ),
              select("How many stars? ⭐⭐⭐", [
                { text: "3", correct: true },
                { text: "2" },
                { text: "4" },
              ]),
              select("Which number comes right after 3?", [
                { text: "4", correct: true },
                { text: "5" },
                { text: "2" },
              ]),
              select("How many apples? 🍎🍎", [
                { text: "2", correct: true },
                { text: "1" },
                { text: "3" },
              ]),
              assist("Count the dots:  • • • • •", [
                { text: "5", correct: true },
                { text: "4" },
                { text: "6" },
              ]),
            ],
          },
          {
            title: "Numbers 6 to 10",
            blocks: [
              text(
                "Great job! Now bigger numbers: 6, 7, 8, 9, 10. You can count all the way to ten! 🔟"
              ),
              select("Which number comes right after 7?", [
                { text: "8", correct: true },
                { text: "9" },
                { text: "6" },
              ]),
              select("How many fingers are on two hands?", [
                { text: "10", correct: true },
                { text: "5" },
                { text: "8" },
              ]),
              select("What number is between 8 and 10?", [
                { text: "9", correct: true },
                { text: "7" },
                { text: "11" },
              ]),
              assist("Count the cookies:  🍪🍪🍪🍪🍪🍪", [
                { text: "6", correct: true },
                { text: "5" },
                { text: "7" },
              ]),
            ],
          },
          {
            title: "More or Less",
            blocks: [
              text(
                "Which group has MORE? Count both and compare the numbers. The bigger number has more! 🤔"
              ),
              select("Which number is bigger: 5 or 8?", [
                { text: "8", correct: true },
                { text: "5" },
                { text: "They are equal" },
              ]),
              select("Which number is smaller: 3 or 7?", [
                { text: "3", correct: true },
                { text: "7" },
                { text: "They are equal" },
              ]),
              select("How many more is 6 than 4?", [
                { text: "2", correct: true },
                { text: "1" },
                { text: "3" },
              ]),
              assist("Which is the biggest number: 2, 9, or 5?", [
                { text: "9", correct: true },
                { text: "5" },
                { text: "2" },
              ]),
            ],
          },
        ],
      },
      {
        title: "Unit 2 · Addition",
        description: "Add numbers together to find the total",
        lessons: [
          {
            title: "Adding to 5",
            blocks: [
              text(
                "Addition means putting groups together. 2 + 1 means 2 things and 1 more. ➕"
              ),
              select("1 + 1 = ?", [
                { text: "2", correct: true },
                { text: "1" },
                { text: "3" },
              ]),
              select("2 + 2 = ?", [
                { text: "4", correct: true },
                { text: "3" },
                { text: "5" },
              ]),
              select("3 + 1 = ?", [
                { text: "4", correct: true },
                { text: "5" },
                { text: "3" },
              ]),
              select("2 + 3 = ?", [
                { text: "5", correct: true },
                { text: "4" },
                { text: "6" },
              ]),
              assist("1 + 4 = ?", [
                { text: "5", correct: true },
                { text: "4" },
                { text: "6" },
              ]),
            ],
          },
          {
            title: "Adding to 10",
            blocks: [
              text(
                "Let's add bigger numbers, all the way up to 10. Use your fingers to help you count on. 🖐️🖐️"
              ),
              select("5 + 2 = ?", [
                { text: "7", correct: true },
                { text: "6" },
                { text: "8" },
              ]),
              select("4 + 3 = ?", [
                { text: "7", correct: true },
                { text: "6" },
                { text: "8" },
              ]),
              select("6 + 2 = ?", [
                { text: "8", correct: true },
                { text: "7" },
                { text: "9" },
              ]),
              select("5 + 5 = ?", [
                { text: "10", correct: true },
                { text: "9" },
                { text: "11" },
              ]),
              assist("7 + 3 = ?", [
                { text: "10", correct: true },
                { text: "9" },
                { text: "11" },
              ]),
            ],
          },
          {
            title: "Adding Doubles",
            blocks: [
              text(
                "Doubles add the same number twice. 3 + 3 is a double. Doubles are easy to remember! ✨"
              ),
              select("2 + 2 = ?", [
                { text: "4", correct: true },
                { text: "2" },
                { text: "6" },
              ]),
              select("4 + 4 = ?", [
                { text: "8", correct: true },
                { text: "6" },
                { text: "10" },
              ]),
              select("5 + 5 = ?", [
                { text: "10", correct: true },
                { text: "9" },
                { text: "12" },
              ]),
              select("6 + 6 = ?", [
                { text: "12", correct: true },
                { text: "11" },
                { text: "13" },
              ]),
              assist("8 + 8 = ?", [
                { text: "16", correct: true },
                { text: "15" },
                { text: "18" },
              ]),
            ],
          },
        ],
      },
      {
        title: "Unit 3 · Subtraction",
        description: "Take away to find what is left",
        lessons: [
          {
            title: "Subtract within 5",
            blocks: [
              text(
                "Subtraction means taking away. 3 − 1 means take 1 away from 3, and 2 are left. ➖"
              ),
              select("2 − 1 = ?", [
                { text: "1", correct: true },
                { text: "2" },
                { text: "0" },
              ]),
              select("3 − 1 = ?", [
                { text: "2", correct: true },
                { text: "1" },
                { text: "3" },
              ]),
              select("5 − 2 = ?", [
                { text: "3", correct: true },
                { text: "2" },
                { text: "4" },
              ]),
              select("4 − 4 = ?", [
                { text: "0", correct: true },
                { text: "4" },
                { text: "1" },
              ]),
              assist("5 − 3 = ?", [
                { text: "2", correct: true },
                { text: "3" },
                { text: "1" },
              ]),
            ],
          },
          {
            title: "Subtract within 10",
            blocks: [
              text(
                "Take away from bigger numbers. Count backwards to find the answer. 🔢"
              ),
              select("7 − 2 = ?", [
                { text: "5", correct: true },
                { text: "4" },
                { text: "6" },
              ]),
              select("9 − 4 = ?", [
                { text: "5", correct: true },
                { text: "4" },
                { text: "6" },
              ]),
              select("10 − 5 = ?", [
                { text: "5", correct: true },
                { text: "6" },
                { text: "4" },
              ]),
              select("8 − 3 = ?", [
                { text: "5", correct: true },
                { text: "6" },
                { text: "4" },
              ]),
              assist("10 − 7 = ?", [
                { text: "3", correct: true },
                { text: "2" },
                { text: "4" },
              ]),
            ],
          },
          {
            title: "Find the Missing Number",
            blocks: [
              text(
                "What number is missing? Think about what makes the answer correct. 🧩"
              ),
              select("2 + ? = 5", [
                { text: "3", correct: true },
                { text: "2" },
                { text: "4" },
              ]),
              select("? + 4 = 6", [
                { text: "2", correct: true },
                { text: "3" },
                { text: "1" },
              ]),
              select("5 − ? = 2", [
                { text: "3", correct: true },
                { text: "2" },
                { text: "4" },
              ]),
              assist("? + 5 = 10", [
                { text: "5", correct: true },
                { text: "4" },
                { text: "6" },
              ]),
            ],
          },
        ],
      },
    ],
  },

  // ================================================================== ENGLISH
  {
    title: "English",
    imageSrc: "/en.svg",
    category: "Language",
    difficulty: "Beginner",
    description: "Learn the ABCs, first words, colors and animals in English!",
    units: [
      {
        title: "Unit 1 · The Alphabet",
        description: "Learn the ABCs and read your first words",
        lessons: [
          {
            title: "Letters A to E",
            blocks: [
              text(
                "The English alphabet starts with A, B, C, D, E. Say each letter out loud! 🔤"
              ),
              select("Which letter comes first in the alphabet?", [
                { text: "A", correct: true },
                { text: "B" },
                { text: "C" },
              ]),
              select("Which letter comes right after B?", [
                { text: "C", correct: true },
                { text: "D" },
                { text: "A" },
              ]),
              select("'Apple' starts with which letter? 🍎", [
                { text: "A", correct: true },
                { text: "E" },
                { text: "B" },
              ]),
              assist("Which one is a vowel?", [
                { text: "A", correct: true },
                { text: "B" },
                { text: "C" },
              ]),
            ],
          },
          {
            title: "Letters F to J",
            blocks: [
              text("More letters: F, G, H, I, J. Can you say them in order? 🗣️"),
              select("Which letter comes right after G?", [
                { text: "H", correct: true },
                { text: "I" },
                { text: "F" },
              ]),
              select("'Igloo' starts with which letter?", [
                { text: "I", correct: true },
                { text: "J" },
                { text: "G" },
              ]),
              assist("Which one is a vowel?", [
                { text: "I", correct: true },
                { text: "F" },
                { text: "H" },
              ]),
            ],
          },
          {
            title: "First Words",
            blocks: [
              text("Let's read our first words: cat, dog, sun. 🐱🐶☀️"),
              select("Which word means 🐱?", [
                { text: "cat", correct: true },
                { text: "dog" },
                { text: "sun" },
              ]),
              select("Which word means ☀️?", [
                { text: "sun", correct: true },
                { text: "cat" },
                { text: "dog" },
              ]),
              select("Which word means 🐶?", [
                { text: "dog", correct: true },
                { text: "sun" },
                { text: "cat" },
              ]),
              assist("How many letters are in the word 'cat'?", [
                { text: "3", correct: true },
                { text: "2" },
                { text: "4" },
              ]),
            ],
          },
        ],
      },
      {
        title: "Unit 2 · Colors, Numbers & Animals",
        description: "Name colors, count, and meet the animals",
        lessons: [
          {
            title: "Colors",
            blocks: [
              text("Colors are everywhere! Red, blue, green and yellow. 🌈"),
              select("What color is the sky on a sunny day? ☀️", [
                { text: "Blue", correct: true },
                { text: "Green" },
                { text: "Red" },
              ]),
              select("What color is grass? 🌱", [
                { text: "Green", correct: true },
                { text: "Blue" },
                { text: "Yellow" },
              ]),
              select("What color is a banana? 🍌", [
                { text: "Yellow", correct: true },
                { text: "Red" },
                { text: "Blue" },
              ]),
              assist("What color is a strawberry? 🍓", [
                { text: "Red", correct: true },
                { text: "Green" },
                { text: "Blue" },
              ]),
            ],
          },
          {
            title: "Counting in English",
            blocks: [
              text("Count in English: one, two, three, four, five! ✋"),
              select("What is 'two' as a number?", [
                { text: "2", correct: true },
                { text: "3" },
                { text: "1" },
              ]),
              select("How do you write 5 in words?", [
                { text: "five", correct: true },
                { text: "four" },
                { text: "three" },
              ]),
              select("Which word comes after 'three'?", [
                { text: "four", correct: true },
                { text: "five" },
                { text: "two" },
              ]),
              assist("How many is 'one'?", [
                { text: "1", correct: true },
                { text: "2" },
                { text: "3" },
              ]),
            ],
          },
          {
            title: "Animals",
            blocks: [
              text("Meet the animals: cat, dog, fish and bird. 🐱🐶🐟🐦"),
              select("Which animal can fly? 🐦", [
                { text: "Bird", correct: true },
                { text: "Fish" },
                { text: "Cat" },
              ]),
              select("Which animal lives in water? 🐟", [
                { text: "Fish", correct: true },
                { text: "Dog" },
                { text: "Bird" },
              ]),
              select("Which animal says 'woof'?", [
                { text: "Dog", correct: true },
                { text: "Cat" },
                { text: "Fish" },
              ]),
              assist("Which animal says 'meow'?", [
                { text: "Cat", correct: true },
                { text: "Dog" },
                { text: "Bird" },
              ]),
            ],
          },
        ],
      },
    ],
  },

  // ==================================================================== KHMER
  {
    title: "Khmer",
    imageSrc: "/kh.svg",
    category: "Language",
    difficulty: "Beginner",
    description: "Learn Khmer numbers (លេខ) and everyday greetings.",
    units: [
      {
        title: "Unit 1 · Khmer Numbers (លេខ)",
        description: "Learn the Khmer numerals ០–៩",
        lessons: [
          {
            title: "Numbers ០–៥",
            blocks: [
              text(
                "Khmer numerals:  ០ ១ ២ ៣ ៤ ៥  mean  0, 1, 2, 3, 4, 5. Trace each one with your finger."
              ),
              select("What number is  ១  ?", [
                { text: "1", correct: true },
                { text: "2" },
                { text: "3" },
              ]),
              select("What number is  ៣  ?", [
                { text: "3", correct: true },
                { text: "2" },
                { text: "4" },
              ]),
              select("What number is  ៥  ?", [
                { text: "5", correct: true },
                { text: "4" },
                { text: "6" },
              ]),
              assist("What number is  ២  ?", [
                { text: "2", correct: true },
                { text: "1" },
                { text: "3" },
              ]),
            ],
          },
          {
            title: "Numbers ៦–៩",
            blocks: [
              text("More Khmer numerals:  ៦ ៧ ៨ ៩  mean  6, 7, 8, 9."),
              select("What number is  ៧  ?", [
                { text: "7", correct: true },
                { text: "6" },
                { text: "8" },
              ]),
              select("What number is  ៩  ?", [
                { text: "9", correct: true },
                { text: "8" },
                { text: "7" },
              ]),
              select("What number is  ៦  ?", [
                { text: "6", correct: true },
                { text: "7" },
                { text: "5" },
              ]),
              assist("What number is  ៨  ?", [
                { text: "8", correct: true },
                { text: "9" },
                { text: "7" },
              ]),
            ],
          },
        ],
      },
      {
        title: "Unit 2 · Greetings (ការស្វាគមន៍)",
        description: "Say hello and thank you in Khmer",
        lessons: [
          {
            title: "Hello & Thank You",
            blocks: [
              text(
                "Khmer greetings:  សួស្តី  means \"Hello\", and  អរគុណ  means \"Thank you\"."
              ),
              select('What does  សួស្តី  mean?', [
                { text: "Hello", correct: true },
                { text: "Goodbye" },
                { text: "Thank you" },
              ]),
              select('What does  អរគុណ  mean?', [
                { text: "Thank you", correct: true },
                { text: "Hello" },
                { text: "Sorry" },
              ]),
              assist('How do you say "Hello" in Khmer?', [
                { text: "សួស្តី", correct: true },
                { text: "អរគុណ" },
                { text: "លា" },
              ]),
            ],
          },
        ],
      },
    ],
  },
];

const BADGES = [
  { name: "Star Cadet", icon: "🌟", description: "Completed your very first lesson!" },
  { name: "Rocket Rider", icon: "🚀", description: "Blasted through another lesson." },
  { name: "Moon Walker", icon: "🌙", description: "One small step for a big learner." },
  { name: "Planet Hopper", icon: "🪐", description: "Explored a brand new world of knowledge." },
  { name: "Comet Catcher", icon: "☄️", description: "Fast and bright — you caught a comet!" },
  { name: "Alien Friend", icon: "👽", description: "Made friends across the galaxy." },
  { name: "UFO Pilot", icon: "🛸", description: "Soaring above the rest." },
  { name: "Galaxy Master", icon: "🌌", description: "A true explorer of the whole galaxy." },
];

const main = async () => {
  try {
    console.log("Seeding database…");

    // Delete all existing data (children first where not cascaded by the delete order).
    await db.delete(schema.lessonBlockOptions);
    await db.delete(schema.lessonBlocks);
    await db.delete(schema.lessons);
    await db.delete(schema.units);
    await db.delete(schema.userBadges);
    await db.delete(schema.badges);
    await db.delete(schema.userProgress);
    await db.delete(schema.courses);

    // Star cards (collectible stickers, awarded on lesson completion).
    await db.insert(schema.badges).values(BADGES);

    let courseCount = 0;
    let unitCount = 0;
    let lessonCount = 0;
    let blockCount = 0;
    let optionCount = 0;

    for (const c of COURSES) {
      const [course] = await db
        .insert(schema.courses)
        .values({
          title: c.title,
          imageSrc: c.imageSrc,
          category: c.category,
          difficulty: c.difficulty,
          description: c.description,
        })
        .returning();
      courseCount++;

      let unitOrder = 1;
      for (const u of c.units) {
        const [unit] = await db
          .insert(schema.units)
          .values({
            courseId: course.id,
            title: u.title,
            description: u.description,
            order: unitOrder++,
          })
          .returning();
        unitCount++;

        let lessonOrder = 1;
        for (const l of u.lessons) {
          const [lesson] = await db
            .insert(schema.lessons)
            .values({ unitId: unit.id, title: l.title, order: lessonOrder++ })
            .returning();
          lessonCount++;

          let blockOrder = 1;
          for (const b of l.blocks) {
            const isQuestion = b.type === "SELECT" || b.type === "ASSIST";
            const [block] = await db
              .insert(schema.lessonBlocks)
              .values({
                lessonId: lesson.id,
                type: b.type,
                order: blockOrder++,
                body: b.type === "TEXT" ? b.body : null,
                imageSrc: b.type === "TEXT" ? b.imageSrc ?? null : null,
                caption: b.type === "TEXT" ? b.caption ?? null : null,
                imagePosition: b.type === "TEXT" ? b.imagePosition ?? null : null,
                question: isQuestion ? b.question : null,
              })
              .returning();
            blockCount++;

            if (isQuestion) {
              const rows = b.options.map((o) => ({
                blockId: block.id,
                text: o.text,
                correct: !!o.correct,
              }));
              await db.insert(schema.lessonBlockOptions).values(rows);
              optionCount += rows.length;
            }
          }
        }
      }
    }

    console.log(
      `Database seeded successfully! ` +
        `${courseCount} courses, ${unitCount} units, ${lessonCount} lessons, ` +
        `${blockCount} blocks, ${optionCount} options, ${BADGES.length} badges.`
    );
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed database");
  } finally {
    // postgres-js keeps the connection open; close it so the script exits.
    await client.end();
  }
};

void main();

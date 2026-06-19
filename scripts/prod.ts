import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const main = async () => {
  try {
    console.log("Seeding database...");

    // Delete all existing data
    await Promise.all([
      db.delete(schema.userProgress),
      db.delete(schema.challenges),
      db.delete(schema.units),
      db.delete(schema.lessons),
      db.delete(schema.courses),
      db.delete(schema.challengeOptions),
      db.delete(schema.userBadges),
      db.delete(schema.badges),
    ]);

    // Insert star cards (collectible stickers, awarded on lesson completion)
    await db.insert(schema.badges).values([
      {
        name: "Star Cadet",
        icon: "🌟",
        description: "Completed your very first lesson!",
      },
      {
        name: "Rocket Rider",
        icon: "🚀",
        description: "Blasted through another lesson.",
      },
      {
        name: "Moon Walker",
        icon: "🌙",
        description: "One small step for a big learner.",
      },
      {
        name: "Planet Hopper",
        icon: "🪐",
        description: "Explored a brand new world of knowledge.",
      },
      {
        name: "Comet Catcher",
        icon: "☄️",
        description: "Fast and bright — you caught a comet!",
      },
      {
        name: "Alien Friend",
        icon: "👽",
        description: "Made friends across the galaxy.",
      },
      {
        name: "UFO Pilot",
        icon: "🛸",
        description: "Soaring above the rest.",
      },
      {
        name: "Galaxy Master",
        icon: "🌌",
        description: "A true explorer of the whole galaxy.",
      },
    ]);

    // Insert courses
    const courses = await db
      .insert(schema.courses)
      .values([
        {
          title: "Khmer",
          imageSrc: "/kh.svg",
          category: "Language",
          difficulty: "Beginner",
          description: "Learn Khmer vocabulary, greetings and phrases.",
        },
        {
          title: "English",
          imageSrc: "/en.svg",
          category: "Language",
          difficulty: "Beginner",
          description: "Build English vocabulary and basic structures.",
        },
        {
          title: "Math",
          imageSrc: "/math.svg",
          category: "Math",
          difficulty: "Beginner",
          description: "Master addition, subtraction and more fun numbers!",
        },
      ])
      .returning();

    for (const course of courses) {
      if (course.title === "Khmer") {
        const units = await db
          .insert(schema.units)
          .values([
            {
              courseId: course.id,
              title: "Unit 1",
              description: "Learn the basics of Khmer vocabulary",
              order: 1,
            },
            {
              courseId: course.id,
              title: "Unit 2",
              description: "Learn Khmer greetings and phrases",
              order: 2,
            },
          ])
          .returning();

        for (const unit of units) {
          const lessons = await db
            .insert(schema.lessons)
            .values([
              { unitId: unit.id, title: "Nouns", order: 1 },
              { unitId: unit.id, title: "Verbs", order: 2 },
              { unitId: unit.id, title: "Adjectives", order: 3 },
            ])
            .returning();

          for (const lesson of lessons) {
            const challenges = await db
              .insert(schema.challenges)
              .values([
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the man"?',
                  order: 1,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the woman"?',
                  order: 2,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the boy"?',
                  order: 3,
                },
                {
                  lessonId: lesson.id,
                  type: "ASSIST",
                  question: '"the man"',
                  order: 4,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the zombie"?',
                  order: 5,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the robot"?',
                  order: 6,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the girl"?',
                  order: 7,
                },
                {
                  lessonId: lesson.id,
                  type: "ASSIST",
                  question: '"the zombie"',
                  order: 8,
                },
              ])
              .returning();

            for (const challenge of challenges) {
              if (challenge.order === 1) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "បុរស", imageSrc: "/man.svg" },
                  { challengeId: challenge.id, correct: false, text: "ស្រី", imageSrc: "/woman.svg" },
                  { challengeId: challenge.id, correct: false, text: "ក្មេងប្រុស", imageSrc: "/boy.svg" },
                ]);
              }
              if (challenge.order === 2) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "ស្រី", imageSrc: "/woman.svg" },
                  { challengeId: challenge.id, correct: false, text: "ក្មេងប្រុស", imageSrc: "/boy.svg" },
                  { challengeId: challenge.id, correct: false, text: "បុរស", imageSrc: "/man.svg" },
                ]);
              }
              if (challenge.order === 3) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "ស្រី", imageSrc: "/woman.svg" },
                  { challengeId: challenge.id, correct: false, text: "បុរស", imageSrc: "/man.svg" },
                  { challengeId: challenge.id, correct: true, text: "ក្មេងប្រុស", imageSrc: "/boy.svg" },
                ]);
              }
              if (challenge.order === 4) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "ស្រី" },
                  { challengeId: challenge.id, correct: true, text: "បុរស" },
                  { challengeId: challenge.id, correct: false, text: "ក្មេងប្រុស" },
                ]);
              }
              if (challenge.order === 5) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "បុរស", imageSrc: "/man.svg" },
                  { challengeId: challenge.id, correct: false, text: "ស្រី", imageSrc: "/woman.svg" },
                  { challengeId: challenge.id, correct: true, text: "ខ្មោចឆៅ", imageSrc: "/zombie.svg" },
                ]);
              }
              if (challenge.order === 6) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "រ៉ូបូត", imageSrc: "/robot.svg" },
                  { challengeId: challenge.id, correct: false, text: "ខ្មោចឆៅ", imageSrc: "/zombie.svg" },
                  { challengeId: challenge.id, correct: false, text: "ក្មេងប្រុស", imageSrc: "/boy.svg" },
                ]);
              }
              if (challenge.order === 7) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "ក្មេងស្រី", imageSrc: "/girl.svg" },
                  { challengeId: challenge.id, correct: false, text: "ខ្មោចឆៅ", imageSrc: "/zombie.svg" },
                  { challengeId: challenge.id, correct: false, text: "បុរស", imageSrc: "/man.svg" },
                ]);
              }
              if (challenge.order === 8) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "ស្រី" },
                  { challengeId: challenge.id, correct: true, text: "ខ្មោចឆៅ" },
                  { challengeId: challenge.id, correct: false, text: "ក្មេងប្រុស" },
                ]);
              }
            }
          }
        }
      }

      if (course.title === "English") {
        const units = await db
          .insert(schema.units)
          .values([
            {
              courseId: course.id,
              title: "Unit 1",
              description: "Learn the basics of English vocabulary",
              order: 1,
            },
            {
              courseId: course.id,
              title: "Unit 2",
              description: "Learn basic English structures",
              order: 2,
            },
          ])
          .returning();

        for (const unit of units) {
          const lessons = await db
            .insert(schema.lessons)
            .values([
              { unitId: unit.id, title: "Nouns", order: 1 },
              { unitId: unit.id, title: "Verbs", order: 2 },
              { unitId: unit.id, title: "Adjectives", order: 3 },
            ])
            .returning();

          for (const lesson of lessons) {
            const challenges = await db
              .insert(schema.challenges)
              .values([
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the man"?',
                  order: 1,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the woman"?',
                  order: 2,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the boy"?',
                  order: 3,
                },
                {
                  lessonId: lesson.id,
                  type: "ASSIST",
                  question: '"the man"',
                  order: 4,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the zombie"?',
                  order: 5,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the robot"?',
                  order: 6,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'Which one of these is "the girl"?',
                  order: 7,
                },
                {
                  lessonId: lesson.id,
                  type: "ASSIST",
                  question: '"the zombie"',
                  order: 8,
                },
              ])
              .returning();

            for (const challenge of challenges) {
              if (challenge.order === 1) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "man", imageSrc: "/man.svg" },
                  { challengeId: challenge.id, correct: false, text: "woman", imageSrc: "/woman.svg" },
                  { challengeId: challenge.id, correct: false, text: "boy", imageSrc: "/boy.svg" },
                ]);
              }
              if (challenge.order === 2) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "woman", imageSrc: "/woman.svg" },
                  { challengeId: challenge.id, correct: false, text: "boy", imageSrc: "/boy.svg" },
                  { challengeId: challenge.id, correct: false, text: "man", imageSrc: "/man.svg" },
                ]);
              }
              if (challenge.order === 3) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "woman", imageSrc: "/woman.svg" },
                  { challengeId: challenge.id, correct: false, text: "man", imageSrc: "/man.svg" },
                  { challengeId: challenge.id, correct: true, text: "boy", imageSrc: "/boy.svg" },
                ]);
              }
              if (challenge.order === 4) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "woman" },
                  { challengeId: challenge.id, correct: true, text: "man" },
                  { challengeId: challenge.id, correct: false, text: "boy" },
                ]);
              }
              if (challenge.order === 5) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "man", imageSrc: "/man.svg" },
                  { challengeId: challenge.id, correct: false, text: "woman", imageSrc: "/woman.svg" },
                  { challengeId: challenge.id, correct: true, text: "zombie", imageSrc: "/zombie.svg" },
                ]);
              }
              if (challenge.order === 6) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "robot", imageSrc: "/robot.svg" },
                  { challengeId: challenge.id, correct: false, text: "zombie", imageSrc: "/zombie.svg" },
                  { challengeId: challenge.id, correct: false, text: "boy", imageSrc: "/boy.svg" },
                ]);
              }
              if (challenge.order === 7) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "girl", imageSrc: "/girl.svg" },
                  { challengeId: challenge.id, correct: false, text: "zombie", imageSrc: "/zombie.svg" },
                  { challengeId: challenge.id, correct: false, text: "man", imageSrc: "/man.svg" },
                ]);
              }
              if (challenge.order === 8) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "woman" },
                  { challengeId: challenge.id, correct: true, text: "zombie" },
                  { challengeId: challenge.id, correct: false, text: "boy" },
                ]);
              }
            }
          }
        }
      }

      if (course.title === "Math") {
        const units = await db
          .insert(schema.units)
          .values([
            {
              courseId: course.id,
              title: "Unit 1",
              description: "Learn basic addition and subtraction",
              order: 1,
            },
            {
              courseId: course.id,
              title: "Unit 2",
              description: "Learn intermediate calculations",
              order: 2,
            },
          ])
          .returning();

        for (const unit of units) {
          const lessons = await db
            .insert(schema.lessons)
            .values([
              { unitId: unit.id, title: "Addition", order: 1 },
              { unitId: unit.id, title: "Subtraction", order: 2 },
              { unitId: unit.id, title: "Multiplication", order: 3 },
            ])
            .returning();

          for (const lesson of lessons) {
            const challenges = await db
              .insert(schema.challenges)
              .values([
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'What is "1 + 1"?',
                  order: 1,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'What is "2 + 3"?',
                  order: 2,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'What is "5 + 2"?',
                  order: 3,
                },
                {
                  lessonId: lesson.id,
                  type: "ASSIST",
                  question: 'What is "10 + 5"?',
                  order: 4,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'What is "3 + 3"?',
                  order: 5,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'What is "4 + 4"?',
                  order: 6,
                },
                {
                  lessonId: lesson.id,
                  type: "SELECT",
                  question: 'What is "6 + 6"?',
                  order: 7,
                },
                {
                  lessonId: lesson.id,
                  type: "ASSIST",
                  question: 'What is "8 + 8"?',
                  order: 8,
                },
              ])
              .returning();

            for (const challenge of challenges) {
              if (challenge.order === 1) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "2" },
                  { challengeId: challenge.id, correct: false, text: "3" },
                  { challengeId: challenge.id, correct: false, text: "4" },
                ]);
              }
              if (challenge.order === 2) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "5" },
                  { challengeId: challenge.id, correct: false, text: "4" },
                  { challengeId: challenge.id, correct: false, text: "6" },
                ]);
              }
              if (challenge.order === 3) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "6" },
                  { challengeId: challenge.id, correct: false, text: "8" },
                  { challengeId: challenge.id, correct: true, text: "7" },
                ]);
              }
              if (challenge.order === 4) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "12" },
                  { challengeId: challenge.id, correct: true, text: "15" },
                  { challengeId: challenge.id, correct: false, text: "14" },
                ]);
              }
              if (challenge.order === 5) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "5" },
                  { challengeId: challenge.id, correct: false, text: "7" },
                  { challengeId: challenge.id, correct: true, text: "6" },
                ]);
              }
              if (challenge.order === 6) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "8" },
                  { challengeId: challenge.id, correct: false, text: "9" },
                  { challengeId: challenge.id, correct: false, text: "10" },
                ]);
              }
              if (challenge.order === 7) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: true, text: "12" },
                  { challengeId: challenge.id, correct: false, text: "11" },
                  { challengeId: challenge.id, correct: false, text: "13" },
                ]);
              }
              if (challenge.order === 8) {
                await db.insert(schema.challengeOptions).values([
                  { challengeId: challenge.id, correct: false, text: "15" },
                  { challengeId: challenge.id, correct: true, text: "16" },
                  { challengeId: challenge.id, correct: false, text: "18" },
                ]);
              }
            }
          }
        }
      }
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed database");
  }
};

void main();

import { assist, select, seedCourse, text, type CourseContent } from "./_content";

import type { Seed } from "../seed";

// ---------------------------------------------------------------------------
// Math in English for grades 1–2 — the entry point below the Khmer grade 2–3
// course: counting, addition and subtraction within 20, place value, shapes,
// measurement, money and one-step story problems.
// See _content.ts for the block model and the additive/idempotent write.
// ---------------------------------------------------------------------------

const COURSE: CourseContent = {
  title: "Math (Grades 1–2)",
  imageSrc: "/math.svg",
  category: "Math",
  difficulty: "Beginner",
  description:
    "Multiple-choice math practice for grades 1 to 2 — counting to 100, adding and subtracting within 20, tens and ones, shapes, measuring, time, money and story problems.",
  units: [
    // ========================================= 1. Counting and Numbers
    {
      title: "Unit 1 · Counting and Numbers",
      description: "Count, order and skip count",
      lessons: [
        {
          title: "Counting to 20",
          blocks: [
            text(
              "We count one by one: 1, 2, 3, 4, 5 … 🔢\n\nEach number is one MORE than the number before it.\n\nExample: after 13 comes 14."
            ),
            select("How many stars are there?  ⭐⭐⭐⭐⭐⭐⭐", [
              { text: "6" },
              { text: "7", correct: true },
              { text: "8" },
              { text: "9" },
            ]),
            select("What number comes right after 13?", [
              { text: "12" },
              { text: "14", correct: true },
              { text: "15" },
              { text: "31" },
            ]),
            select("What number comes right before 20?", [
              { text: "18" },
              { text: "19", correct: true },
              { text: "21" },
              { text: "10" },
            ]),
            select("Which number is missing?  15, 16, ___, 18", [
              { text: "14" },
              { text: "17", correct: true },
              { text: "19" },
              { text: "20" },
            ]),
            assist("Keep counting: 9, 10, 11, ___", [
              { text: "8" },
              { text: "12", correct: true },
              { text: "13" },
              { text: "20" },
            ]),
          ],
        },
        {
          title: "Counting to 100",
          blocks: [
            text(
              "We can count in jumps. This is called skip counting.\n\nBy tens: 10, 20, 30, 40 …\nBy fives: 5, 10, 15, 20 …\nBy twos: 2, 4, 6, 8 …"
            ),
            select("Count by tens: 10, 20, 30, 40, ___", [
              { text: "41" },
              { text: "45" },
              { text: "50", correct: true },
              { text: "60" },
            ]),
            select("Count by fives: 5, 10, 15, 20, ___", [
              { text: "21" },
              { text: "25", correct: true },
              { text: "30" },
              { text: "35" },
            ]),
            select("Count by twos: 2, 4, 6, 8, ___", [
              { text: "9" },
              { text: "10", correct: true },
              { text: "11" },
              { text: "12" },
            ]),
            select("What number comes right after 49?", [
              { text: "40" },
              { text: "48" },
              { text: "50", correct: true },
              { text: "59" },
            ]),
            assist("Which number is the biggest?", [
              { text: "68" },
              { text: "78" },
              { text: "80" },
              { text: "87", correct: true },
            ]),
          ],
        },
      ],
    },

    // ==================================================== 2. Addition
    {
      title: "Unit 2 · Addition",
      description: "Putting numbers together, up to 20",
      lessons: [
        {
          title: "Adding to 10",
          blocks: [
            text(
              "Adding means putting two groups together to find how many in all. ➕\n\nExample: 3 + 2 = 5"
            ),
            select("4 + 3 = ?", [
              { text: "6" },
              { text: "7", correct: true },
              { text: "8" },
              { text: "9" },
            ]),
            select("Bopha has 5 marbles. Her friend gives her 2 more. How many marbles does she have now?", [
              { text: "3 marbles" },
              { text: "6 marbles" },
              { text: "7 marbles", correct: true },
              { text: "8 marbles" },
            ]),
            select("6 + 4 = ?", [
              { text: "8" },
              { text: "9" },
              { text: "10", correct: true },
              { text: "11" },
            ]),
            select("2 + 7 = ?", [
              { text: "5" },
              { text: "8" },
              { text: "9", correct: true },
              { text: "10" },
            ]),
            assist("5 + 5 = ?", [
              { text: "5" },
              { text: "9" },
              { text: "10", correct: true },
              { text: "11" },
            ]),
          ],
        },
        {
          title: "Adding to 20",
          blocks: [
            text(
              "When the numbers are bigger, first make ten.\n\nExample: 8 + 5 → 8 + 2 = 10, and 3 more = 13.\n\nDoubles are easy to remember: 7 + 7 = 14."
            ),
            select("8 + 5 = ?", [
              { text: "12" },
              { text: "13", correct: true },
              { text: "14" },
              { text: "15" },
            ]),
            select("9 + 6 = ?", [
              { text: "14" },
              { text: "15", correct: true },
              { text: "16" },
              { text: "17" },
            ]),
            select("There are 7 red flowers and 6 yellow flowers. How many flowers in all?", [
              { text: "11 flowers" },
              { text: "12 flowers" },
              { text: "13 flowers", correct: true },
              { text: "14 flowers" },
            ]),
            select("7 + 7 = ?", [
              { text: "12" },
              { text: "13" },
              { text: "14", correct: true },
              { text: "17" },
            ]),
            assist("12 + 6 = ?", [
              { text: "16" },
              { text: "17" },
              { text: "18", correct: true },
              { text: "19" },
            ]),
          ],
        },
      ],
    },

    // ================================================= 3. Subtraction
    {
      title: "Unit 3 · Subtraction",
      description: "Taking away and finding what is left",
      lessons: [
        {
          title: "Taking Away to 10",
          blocks: [
            text(
              "Subtracting means taking away to find how many are left. ➖\n\nExample: 7 − 3 = 4"
            ),
            select("9 − 4 = ?", [
              { text: "3" },
              { text: "4" },
              { text: "5", correct: true },
              { text: "6" },
            ]),
            select("There are 8 birds on a tree. 3 birds fly away. How many birds are left?", [
              { text: "4 birds" },
              { text: "5 birds", correct: true },
              { text: "6 birds" },
              { text: "11 birds" },
            ]),
            select("10 − 6 = ?", [
              { text: "2" },
              { text: "3" },
              { text: "4", correct: true },
              { text: "6" },
            ]),
            select("6 − 6 = ?", [
              { text: "0", correct: true },
              { text: "1" },
              { text: "6" },
              { text: "12" },
            ]),
            assist("7 − 2 = ?", [
              { text: "4" },
              { text: "5", correct: true },
              { text: "6" },
              { text: "9" },
            ]),
          ],
        },
        {
          title: "Subtracting to 20",
          blocks: [
            text(
              "For bigger numbers, take away to ten first.\n\nExample: 15 − 7 → 15 − 5 = 10, then take 2 more = 8."
            ),
            select("15 − 7 = ?", [
              { text: "7" },
              { text: "8", correct: true },
              { text: "9" },
              { text: "10" },
            ]),
            select("18 − 9 = ?", [
              { text: "7" },
              { text: "8" },
              { text: "9", correct: true },
              { text: "10" },
            ]),
            select("Sok has 20 stickers. He gives 5 stickers to his sister. How many does he have left?", [
              { text: "12 stickers" },
              { text: "14 stickers" },
              { text: "15 stickers", correct: true },
              { text: "25 stickers" },
            ]),
            select("14 − 6 = ?", [
              { text: "6" },
              { text: "7" },
              { text: "8", correct: true },
              { text: "9" },
            ]),
            assist("13 − 4 = ?", [
              { text: "7" },
              { text: "8" },
              { text: "9", correct: true },
              { text: "10" },
            ]),
          ],
        },
      ],
    },

    // ======================================= 4. Comparing and Place Value
    {
      title: "Unit 4 · Comparing and Place Value",
      description: "Bigger, smaller, tens and ones",
      lessons: [
        {
          title: "Bigger and Smaller",
          blocks: [
            text(
              "We compare numbers to see which is bigger.\n\n>  means 'is greater than'\n<  means 'is less than'\n\nExample: 8 > 5, and 5 < 8."
            ),
            select("Which sign is correct?   8 ___ 5", [
              { text: ">", correct: true },
              { text: "<" },
              { text: "=" },
              { text: "+" },
            ]),
            select("Which number is less: 34 or 43?", [
              { text: "34", correct: true },
              { text: "43" },
              { text: "They are the same" },
              { text: "77" },
            ]),
            select("Which number is the greatest?", [
              { text: "17" },
              { text: "27" },
              { text: "71" },
              { text: "72", correct: true },
            ]),
            select("Put these in order from smallest to biggest: 21, 12, 19", [
              { text: "12, 19, 21", correct: true },
              { text: "12, 21, 19" },
              { text: "19, 12, 21" },
              { text: "21, 19, 12" },
            ]),
            assist("Which is more: 9 or 11?", [
              { text: "9" },
              { text: "11", correct: true },
              { text: "They are the same" },
              { text: "20" },
            ]),
          ],
        },
        {
          title: "Tens and Ones",
          blocks: [
            text(
              "Every two-digit number is made of tens and ones.\n\nExample: 34 = 3 tens + 4 ones = 30 + 4."
            ),
            select("How many tens are in the number 46?", [
              { text: "4", correct: true },
              { text: "6" },
              { text: "10" },
              { text: "46" },
            ]),
            select("5 tens and 2 ones make which number?", [
              { text: "25" },
              { text: "52", correct: true },
              { text: "57" },
              { text: "70" },
            ]),
            select("In the number 78, the digit 8 is in which place?", [
              { text: "The ones place", correct: true },
              { text: "The tens place" },
              { text: "The hundreds place" },
              { text: "No place" },
            ]),
            select("20 + 7 = ?", [
              { text: "17" },
              { text: "27", correct: true },
              { text: "70" },
              { text: "72" },
            ]),
            assist("Which number has 6 tens and 0 ones?", [
              { text: "6" },
              { text: "16" },
              { text: "60", correct: true },
              { text: "66" },
            ]),
          ],
        },
      ],
    },

    // ====================================== 5. Shapes and Measuring
    {
      title: "Unit 5 · Shapes and Measuring",
      description: "Shapes, size, and telling the time",
      lessons: [
        {
          title: "Shapes",
          blocks: [
            text(
              "Shapes have sides and corners. 🔺\n\nA triangle has 3 sides.\nA square has 4 equal sides.\nA circle is round and has no corners."
            ),
            select("How many sides does a triangle have?", [
              { text: "2" },
              { text: "3", correct: true },
              { text: "4" },
              { text: "5" },
            ]),
            select("How many sides does a square have?", [
              { text: "3" },
              { text: "4", correct: true },
              { text: "5" },
              { text: "6" },
            ]),
            select("Which shape is round and has no corners?", [
              { text: "A square" },
              { text: "A triangle" },
              { text: "A circle", correct: true },
              { text: "A rectangle" },
            ]),
            select("Which shape has 4 sides — two long and two short?", [
              { text: "A circle" },
              { text: "A triangle" },
              { text: "A rectangle", correct: true },
              { text: "A star" },
            ]),
            assist("How many corners does a square have?", [
              { text: "2" },
              { text: "3" },
              { text: "4", correct: true },
              { text: "8" },
            ]),
          ],
        },
        {
          title: "Measuring and Time",
          blocks: [
            text(
              "Remember:\n1 hour = 60 minutes\n1 week = 7 days\n\nWe can also compare size: longer or shorter, heavier or lighter."
            ),
            select("Which one is longer?", [
              { text: "A pencil" },
              { text: "A bus", correct: true },
              { text: "A spoon" },
              { text: "A key" },
            ]),
            select("How many days are there in one week?", [
              { text: "5 days" },
              { text: "6 days" },
              { text: "7 days", correct: true },
              { text: "10 days" },
            ]),
            select("The clock shows 3 o'clock. What time will it be one hour later?", [
              { text: "2 o'clock" },
              { text: "4 o'clock", correct: true },
              { text: "5 o'clock" },
              { text: "6 o'clock" },
            ]),
            select("How many minutes are there in one hour?", [
              { text: "10 minutes" },
              { text: "30 minutes" },
              { text: "60 minutes", correct: true },
              { text: "100 minutes" },
            ]),
            assist("Which one is heavier?", [
              { text: "A cat" },
              { text: "An elephant", correct: true },
              { text: "A feather" },
              { text: "A leaf" },
            ]),
          ],
        },
      ],
    },

    // =================================== 6. Money and Story Problems
    {
      title: "Unit 6 · Money and Story Problems",
      description: "Riel, and problems told as short stories",
      lessons: [
        {
          title: "Money",
          blocks: [
            text(
              "We use riel to buy things. 💵\n\nTo find what is left, we subtract.\nTo find the total cost, we add.\n\nExample: 1000 riel − 500 riel = 500 riel left."
            ),
            select("Dara has 1000 riel. He buys a candy for 500 riel. How much money is left?", [
              { text: "300 riel" },
              { text: "500 riel", correct: true },
              { text: "800 riel" },
              { text: "1500 riel" },
            ]),
            select("2000 riel + 1000 riel = ?", [
              { text: "1000 riel" },
              { text: "2000 riel" },
              { text: "3000 riel", correct: true },
              { text: "4000 riel" },
            ]),
            select("A pen costs 800 riel and an eraser costs 200 riel. How much do they cost together?", [
              { text: "600 riel" },
              { text: "1000 riel", correct: true },
              { text: "1200 riel" },
              { text: "1800 riel" },
            ]),
            select("Which is more money?", [
              { text: "500 riel" },
              { text: "1000 riel", correct: true },
              { text: "They are the same" },
              { text: "100 riel" },
            ]),
            assist("5000 riel − 2000 riel = ?", [
              { text: "2000 riel" },
              { text: "3000 riel", correct: true },
              { text: "5000 riel" },
              { text: "7000 riel" },
            ]),
          ],
        },
        {
          title: "Story Problems",
          blocks: [
            text(
              "Read the story. Ask yourself: are we putting things together (add), or taking them away (subtract)? ⭐\n\nSome stories have two steps. Do the first step, then use that answer for the second."
            ),
            select("Malis picks 6 apples. Then she picks 5 more. How many apples does she have in all?", [
              { text: "1 apple" },
              { text: "10 apples" },
              { text: "11 apples", correct: true },
              { text: "12 apples" },
            ]),
            select("There are 12 students in the class. 4 students go home. How many students are still there?", [
              { text: "6 students" },
              { text: "8 students", correct: true },
              { text: "9 students" },
              { text: "16 students" },
            ]),
            select("There are 3 baskets. Each basket has 2 mangoes. How many mangoes are there altogether?", [
              { text: "5 mangoes" },
              { text: "6 mangoes", correct: true },
              { text: "8 mangoes" },
              { text: "9 mangoes" },
            ]),
            select("Rita has 10 candies. She buys 5 more, then eats 3. How many candies does she have now?", [
              { text: "8 candies" },
              { text: "12 candies", correct: true },
              { text: "15 candies" },
              { text: "18 candies" },
            ]),
            assist("Sok has 9 stickers. He gives 4 stickers to his friend. How many are left?", [
              { text: "4 stickers" },
              { text: "5 stickers", correct: true },
              { text: "6 stickers" },
              { text: "13 stickers" },
            ]),
          ],
        },
      ],
    },
  ],
};

const seed: Seed = {
  description: "Math in English, grades 1–2 (60 questions)",
  run: (db) => seedCourse(db, COURSE),
};

export default seed;

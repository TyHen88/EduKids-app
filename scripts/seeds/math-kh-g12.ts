import { assist, select, seedCourse, text, type CourseContent } from "./_content";

import type { Seed } from "../seed";

// ---------------------------------------------------------------------------
// Khmer math for grades 1–2 (គណិតវិទ្យា ថ្នាក់ទី១–២) — the entry tier below the
// grade 2–3 course: counting to 20, comparing, addition and subtraction within
// 20, shapes, patterns and one-step story problems. Numbers stay small on
// purpose; every option is a number a child of this age can actually count to.
// See _content.ts for the block model and the additive/idempotent write.
// ---------------------------------------------------------------------------

const COURSE: CourseContent = {
  title: "គណិតវិទ្យា (ថ្នាក់ទី១–២)",
  imageSrc: "/math.svg",
  category: "Math",
  difficulty: "Beginner",
  description:
    "លំហាត់គណិតវិទ្យាជ្រើសរើសចម្លើយ សម្រាប់ថ្នាក់ទី ១ ដល់ថ្នាក់ទី ២ — រាប់លេខ ប្រៀបធៀប បូក ដក រូបរាង លំនាំ និងលំហាត់រឿងងាយៗ។",
  units: [
    // ================================================ ១. លេខ និងការរាប់
    {
      title: "មេរៀនទី ១ · លេខ និងការរាប់",
      description: "រាប់លេខពី ១ ដល់ ២០",
      lessons: [
        {
          title: "រាប់ពី ១ ដល់ ១០",
          blocks: [
            text(
              "តោះរាប់ជាមួយគ្នា! 🖐️\n\n១ ២ ៣ ៤ ៥ ៦ ៧ ៨ ៩ ១០\n\nលើកម្រាមដៃឡើង រួចរាប់តាមខ្ញុំ។"
            ),
            select("តើមានផ្កាប៉ុន្មានទង?  🌸🌸🌸", [
              { text: "២" },
              { text: "៣", correct: true },
              { text: "៤" },
              { text: "៥" },
            ]),
            select("តើមានផ្លែប៉ោមប៉ុន្មានផ្លែ?  🍎🍎🍎🍎🍎", [
              { text: "៣" },
              { text: "៤" },
              { text: "៥", correct: true },
              { text: "៦" },
            ]),
            select("តើលេខណាមកបន្ទាប់ពី ៦?", [
              { text: "៥" },
              { text: "៦" },
              { text: "៧", correct: true },
              { text: "៨" },
            ]),
            select("ដៃពីរខាង មានម្រាមដៃសរុបប៉ុន្មាន?", [
              { text: "៥" },
              { text: "៨" },
              { text: "១០", correct: true },
              { text: "២០" },
            ]),
            assist("រាប់ចំណុច៖  • • • •", [
              { text: "៣" },
              { text: "៤", correct: true },
              { text: "៥" },
              { text: "៦" },
            ]),
          ],
        },
        {
          title: "លេខ ១១ ដល់ ២០",
          blocks: [
            text("បន្ទាប់ពី ១០ គឺ៖\n\n១១ ១២ ១៣ ១៤ ១៥ ១៦ ១៧ ១៨ ១៩ ២០"),
            select("តើលេខណាមកបន្ទាប់ពី ១២?", [
              { text: "១១" },
              { text: "១៣", correct: true },
              { text: "១៤" },
              { text: "២០" },
            ]),
            select("តើលេខណានៅមុន ១៥?", [
              { text: "១៣" },
              { text: "១៤", correct: true },
              { text: "១៦" },
              { text: "១៧" },
            ]),
            select("តើលេខ 18 ស្មើនឹងលេខខ្មែរអ្វី?", [
              { text: "១៦" },
              { text: "១៧" },
              { text: "១៨", correct: true },
              { text: "១៩" },
            ]),
            select("តើលេខណាធំជាងគេ?", [
              { text: "១១" },
              { text: "១២" },
              { text: "១៥" },
              { text: "១៨", correct: true },
            ]),
            assist("តើលេខរវាង ១៨ និង ២០ គឺជាលេខអ្វី?", [
              { text: "១៧" },
              { text: "១៨" },
              { text: "១៩", correct: true },
              { text: "២០" },
            ]),
          ],
        },
      ],
    },

    // ================================================== ២. ប្រៀបធៀបលេខ
    {
      title: "មេរៀនទី ២ · ប្រៀបធៀបលេខ",
      description: "ធំជាង តូចជាង លេខមុន និងលេខបន្ទាប់",
      lessons: [
        {
          title: "ធំជាង និងតូចជាង",
          blocks: [
            text(
              "សញ្ញា > មានន័យថា ធំជាង។\nសញ្ញា < មានន័យថា តូចជាង។\n\nឧទាហរណ៍៖ ៨ > ៥ និង ៣ < ៧"
            ),
            select("តើលេខណាធំជាង៖ ៧ ឬ ៩?", [
              { text: "៧" },
              { text: "៩", correct: true },
              { text: "ស្មើគ្នា" },
              { text: "មិនដឹង" },
            ]),
            select("តើលេខណាតូចជាង៖ ៤ ឬ ២?", [
              { text: "២", correct: true },
              { text: "៤" },
              { text: "ស្មើគ្នា" },
              { text: "មិនដឹង" },
            ]),
            select("ក្រុមទីមួយមានស្ករ ៣ គ្រាប់ ក្រុមទីពីរមានស្ករ ៥ គ្រាប់។ តើក្រុមណាមានច្រើនជាង?", [
              { text: "ក្រុមទីមួយ" },
              { text: "ក្រុមទីពីរ", correct: true },
              { text: "ស្មើគ្នា" },
              { text: "មិនដឹង" },
            ]),
            select("បំពេញសញ្ញាត្រឹមត្រូវ៖  ៦ ⬜ ១០", [
              { text: ">" },
              { text: "<", correct: true },
              { text: "=" },
              { text: "+" },
            ]),
            assist("តើលេខណាធំជាងគេ?", [
              { text: "៦" },
              { text: "៩" },
              { text: "១១" },
              { text: "១៤", correct: true },
            ]),
          ],
        },
        {
          title: "លេខមុន និងលេខបន្ទាប់",
          blocks: [
            text(
              "លេខមុន គឺតូចជាង ១។\nលេខបន្ទាប់ គឺធំជាង ១។\n\nឧទាហរណ៍៖ មុន ៨ គឺ ៧ និងបន្ទាប់ ៨ គឺ ៩។"
            ),
            select("តើលេខមុន ៥ គឺជាលេខអ្វី?", [
              { text: "៣" },
              { text: "៤", correct: true },
              { text: "៦" },
              { text: "៧" },
            ]),
            select("តើលេខបន្ទាប់ ៩ គឺជាលេខអ្វី?", [
              { text: "៨" },
              { text: "១០", correct: true },
              { text: "១១" },
              { text: "១២" },
            ]),
            select("រៀបលេខពីតូចទៅធំ៖  ៧, ២, ៥", [
              { text: "២, ៥, ៧", correct: true },
              { text: "២, ៧, ៥" },
              { text: "៥, ២, ៧" },
              { text: "៧, ៥, ២" },
            ]),
            select("តើលេខណាបាត់?  ១, ២, ⬜, ៤, ៥", [
              { text: "២" },
              { text: "៣", correct: true },
              { text: "៤" },
              { text: "៦" },
            ]),
            assist("តើលេខមុន ២០ គឺជាលេខអ្វី?", [
              { text: "១០" },
              { text: "១៨" },
              { text: "១៩", correct: true },
              { text: "២១" },
            ]),
          ],
        },
      ],
    },

    // ========================================================= ៣. ការបូក
    {
      title: "មេរៀនទី ៣ · ការបូក",
      description: "បូកលេខក្នុង ១០ និងក្នុង ២០",
      lessons: [
        {
          title: "បូកលេខក្នុង ១០",
          blocks: [
            text("ការបូក គឺជាការបញ្ចូលគ្នា។ ➕\n\nឧទាហរណ៍៖ ៣ + ២ = ៥"),
            select("២ + ៣ = ?", [
              { text: "៤" },
              { text: "៥", correct: true },
              { text: "៦" },
              { text: "៧" },
            ]),
            select("៤ + ៤ = ?", [
              { text: "៦" },
              { text: "៧" },
              { text: "៨", correct: true },
              { text: "៩" },
            ]),
            select("មានឆ្មា ៣ ក្បាល រួចមានឆ្មាមកបន្ថែម ២ ក្បាលទៀត។ តើមានឆ្មាប៉ុន្មានក្បាល?", [
              { text: "៤ ក្បាល" },
              { text: "៥ ក្បាល", correct: true },
              { text: "៦ ក្បាល" },
              { text: "៧ ក្បាល" },
            ]),
            select("៦ + ៣ = ?", [
              { text: "៧" },
              { text: "៨" },
              { text: "៩", correct: true },
              { text: "១០" },
            ]),
            assist("៥ + ៥ = ?", [
              { text: "៨" },
              { text: "៩" },
              { text: "១០", correct: true },
              { text: "១១" },
            ]),
          ],
        },
        {
          title: "បូកលេខក្នុង ២០",
          blocks: [
            text("តោះបូកលេខធំជាងបន្តិច។\n\nឧទាហរណ៍៖ ១០ + ៥ = ១៥"),
            select("១០ + ៥ = ?", [
              { text: "១៣" },
              { text: "១៤" },
              { text: "១៥", correct: true },
              { text: "១៦" },
            ]),
            select("៨ + ៦ = ?", [
              { text: "១២" },
              { text: "១៣" },
              { text: "១៤", correct: true },
              { text: "១៥" },
            ]),
            select("៩ + ៩ = ?", [
              { text: "១៦" },
              { text: "១៧" },
              { text: "១៨", correct: true },
              { text: "១៩" },
            ]),
            select("សុខ មានប៉េងប៉ោង ៧ គ្រាប់។ ម្ដាយឱ្យបន្ថែម ៦ គ្រាប់ទៀត។ តើគាត់មានប៉ុន្មានគ្រាប់?", [
              { text: "១២ គ្រាប់" },
              { text: "១៣ គ្រាប់", correct: true },
              { text: "១៤ គ្រាប់" },
              { text: "១៥ គ្រាប់" },
            ]),
            assist("១២ + ៧ = ?", [
              { text: "១៧" },
              { text: "១៨" },
              { text: "១៩", correct: true },
              { text: "២០" },
            ]),
          ],
        },
      ],
    },

    // ========================================================== ៤. ការដក
    {
      title: "មេរៀនទី ៤ · ការដក",
      description: "ដកលេខក្នុង ១០ និងក្នុង ២០",
      lessons: [
        {
          title: "ដកលេខក្នុង ១០",
          blocks: [
            text("ការដក គឺជាការយកចេញ។ ➖\n\nឧទាហរណ៍៖ ៥ − ២ = ៣"),
            select("៥ − ២ = ?", [
              { text: "២" },
              { text: "៣", correct: true },
              { text: "៤" },
              { text: "៥" },
            ]),
            select("៧ − ៣ = ?", [
              { text: "៣" },
              { text: "៤", correct: true },
              { text: "៥" },
              { text: "៦" },
            ]),
            select("មានចេក ៦ ផ្លែ។ ចច ញ៉ាំអស់ ២ ផ្លែ។ តើនៅសល់ចេកប៉ុន្មានផ្លែ?", [
              { text: "៣ ផ្លែ" },
              { text: "៤ ផ្លែ", correct: true },
              { text: "៥ ផ្លែ" },
              { text: "៦ ផ្លែ" },
            ]),
            select("១០ − ៤ = ?", [
              { text: "៥" },
              { text: "៦", correct: true },
              { text: "៧" },
              { text: "៨" },
            ]),
            assist("៨ − ៨ = ?", [
              { text: "០", correct: true },
              { text: "១" },
              { text: "៨" },
              { text: "១៦" },
            ]),
          ],
        },
        {
          title: "ដកលេខក្នុង ២០",
          blocks: [
            text("តោះដកលេខធំជាងបន្តិច។\n\nឧទាហរណ៍៖ ១៥ − ៥ = ១០"),
            select("១៥ − ៥ = ?", [
              { text: "៥" },
              { text: "៩" },
              { text: "១០", correct: true },
              { text: "១១" },
            ]),
            select("១៨ − ៦ = ?", [
              { text: "១១" },
              { text: "១២", correct: true },
              { text: "១៣" },
              { text: "១៤" },
            ]),
            select("២០ − ១០ = ?", [
              { text: "៨" },
              { text: "១០", correct: true },
              { text: "១២" },
              { text: "២០" },
            ]),
            select("ដារ៉ា មានឃ្លី ១៤ គ្រាប់។ គាត់ធ្វើជ្រុះបាត់ ៣ គ្រាប់។ តើនៅសល់ប៉ុន្មានគ្រាប់?", [
              { text: "១០ គ្រាប់" },
              { text: "១១ គ្រាប់", correct: true },
              { text: "១២ គ្រាប់" },
              { text: "១៣ គ្រាប់" },
            ]),
            assist("១៦ − ៧ = ?", [
              { text: "៨" },
              { text: "៩", correct: true },
              { text: "១០" },
              { text: "១១" },
            ]),
          ],
        },
      ],
    },

    // ================================================ ៥. រូបរាង និងលំនាំ
    {
      title: "មេរៀនទី ៥ · រូបរាង និងលំនាំ",
      description: "ស្គាល់រូបរាង និងរកលេខបន្ទាប់",
      lessons: [
        {
          title: "រូបរាង",
          blocks: [
            text(
              "រូបរាងសំខាន់ៗ៖\n\n⭕ រង្វង់ — គ្មានជ្រុង\n🔺 ត្រីកោណ — មានជ្រុង ៣\n⬜ ការេ — មានជ្រុង ៤ ស្មើគ្នា\n▭ ចតុកោណកែង — មានជ្រុង ៤"
            ),
            select("តើរូបណាមានជ្រុង ៣?", [
              { text: "ត្រីកោណ", correct: true },
              { text: "ការេ" },
              { text: "រង្វង់" },
              { text: "ចតុកោណកែង" },
            ]),
            select("តើរូបណាមានជ្រុង ៤ ស្មើៗគ្នា?", [
              { text: "ការេ", correct: true },
              { text: "ត្រីកោណ" },
              { text: "រង្វង់" },
              { text: "ចតុកោណកែង" },
            ]),
            select("តើរូបណាគ្មានជ្រុងទាល់តែសោះ?", [
              { text: "រង្វង់", correct: true },
              { text: "ការេ" },
              { text: "ត្រីកោណ" },
              { text: "ចតុកោណកែង" },
            ]),
            select("ទ្វារបន្ទប់ ភាគច្រើនមានរូបរាងដូចអ្វី?", [
              { text: "រង្វង់" },
              { text: "ត្រីកោណ" },
              { text: "ចតុកោណកែង", correct: true },
              { text: "ការេ" },
            ]),
            assist("តើត្រីកោណមានជ្រុងប៉ុន្មាន?", [
              { text: "២" },
              { text: "៣", correct: true },
              { text: "៤" },
              { text: "៥" },
            ]),
          ],
        },
        {
          title: "លំនាំ",
          blocks: [
            text(
              "លំនាំ គឺជារបស់ដែលរៀបតាមលំដាប់ដដែលៗ។\n\nឧទាហរណ៍៖  🔴 🔵 🔴 🔵 🔴 …\n\nសូមរកមើលថាតើអ្វីមកបន្ទាប់។"
            ),
            select("តើអ្វីមកបន្ទាប់?  🔴 🔵 🔴 🔵 ⬜", [
              { text: "🔴", correct: true },
              { text: "🔵" },
              { text: "🟢" },
              { text: "🟡" },
            ]),
            select("តើលេខបន្ទាប់គឺជាលេខអ្វី?  (២, ៤, ៦, ៨, ... ?)", [
              { text: "៩" },
              { text: "១០", correct: true },
              { text: "១១" },
              { text: "១២" },
            ]),
            select("តើលេខបន្ទាប់គឺជាលេខអ្វី?  (១, ២, ៣, ៤, ... ?)", [
              { text: "៤" },
              { text: "៥", correct: true },
              { text: "៦" },
              { text: "៧" },
            ]),
            select("តើលេខបន្ទាប់គឺជាលេខអ្វី?  (៥, ១០, ១៥, ... ?)", [
              { text: "១៦" },
              { text: "១៨" },
              { text: "២០", correct: true },
              { text: "២៥" },
            ]),
            assist("តើលេខបន្ទាប់គឺជាលេខអ្វី?  (១០, ៩, ៨, ៧, ... ?)", [
              { text: "៥" },
              { text: "៦", correct: true },
              { text: "៧" },
              { text: "៨" },
            ]),
          ],
        },
      ],
    },

    // ============================================== ៦. លំហាត់រឿងងាយៗ
    {
      title: "មេរៀនទី ៦ · លំហាត់រឿងងាយៗ",
      description: "លំហាត់រឿង ថ្ងៃ ម៉ោង និងលុយ",
      lessons: [
        {
          title: "លំហាត់រឿងបូក និងដក",
          blocks: [
            text(
              "អានរឿងឱ្យបានច្បាស់ រួចសម្រេចថាត្រូវ បូក ឬ ដក។\n\nបានបន្ថែម → បូក ➕\nយកចេញ ឬបាត់ → ដក ➖"
            ),
            select("មីនា មានតុក្កតា ៤។ ម្ដាយទិញឱ្យបន្ថែម ៣ ទៀត។ តើនាងមានតុក្កតាប៉ុន្មាន?", [
              { text: "៦" },
              { text: "៧", correct: true },
              { text: "៨" },
              { text: "៩" },
            ]),
            select("ក្នុងថង់មានស្ករ ១០ គ្រាប់។ សុខ ចែកឱ្យមិត្ត ៤ គ្រាប់។ តើនៅសល់ប៉ុន្មានគ្រាប់?", [
              { text: "៥ គ្រាប់" },
              { text: "៦ គ្រាប់", correct: true },
              { text: "៧ គ្រាប់" },
              { text: "១៤ គ្រាប់" },
            ]),
            select("មានចាបលើមែកឈើ ៨ ក្បាល។ ចាប ៣ ក្បាលហើរចេញ។ តើនៅសល់ប៉ុន្មានក្បាល?", [
              { text: "៤ ក្បាល" },
              { text: "៥ ក្បាល", correct: true },
              { text: "៦ ក្បាល" },
              { text: "១១ ក្បាល" },
            ]),
            select("ប៉ាទិញផ្លែក្រូច ៦ ផ្លែ និងផ្លែប៉ោម ៥ ផ្លែ។ តើមានផ្លែឈើសរុបប៉ុន្មានផ្លែ?", [
              { text: "១០ ផ្លែ" },
              { text: "១១ ផ្លែ", correct: true },
              { text: "១២ ផ្លែ" },
              { text: "១ ផ្លែ" },
            ]),
            assist("ក្នុងថ្នាក់មានក្មេងប្រុស ៩ នាក់ និងក្មេងស្រី ៨ នាក់។ តើមានសិស្សសរុបប៉ុន្មាននាក់?", [
              { text: "១៦ នាក់" },
              { text: "១៧ នាក់", correct: true },
              { text: "១៨ នាក់" },
              { text: "១៩ នាក់" },
            ]),
          ],
        },
        {
          title: "ថ្ងៃ ម៉ោង និងលុយ",
          blocks: [
            text("សូមចាំ៖\n១ សប្ដាហ៍ = ៧ ថ្ងៃ\n១ ម៉ោង = ៦០ នាទី\n១ ឆ្នាំ = ១២ ខែ"),
            select("តើ ១ សប្ដាហ៍ មានប៉ុន្មានថ្ងៃ?", [
              { text: "៥ ថ្ងៃ" },
              { text: "៦ ថ្ងៃ" },
              { text: "៧ ថ្ងៃ", correct: true },
              { text: "១០ ថ្ងៃ" },
            ]),
            select("តើថ្ងៃបន្ទាប់ពី ថ្ងៃច័ន្ទ គឺជាថ្ងៃអ្វី?", [
              { text: "ថ្ងៃអាទិត្យ" },
              { text: "ថ្ងៃអង្គារ", correct: true },
              { text: "ថ្ងៃពុធ" },
              { text: "ថ្ងៃសុក្រ" },
            ]),
            select("ខ្មៅដៃ ១ ដើម ថ្លៃ ១០០០ រៀល។ តើខ្មៅដៃ ២ ដើម ថ្លៃប៉ុន្មានរៀល?", [
              { text: "១០០០ រៀល" },
              { text: "១៥០០ រៀល" },
              { text: "២០០០ រៀល", correct: true },
              { text: "៣០០០ រៀល" },
            ]),
            select("តើ ១ ម៉ោង មានប៉ុន្មាននាទី?", [
              { text: "៣០ នាទី" },
              { text: "៤៥ នាទី" },
              { text: "៦០ នាទី", correct: true },
              { text: "១០០ នាទី" },
            ]),
            assist("តើ ១ ឆ្នាំ មានប៉ុន្មានខែ?", [
              { text: "១០ ខែ" },
              { text: "១១ ខែ" },
              { text: "១២ ខែ", correct: true },
              { text: "៣០ ខែ" },
            ]),
          ],
        },
      ],
    },
  ],
};

const seed: Seed = {
  description: "Khmer math, grades 1–2 (60 questions)",
  run: (db) => seedCourse(db, COURSE),
};

export default seed;

import json

file_path = "/Users/henty/Documents/Coding/EduKids-app/app/[lang]/dictionaries/kh.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Dictionary of updates for more natural phrasing
updates = {
    "notFound.message": "អូ! យើងរកមិនឃើញទំព័រនេះទេ។ វាប្រហែលជាត្រូវគេលុបចោល ឬលែងមានហើយ។",
    "marketing.title": "រៀន អនុវត្ត និងពូកែភាសាថ្មីជាមួយ EduKids។",
    "shop.subtitle": "ប្រើពិន្ទុរបស់អ្នកដើម្បីទិញរបស់ឡូយៗ។",
    "shop.refillHearts": "បញ្ចូលបេះដូង",
    "leaderboard.subtitle": "មើលចំណាត់ថ្នាក់របស់អ្នកធៀបជាមួយសិស្សផ្សេងទៀត។",
    "quests.subtitle": "បំពេញបេសកកម្មដើម្បីទទួលបានពិន្ទុ។",
    "quests.earnXP": "ទទួលបាន {value} XP",
    "promo.getUnlimitedHearts": "លេងបេះដូងគ្មានដែនកំណត់ និងរបស់ពិសេសៗច្រើនទៀត!",
    "heartsModal.description": "ដំឡើងទៅ Pro ដើម្បីលេងបេះដូងគ្មានដែនកំណត់ ឬប្រើពិន្ទុទិញនៅហាង។",
    "heartsModal.getUnlimited": "បេះដូងគ្មានដែនកំណត់",
    "heartsModal.refill": "បញ្ចូលបេះដូង",
    "practiceModal.description": "លេងមេរៀនអនុវត្តដើម្បីបានបេះដូង និងពិន្ទុមកវិញ។ នៅទីនេះអ្នកនឹងមិនអស់បេះដូង ឬបាត់ពិន្ទុនោះទេ។",
    "exitModal.description": "តើអ្នកពិតជាចង់ចាកចេញពីមេរៀននេះមែនទេ?",
    "lesson.completedLesson": "អ្នករៀនចប់មេរៀននេះហើយ។",
    "auth.signInTitle": "សូមស្វាគមន៍ការត្រឡប់មកវិញ! 🚀",
    "auth.signInSubtitle": "ចូលគណនីដើម្បីបន្តដំណើរផ្សងព្រេង!",
    "auth.atLeast8Characters": "យ៉ាងតិច ៨ តួ",
    "auth.clickLinkToConfirm": "សូមឆែកអ៊ីមែល ហើយចុចតំណភ្ជាប់ដើម្បីបញ្ជាក់គណនីរបស់អ្នក។ រួចហើយត្រឡប់មកទីនេះវិញដើម្បីចូលរៀន! 🚀",
    "auth.linkResent": "យើងបានផ្ញើម្ដងទៀតហើយ — សូមឆែកមើលអ៊ីមែលរបស់អ្នក។",
    "auth.clickLinkToReset": "សូមឆែកអ៊ីមែល ហើយចុចតំណភ្ជាប់ — វានឹងនាំអ្នកត្រឡប់មកទីនេះ ដើម្បីកំណត់ពាក្យសម្ងាត់ថ្មី។ 🔑",
    "auth.setInvitePassword": "អ្នកត្រូវបានអញ្ជើញឱ្យចូលរួមក្នុងកម្មវិធី EduKids។ សូមកំណត់ពាក្យសម្ងាត់របស់អ្នកដើម្បីចូលរួម!",
    "auth.couldntSignInWithGoogle": "មិនអាចចូលតាម Google ទេ។ សូមព្យាយាមម្ដងទៀត។",
    "auth.kidsLogin": "ចូលគណនីសម្រាប់កុមារ",
    "auth.pinMustBe4Digits": "អូ! លេខសម្ងាត់ត្រូវតែមាន ៤ ខ្ទង់ 🔢",
    "auth.invalidUsernameOrPin": "អូ! ឈ្មោះ ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ។ សាកម្ដងទៀតទៅមើល! 🙈",
    "auth.loginSuccess": "យេ! ស្វាគមន៍ការត្រឡប់មកវិញ! 🎉",
    "onboarding.welcomeSubtitle": "ប្រាប់យើងថាអ្នកជានរណា ដើម្បីពួកយើងរៀបចំព័ត៌មានឱ្យត្រូវនឹងអ្នក។",
    "onboarding.parentDescription": "ខ្ញុំចង់បង្កើតគណនីឱ្យកូនៗ ដាក់មេរៀន និងតាមដានការសិក្សារបស់ពួកគេ។",
    "learn.rankRunnerUp": "ចំណាត់ថ្នាក់លេខ២",
    "learn.rankBronzeStar": "ចំណាត់ថ្នាក់លេខ៣",
    "learn.goodAfternoon": "សួស្តីពេលរសៀល",
    "learn.goodEvening": "សួស្តីពេលល្ងាច",
    "learn.chestAlreadyOpened": "បានបើករួចហើយ — ចាំស្អែកមកទៀតណា!",
    "learn.tapToOpen": "ចុចដើម្បីបើក!",
    "path.travelStars": "ធ្វើដំណើរឆ្លងកាត់ផ្កាយក្នុងវគ្គ {course}!",
    "courses.subtitle": "សៀវភៅ និងការផ្សងព្រេងដែលអ្នករកបាន!",
    "achievements.subtitle": "រៀនចប់មេរៀនដើម្បីប្រមូលកាតផ្កាយនៅក្នុងកាឡាក់ស៊ី!",
    "myFamily.noFamilyHint": "ប្រាប់ប៉ាម៉ាក់ឱ្យភ្ជាប់គណនីរបស់អ្នកទៅកាន់គណនីពួកគាត់ទៅ។",
    "parent.bannerSubtitle": "តាមដាន និងគ្រប់គ្រងការសិក្សារបស់កូនៗអ្នក។",
    "parent.leadingWith": "កំពុងនាំមុខគេដោយមាន",
    "parent.createProfilePrompt": "បង្កើតគណនីឱ្យកូនៗ ដើម្បីឱ្យពួកគេអាចចាប់ផ្ដើមរៀន និងលេង!",
    "parent.failedToCreate": "បង្កើតគណនីមិនបានទេ។ ឈ្មោះនេះប្រហែលជាមានគេប្រើរួចហើយ។",
    "parent.confirmRemoveChild": "តើអ្នកពិតជាចង់លុបគណនីមួយនេះចោលមែនទេ? លុបហើយមិនអាចយកមកវិញបានទេ។",
    "parent.savePinNoteBefore": "កត់ឈ្មោះអ្នកប្រើប្រាស់ និងលេខសម្ងាត់ទុក! កូនរបស់អ្នកត្រូវប្រើវាដើម្បីចូលរៀនតាមរយៈ",
    "assignCourses.noChildren": "សូមបន្ថែមកូនៗចូលសិន ទើបអាចដាក់មេរៀនឱ្យពួកគេបាន។",
    "myCourses.descriptionPlaceholder": "តើកូនៗរបស់អ្នកនឹងរៀនពីអ្វីខ្លះ?",
    "admin.previewHint": "ចុច Play ដើម្បីស្ដាប់តន្ត្រី រួចអូសដើម្បីសារ៉េសំឡេងដែលកូនៗនឹងឮ។",
    "lesson.nicelyDone": "ធ្វើបានល្អណាស់!",
    "common.loadingMore": "កំពុងទាញយកបន្ថែម...",
    "books.subtitle": "រើសសៀវភៅមួយ ហើយចាប់ផ្ដើមអាន!",
    "tools.searchHint": "វាយបញ្ចូលពាក្យស្វែងរក រួចចុចស្វែងរក។",
    "admin.uploadPagesHint": "PNG, JPG ឬ WEBP — ជ្រើសរើសមួយ ឬច្រើនសន្លឹក។",
    "admin.pageNeedsContent": "សូមបន្ថែមអក្សរ ឬរូបភាពសម្រាប់ទំព័រនេះ។",
    "admin.discardUnsaved": "តើអ្នកចង់បោះបង់ការផ្លាស់ប្ដូរដែលមិនទាន់រក្សាទុកមែនទេ?",
    "admin.selectOrAddUnit": "បន្ថែមជំពូកនៅខាងឆ្វេងដើម្បីចាប់ផ្ដើមសរសេរ។"
}

for key, value in updates.items():
    if key in data:
        data[key] = value

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated kh.json successfully!")

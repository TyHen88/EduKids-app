import json

file_path = "/Users/henty/Documents/Coding/EduKids-app/app/[lang]/dictionaries/kh.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Dictionary of updates for more natural phrasing
updates = {
    "heartsModal.title": "អស់បេះដូងហើយ!",
    "lesson.selectCorrectMeaning": "រើសអត្ថន័យដែលត្រឹមត្រូវ",
    "auth.wrongEmailOrPassword": "អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។",
    "auth.signUpSubtitle": "បង្កើតគណនីដើម្បីចាប់ផ្តើមរុករក!",
    "auth.checkYourEmail": "ឆែកមើលអ៊ីមែលរបស់អ្នក 📬",
    "auth.resetEmailLinkSubtitle": "យើងនឹងផ្ញើតំណភ្ជាប់ទៅកាន់អ៊ីមែលរបស់អ្នក ដើម្បីកំណត់ពាក្យសម្ងាត់ថ្មី។",
    "auth.resetCodeSubtitle": "បញ្ចូលលេខកូដដែលយើងបានផ្ញើទៅកាន់ {email}។",
    "auth.backToSignIn": "ត្រឡប់ទៅកន្លែងចូលគណនីវិញ",
    "auth.couldntFindAccount": "រកគណនីនោះមិនឃើញទេ។",
    "auth.accountNotSetUp": "អូ! យើងរកគណនីរបស់អ្នកមិនឃើញទេ។ ប្រាប់ប៉ាម៉ាក់ឱ្យបន្ថែមឈ្មោះអ្នកសិន! 👨‍👩‍👧",
    "onboarding.learnerDescription": "ខ្ញុំចង់រៀនមេរៀនថ្មីៗ យកពិន្ទុ និងចាប់ផ្ដើមការផ្សងព្រេង!",
    "learn.rankFirstSubtitle": "អ្នកជាប់លេខ១ហើយ — ពូកែមែន!",
    "learn.rankPushPodium": "ប្រឹងឡើង ដើម្បីបានលេខ១!",
    "learn.rankNiceWork": "ធ្វើបានល្អណាស់",
    "learn.rankYoureRanked": "អ្នកជាប់ចំណាត់ថ្នាក់",
    "learn.rankEveryLesson": "រាល់មេរៀននីមួយៗជួយឱ្យអ្នកឡើងខ្ពស់!",
    "learn.noCourseYet": "មិនទាន់មានមេរៀនទេ។",
    "learn.pickOne": "រើសមួយមក!",
    "learn.noRewardsYet": "មិនទាន់មានរង្វាន់ទេ — ខំរៀនបន្តទៀត!",
    "learn.notEnoughStardust": "អ្នកមានធូលីផ្កាយមិនគ្រប់ដើម្បីឱ្យចំណីមិត្តតូចរបស់អ្នកទេ។",
    "learn.stardustCollected": "បានធូលីផ្កាយហើយ!",
    "courses.myBackpack": "កាបូបស្ពាយរបស់ខ្ញុំ",
    "courses.noneAvailable": "មិនទាន់មានមេរៀនទេ។",
    "courses.startAdventure": "ចាប់ផ្តើមការផ្សងព្រេងរបស់អ្នកឥឡូវនេះ!",
    "achievements.noStarCards": "មិនទាន់មានកាតផ្កាយទេ។",
    "profile.photoUploadError": "ផ្ទុករូបថតឡើងមិនបានទេ។",
    "profile.starCardsEmpty": "រៀនចប់មេរៀនដើម្បីប្រមូលកាតផ្កាយ!",
    "friends.subtitle": "រកមិត្តភក្តិ ទទួលសំណើ និងប្រកួតគ្នាលើតារាងពិន្ទុ!",
    "friends.noPendingRequests": "មិនមានសំណើរសុំធ្វើមិត្តទេ។",
    "friends.noUsersFound": "រកឈ្មោះនេះមិនឃើញទេ។",
    "parent.noChildrenAdded": "មិនទាន់មានកូននៅក្នុងគណនីទេ",
    "parent.accountCreated": "បានបង្កើតគណនីកូនរួចរាល់!",
    "parent.noChildrenYetDesc": "បន្ថែមគណនីឱ្យកូនៗរបស់អ្នក។ ពួកគេនឹងប្រើឈ្មោះ និងលេខកូដ៤ខ្ទង់ដើម្បីចូលលេង។",
    "parent.noCoursesAssigned": "មិនទាន់បានដាក់មេរៀនឱ្យនៅឡើយទេ។",
    "parent.courseNoLessons": "វគ្គនេះមិនទាន់មានមេរៀនទេ។",
    "myCourses.subtitle": "បង្កើតមេរៀនផ្ទាល់ខ្លួនសម្រាប់កូនៗរបស់អ្នក។",
    "assignCourses.subtitle": "រើសមេរៀនសម្រាប់ឱ្យកូនៗរបស់អ្នកលេង។",
    "assignCourses.noMatch": "គ្មានមេរៀនដែលត្រូវនឹងអ្វីដែលអ្នករកទេ។",
    "myCourses.noCoursesYet": "មិនទាន់មានមេរៀនទេ",
    "profile.familyMottoPlaceholder": "ឧ. រៀនសូត្រ និងស្វែងយល់ជាមួយគ្នា! 🚀",
    "admin.auditEmpty": "មិនទាន់មានសកម្មភាពអ្វីទេ។",
    "admin.soundMusicDesc": "បើក ឬបិទតន្ត្រី។ បើបិទ កុមារនឹងមិនឃើញប៊ូតុងតន្ត្រីទេ។",
    "admin.noCoursesCreateFirst": "មិនទាន់មានមេរៀនទេ។ បង្កើតមេរៀនដំបូងរបស់អ្នកឥឡូវនេះ!",
    "admin.noCoursesMatchFilter": "គ្មានមេរៀនដែលត្រូវនឹងអ្វីដែលអ្នករកទេ។",
    "admin.deleteCourseConfirm": "វានឹងលុបជំពូក មេរៀន និងពិន្ទុទាំងអស់របស់វាចោល។",
    "admin.contentSubtitle": "គ្រប់គ្រងជំពូក មេរៀន ប្លុក និងចម្លើយ។",
    "admin.blocksReordered": "រៀបលំដាប់ប្លុករួចរាល់។",
    "admin.deleteCascade": "វានឹងលុបអ្វីៗគ្រប់យ៉ាងដែលនៅក្នុងនេះ។",
    "admin.bodyTextPlaceholder": "បញ្ចូលអត្ថបទមេរៀននៅទីនេះ...",
    "admin.noUnitsYet": "មិនទាន់មានជំពូកទេ។ បន្ថែមជំពូកដំបូងរបស់អ្នក ដើម្បីចាប់ផ្តើមបង្កើតមេរៀន។",
    "admin.booksSubtitle": "បង្កើតសៀវភៅអាន និងផ្ទុករូបភាពសម្រាប់កុមារ។",
    "admin.noBooks": "មិនទាន់មានសៀវភៅទេ។ បង្កើតសៀវភៅដំបូងរបស់អ្នក!",
    "admin.publishedHint": "កុមារនឹងអាចឃើញវានៅក្នុងបណ្ណាល័យ។",
    "admin.bookDescPlaceholder": "តើសៀវភៅនេះនិយាយពីអ្វី?",
    "admin.managePagesSubtitle": "ផ្ទុកឡើង រៀបលំដាប់ និងលុបទំព័ររបស់សៀវភៅ។",
    "admin.noPagesYet": "មិនទាន់មានទំព័រទេ។ សូមផ្ទុករូបភាពឡើងដើម្បីបង្កើតសៀវភៅ។",
    "books.empty": "មិនទាន់មានសៀវភៅទេ។ ចាំត្រឡប់មកមើលពេលក្រោយទៀតណា!",
    "tools.imageDesc": "ស្វែងរករូបភាពពីអ៊ីនធឺណិត រួចកូពី URL។",
    "admin.pasteFromSearchHint": "គន្លឹះ៖ ប្រើឧបករណ៍ស្វែងរករូបភាព រួចកូពី URL មកដាក់នៅទីនេះ។",
    "admin.unsavedChanges": "អ្នកមិនទាន់បាន Save ទេ។"
}

for key, value in updates.items():
    if key in data:
        data[key] = value

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated kh.json successfully again!")

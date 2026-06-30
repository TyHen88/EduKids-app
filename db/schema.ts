import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { MAX_HEARTS } from "@/constants";

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageSrc: text("image_src").notNull(),
  // Extended fields to back the prototype UI with real data.
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("General"),
  difficulty: text("difficulty").notNull().default("Beginner"), // Beginner | Intermediate | Advanced
  // null = public (admin-created); userId = private (parent-created, only for their children)
  createdBy: text("created_by"),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  userProgress: many(userProgress),
  units: many(units),
}));

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Unit 1
  description: text("description").notNull(), // Learn the basics of spanish
  courseId: integer("course_id")
    .references(() => courses.id, {
      onDelete: "cascade",
    })
    .notNull(),
  order: integer("order").notNull(),
});

export const unitsRelations = relations(units, ({ many, one }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  unitId: integer("unit_id")
    .references(() => units.id, {
      onDelete: "cascade",
    })
    .notNull(),
  order: integer("order").notNull(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, {
    fields: [lessons.unitId],
    references: [units.id],
  }),
  lessonBlocks: many(lessonBlocks),
}));



// --- Lesson Blocks (new unified content + Q&A system) ------------------------

export const lessonBlocks = pgTable("lesson_blocks", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, { onDelete: "cascade" })
    .notNull(),
  // "TEXT" | "IMAGE" | "SELECT" | "ASSIST"
  type: text("type").notNull(),
  order: integer("order").notNull(),
  // TEXT blocks
  body: text("body"),
  // IMAGE blocks (imageSrc is also reused for an optional image on TEXT blocks)
  imageSrc: text("image_src"),
  caption: text("caption"),
  // For TEXT blocks with an optional image: "left" | "right" relative to the text
  imagePosition: text("image_position"),
  // SELECT / ASSIST blocks
  question: text("question"),
});

export const lessonBlocksRelations = relations(lessonBlocks, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [lessonBlocks.lessonId],
    references: [lessons.id],
  }),
  lessonBlockOptions: many(lessonBlockOptions),
  lessonBlockProgress: many(lessonBlockProgress),
}));

export const lessonBlockOptions = pgTable("lesson_block_options", {
  id: serial("id").primaryKey(),
  blockId: integer("block_id")
    .references(() => lessonBlocks.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  correct: boolean("correct").notNull().default(false),
  imageSrc: text("image_src"),
  audioSrc: text("audio_src"),
});

export const lessonBlockOptionsRelations = relations(lessonBlockOptions, ({ one }) => ({
  block: one(lessonBlocks, {
    fields: [lessonBlockOptions.blockId],
    references: [lessonBlocks.id],
  }),
}));

export const lessonBlockProgress = pgTable("lesson_block_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  blockId: integer("block_id")
    .references(() => lessonBlocks.id, { onDelete: "cascade" })
    .notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const lessonBlockProgressRelations = relations(lessonBlockProgress, ({ one }) => ({
  block: one(lessonBlocks, {
    fields: [lessonBlockProgress.blockId],
    references: [lessonBlocks.id],
  }),
}));

// Time (in seconds) a user spent on a lesson, recorded when the lesson is
// completed. One row per (userId, lessonId) — re-doing a lesson overwrites it.
export const lessonTime = pgTable("lesson_time", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, { onDelete: "cascade" })
    .notNull(),
  seconds: integer("seconds").notNull().default(0),
  // Wrong answers on question blocks (SELECT/ASSIST) during the lesson.
  // Reading blocks (TEXT/IMAGE) can never be "wrong", so they're excluded.
  wrongAnswers: integer("wrong_answers").notNull().default(0),
  // Per-question breakdown: which blocks were answered wrong, how often, and
  // which (wrong) option ids the child chose.
  wrongDetail: jsonb("wrong_detail").$type<
    { blockId: number; count: number; optionIds: number[] }[]
  >(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lessonTimeRelations = relations(lessonTime, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonTime.lessonId],
    references: [lessons.id],
  }),
}));

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  userImageSrc: text("user_image_src").notNull().default("/edu-logo.png"),
  role: text("role").notNull().default("learner"), // "learner" | "parent"
  // false = deactivated by an admin. Enforcement is app-level only: the auth
  // session stays valid but every authenticated layout redirects them to
  // /deactivated (see lib/guard.ts, actions/admin-users.ts).
  isActive: boolean("is_active").notNull().default(true),
  activeCourseId: integer("active_course_id").references(() => courses.id, {
    onDelete: "cascade",
  }),
  hearts: integer("hearts").notNull().default(MAX_HEARTS),
  points: integer("points").notNull().default(0), // "Stardust" in the UI
  // Extended field to back the prototype "streak" stat with real data.
  streak: integer("streak").notNull().default(0),
  // --- Cosmic Explorer: companion buddy ---
  buddyName: text("buddy_name").notNull().default("Cosmo"),
  buddyXp: integer("buddy_xp").notNull().default(0),
  // --- Cosmic Explorer: daily surprise chest ---
  lastChestAt: timestamp("last_chest_at"),
  // --- Family Customization ---
  familyName: text("family_name").notNull().default("My Family"),
  familyCover: text("family_cover").notNull().default("emerald"),
  familyMotto: text("family_motto").notNull().default(""),
  // --- Preferences ---
  // Gates web-push delivery for this user (in-app history is always kept).
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  // True once the user has set a password through the app. Needed because
  // Supabase doesn't expose "has password" for OAuth users who set one (no
  // email identity is added), so the Settings UI can't infer it from providers.
  passwordSet: boolean("password_set").notNull().default(false),
});

export const userProgressRelations = relations(
  userProgress,
  ({ one, many }) => ({
    activeCourse: one(courses, {
      fields: [userProgress.activeCourseId],
      references: [courses.id],
    }),
    userBadges: many(userBadges),
    followers: many(userFollowers, { relationName: "following" }),
    following: many(userFollowers, { relationName: "follower" }),
    // Family Group relations
    ownedFamilyGroups: many(familyGroups, { relationName: "owner" }),
    familyGroupAdults: many(familyGroupAdults),
    familyGroupChildren: many(familyGroupChildren),
  })
);

// --- Family Groups -----------------------------------------------------------

export const familyGroups = pgTable("family_groups", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id")
    .references(() => userProgress.userId, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull().default("My Family"),
  cover: text("cover").notNull().default("emerald"),
  motto: text("motto").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const familyGroupsRelations = relations(familyGroups, ({ one, many }) => ({
  owner: one(userProgress, {
    fields: [familyGroups.ownerId],
    references: [userProgress.userId],
    relationName: "owner",
  }),
  adults: many(familyGroupAdults),
  children: many(familyGroupChildren),
}));

export const familyGroupAdults = pgTable("family_group_adults", {
  id: serial("id").primaryKey(),
  familyGroupId: integer("family_group_id")
    .references(() => familyGroups.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => userProgress.userId, { onDelete: "cascade" })
    .notNull(),
  permissions: jsonb("permissions").notNull().default('{"canEditChild": false}'),
  status: text("status").notNull().default("pending"), // "pending" | "active"
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const familyGroupAdultsRelations = relations(familyGroupAdults, ({ one }) => ({
  familyGroup: one(familyGroups, {
    fields: [familyGroupAdults.familyGroupId],
    references: [familyGroups.id],
  }),
  user: one(userProgress, {
    fields: [familyGroupAdults.userId],
    references: [userProgress.userId],
  }),
}));

export const familyGroupChildren = pgTable("family_group_children", {
  id: serial("id").primaryKey(),
  familyGroupId: integer("family_group_id")
    .references(() => familyGroups.id, { onDelete: "cascade" })
    .notNull(),
  childId: text("child_id")
    .references(() => userProgress.userId, { onDelete: "cascade" })
    .notNull(),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const familyGroupChildrenRelations = relations(familyGroupChildren, ({ one }) => ({
  familyGroup: one(familyGroups, {
    fields: [familyGroupChildren.familyGroupId],
    references: [familyGroups.id],
  }),
  child: one(userProgress, {
    fields: [familyGroupChildren.childId],
    references: [userProgress.userId],
  }),
}));

export const courseAssignments = pgTable("course_assignments", {
  id: serial("id").primaryKey(),
  parentId: text("parent_id")
    .references(() => userProgress.userId, { onDelete: "cascade" })
    .notNull(),
  childId: text("child_id")
    .references(() => userProgress.userId, { onDelete: "cascade" })
    .notNull(),
  courseId: integer("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  notes: text("notes"),
});

export const courseAssignmentsRelations = relations(courseAssignments, ({ one }) => ({
  parent: one(userProgress, {
    fields: [courseAssignments.parentId],
    references: [userProgress.userId],
  }),
  child: one(userProgress, {
    fields: [courseAssignments.childId],
    references: [userProgress.userId],
  }),
  course: one(courses, {
    fields: [courseAssignments.courseId],
    references: [courses.id],
  }),
}));

// --- Badges (achievements) ---------------------------------------------------

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(), // emoji or image path
  description: text("description").notNull(),
});

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  badgeId: integer("badge_id")
    .references(() => badges.id, {
      onDelete: "cascade",
    })
    .notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
  userProgress: one(userProgress, {
    fields: [userBadges.userId],
    references: [userProgress.userId],
  }),
}));

// --- Social (Connections/Followers) ------------------------------------------

export const userFollowers = pgTable("user_followers", {
  id: serial("id").primaryKey(),
  followerId: text("follower_id")
    .references(() => userProgress.userId, {
      onDelete: "cascade",
    })
    .notNull(),
  followingId: text("following_id")
    .references(() => userProgress.userId, {
      onDelete: "cascade",
    })
    .notNull(),
  isAccepted: boolean("is_accepted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userFollowersRelations = relations(userFollowers, ({ one }) => ({
  follower: one(userProgress, {
    fields: [userFollowers.followerId],
    references: [userProgress.userId],
    relationName: "follower",
  }),
  following: one(userProgress, {
    fields: [userFollowers.followingId],
    references: [userProgress.userId],
    relationName: "following",
  }),
}));

// --- Web Push Notifications --------------------------------------------------

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => userProgress.userId, {
      onDelete: "cascade",
    })
    .notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(userProgress, {
    fields: [pushSubscriptions.userId],
    references: [userProgress.userId],
  }),
}));

export const appNotifications = pgTable("app_notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => userProgress.userId, {
      onDelete: "cascade",
    })
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appNotificationsRelations = relations(appNotifications, ({ one }) => ({
  user: one(userProgress, {
    fields: [appNotifications.userId],
    references: [userProgress.userId],
  }),
}));

// --- Audit log ---------------------------------------------------------------
// Records account events for the admin audit log. Intentionally has NO foreign
// key to userProgress so an event can be recorded even before the user has
// completed onboarding (no profile row yet). userName/role are snapshots.
export const loginAudit = pgTable("login_audit", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name"),
  role: text("role"),
  // login | logout | signup | create_child | change_password
  event: text("event").notNull().default("login"),
  loginType: text("login_type"), // email | google | pin — for login/signup
  // Human-readable reason/description of what the user did.
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// --- Audio settings (global, admin-managed) ----------------------------------
// A single-row table (id = 1) holding platform-wide background-music config set
// by an admin. When `musicEnabled` is false, learners get no music and the
// music toggle icon is hidden for them. `musicVolume` is 0–100. Learners still
// keep their own on/off preference locally; effective playback is
// adminEnabled && learnerEnabled, at `musicVolume`.
export const audioSettings = pgTable("audio_settings", {
  id: integer("id").primaryKey().default(1),
  musicEnabled: boolean("music_enabled").notNull().default(true),
  musicVolume: integer("music_volume").notNull().default(50),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Books (admin-managed reading library) -----------------------------------
// Picture/reading books for kids. Each book has ordered page images stored in
// Vercel Blob. `createdBy` is the admin's user id (null = system seed). Only
// `isPublished` books are visible to learners.
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  coverSrc: text("cover_src").notNull().default("/edu-logo.png"),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("General"),
  language: text("language").notNull().default("en"), // "km" | "en" | ...
  isPublished: boolean("is_published").notNull().default(false),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookPages = pgTable("book_pages", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  imageSrc: text("image_src").notNull(),
});

export const booksRelations = relations(books, ({ many }) => ({
  pages: many(bookPages),
}));

export const bookPagesRelations = relations(bookPages, ({ one }) => ({
  book: one(books, {
    fields: [bookPages.bookId],
    references: [books.id],
  }),
}));

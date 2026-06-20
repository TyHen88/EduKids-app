import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
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
  challenges: many(challenges),
}));

export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST"]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, {
      onDelete: "cascade",
    })
    .notNull(),
  type: challengesEnum("type").notNull(),
  question: text("question").notNull(),
  order: integer("order").notNull(),
});

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [challenges.lessonId],
    references: [lessons.id],
  }),
  challengeOptions: many(challengeOptions),
  challengeProgress: many(challengeProgress),
}));

export const challengeOptions = pgTable("challenge_options", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, {
      onDelete: "cascade",
    })
    .notNull(),
  text: text("text").notNull(),
  correct: boolean("correct").notNull(),
  imageSrc: text("image_src"),
  audioSrc: text("audio_src"),
});

export const challengeOptionsRelations = relations(
  challengeOptions,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeOptions.challengeId],
      references: [challenges.id],
    }),
  })
);

export const challengeProgress = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, {
      onDelete: "cascade",
    })
    .notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const challengeProgressRelations = relations(
  challengeProgress,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeProgress.challengeId],
      references: [challenges.id],
    }),
  })
);

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  userImageSrc: text("user_image_src").notNull().default("/mascot.svg"),
  role: text("role").notNull().default("learner"), // "learner" | "parent"
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
    // Parent-child family relations
    childrenAsParent: many(familyMembers, { relationName: "parent" }),
    parentsAsChild: many(familyMembers, { relationName: "child" }),
  })
);

// --- Family (Parent ↔ Child) -------------------------------------------------

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  parentId: text("parent_id")
    .references(() => userProgress.userId, { onDelete: "cascade" })
    .notNull(),
  childId: text("child_id")
    .references(() => userProgress.userId, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  parent: one(userProgress, {
    fields: [familyMembers.parentId],
    references: [userProgress.userId],
    relationName: "parent",
  }),
  child: one(userProgress, {
    fields: [familyMembers.childId],
    references: [userProgress.userId],
    relationName: "child",
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

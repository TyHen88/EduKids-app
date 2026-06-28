CREATE TABLE "app_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"child_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"image_src" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"difficulty" text DEFAULT 'Beginner' NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "family_group_adults" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_group_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"permissions" jsonb DEFAULT '{"canEditChild": false}' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_group_children" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_group_id" integer NOT NULL,
	"child_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text DEFAULT 'My Family' NOT NULL,
	"cover" text DEFAULT 'emerald' NOT NULL,
	"motto" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_block_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"block_id" integer NOT NULL,
	"text" text NOT NULL,
	"correct" boolean DEFAULT false NOT NULL,
	"image_src" text,
	"audio_src" text
);
--> statement-breakpoint
CREATE TABLE "lesson_block_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"block_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"type" text NOT NULL,
	"order" integer NOT NULL,
	"body" text,
	"image_src" text,
	"caption" text,
	"image_position" text,
	"question" text
);
--> statement-breakpoint
CREATE TABLE "lesson_time" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" integer NOT NULL,
	"seconds" integer DEFAULT 0 NOT NULL,
	"wrong_answers" integer DEFAULT 0 NOT NULL,
	"wrong_detail" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"unit_id" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text,
	"role" text,
	"event" text DEFAULT 'login' NOT NULL,
	"login_type" text,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"course_id" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"badge_id" integer NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_followers" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"is_accepted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_name" text DEFAULT 'User' NOT NULL,
	"user_image_src" text DEFAULT '/mascot.svg' NOT NULL,
	"role" text DEFAULT 'learner' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"active_course_id" integer,
	"hearts" integer DEFAULT 5 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"buddy_name" text DEFAULT 'Cosmo' NOT NULL,
	"buddy_xp" integer DEFAULT 0 NOT NULL,
	"last_chest_at" timestamp,
	"family_name" text DEFAULT 'My Family' NOT NULL,
	"family_cover" text DEFAULT 'emerald' NOT NULL,
	"family_motto" text DEFAULT '' NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"password_set" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_notifications" ADD CONSTRAINT "app_notifications_user_id_user_progress_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_progress"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_parent_id_user_progress_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_progress"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_child_id_user_progress_user_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."user_progress"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_group_adults" ADD CONSTRAINT "family_group_adults_family_group_id_family_groups_id_fk" FOREIGN KEY ("family_group_id") REFERENCES "public"."family_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_group_adults" ADD CONSTRAINT "family_group_adults_user_id_user_progress_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_progress"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_group_children" ADD CONSTRAINT "family_group_children_family_group_id_family_groups_id_fk" FOREIGN KEY ("family_group_id") REFERENCES "public"."family_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_group_children" ADD CONSTRAINT "family_group_children_child_id_user_progress_user_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."user_progress"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_groups" ADD CONSTRAINT "family_groups_owner_id_user_progress_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_progress"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_block_options" ADD CONSTRAINT "lesson_block_options_block_id_lesson_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."lesson_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_block_progress" ADD CONSTRAINT "lesson_block_progress_block_id_lesson_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."lesson_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_blocks" ADD CONSTRAINT "lesson_blocks_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_time" ADD CONSTRAINT "lesson_time_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_user_progress_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_progress"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_followers" ADD CONSTRAINT "user_followers_follower_id_user_progress_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user_progress"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_followers" ADD CONSTRAINT "user_followers_following_id_user_progress_user_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."user_progress"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_active_course_id_courses_id_fk" FOREIGN KEY ("active_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
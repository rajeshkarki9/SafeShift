CREATE TYPE "public"."learningStage" AS ENUM('ready', 'training', 'quiz', 'results', 'progress');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "employee_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"displayName" varchar(120) DEFAULT 'Employee' NOT NULL,
	"passwordHash" varchar(200) NOT NULL,
	"mustChangePassword" integer DEFAULT 1 NOT NULL,
	"department" varchar(120),
	"phone" varchar(40),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp,
	CONSTRAINT "employee_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "employee_learning_outcomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeEmail" varchar(320) NOT NULL,
	"completionPercent" integer DEFAULT 0 NOT NULL,
	"latestScore" integer,
	"completedAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_learning_outcomes_employeeEmail_unique" UNIQUE("employeeEmail")
);
--> statement-breakpoint
CREATE TABLE "employee_learning_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeEmail" varchar(320) NOT NULL,
	"displayName" varchar(120) NOT NULL,
	"learningStage" "learningStage" DEFAULT 'ready' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_learning_records_employeeEmail_unique" UNIQUE("employeeEmail")
);
--> statement-breakpoint
CREATE TABLE "employee_topic_outcomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeEmail" varchar(320) NOT NULL,
	"topicKey" varchar(80) NOT NULL,
	"topicTitle" varchar(160) NOT NULL,
	"learningStage" "learningStage" DEFAULT 'ready' NOT NULL,
	"progressPercent" integer DEFAULT 0 NOT NULL,
	"latestScore" integer,
	"completedAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_topic_outcomes_employee_topic_unique" UNIQUE("employeeEmail","topicKey")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempt_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attemptId" integer NOT NULL,
	"questionId" integer NOT NULL,
	"selectedOption" integer NOT NULL,
	"isCorrect" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeEmail" varchar(320) NOT NULL,
	"topicKey" varchar(80) NOT NULL,
	"topicTitle" varchar(160) NOT NULL,
	"score" integer NOT NULL,
	"percentage" integer NOT NULL,
	"correctAnswers" integer NOT NULL,
	"incorrectAnswers" integer NOT NULL,
	"completionStatus" varchar(40) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"topicKey" varchar(80) NOT NULL,
	"topicTitle" varchar(160) NOT NULL,
	"prompt" text NOT NULL,
	"optionsJson" text NOT NULL,
	"correctOption" integer NOT NULL,
	"explanation" text NOT NULL,
	"sortOrder" integer NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "quiz_questions_topic_order_unique" UNIQUE("topicKey","sortOrder")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);

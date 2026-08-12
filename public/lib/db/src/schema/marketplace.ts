import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const serviceCategoriesTable = pgTable(
  "service_categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    requestCount: integer("request_count").notNull().default(0),
  },
  (table) => [index("service_categories_name_idx").on(table.name)],
);

export const handymenTable = pgTable(
  "handymen",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    title: text("title").notNull(),
    avatar: text("avatar").notNull(),
    rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
    completedJobs: integer("completed_jobs").notNull().default(0),
    yearsExperience: integer("years_experience").notNull().default(0),
    distanceKm: numeric("distance_km", { precision: 5, scale: 2 }).notNull().default("0"),
    responseRate: integer("response_rate").notNull().default(0),
    responseTime: text("response_time").notNull(),
    services: text("services").array().notNull().default([]),
    serviceArea: text("service_area").notNull(),
    available: boolean("available").notNull().default(true),
    verified: boolean("verified").notNull().default(false),
    reviewCount: integer("review_count").notNull().default(0),
    reviewExcerpt: text("review_excerpt").notNull().default(""),
  },
  (table) => [
    index("handymen_available_idx").on(table.available),
    index("handymen_verified_idx").on(table.verified),
  ],
);

export const serviceRequestsTable = pgTable(
  "service_requests",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").notNull().default(1),
    category: text("category").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    preferredTime: text("preferred_time").notNull(),
    requestType: text("request_type").notNull().default("normal"),
    status: text("status").notNull().default("REQUESTED"),
    photoCount: integer("photo_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    handymanId: integer("handyman_id"),
    jobId: integer("job_id"),
  },
  (table) => [
    index("service_requests_customer_idx").on(table.customerId),
    index("service_requests_status_idx").on(table.status),
  ],
);

export const quotesTable = pgTable(
  "quotes",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id").notNull(),
    handymanId: integer("handyman_id").notNull(),
    laborPrice: numeric("labor_price", { precision: 10, scale: 2 }).notNull(),
    materialCost: numeric("material_cost", { precision: 10, scale: 2 }).notNull(),
    duration: text("duration").notNull(),
    notes: text("notes").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    status: text("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quotes_request_idx").on(table.requestId),
    index("quotes_handyman_idx").on(table.handymanId),
  ],
);

export const jobsTable = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id").notNull(),
    quoteId: integer("quote_id").notNull(),
    customerName: text("customer_name").notNull().default("Marta Bekele"),
    handymanName: text("handyman_name").notNull(),
    handymanAvatar: text("handyman_avatar").notNull(),
    category: text("category").notNull(),
    location: text("location").notNull(),
    scheduledFor: text("scheduled_for").notNull(),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    status: text("status").notNull().default("BOOKED"),
  },
  (table) => [index("jobs_status_idx").on(table.status)],
);

export const reviewsTable = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id").notNull(),
    handymanId: integer("handyman_id").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    authorName: text("author_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("reviews_handyman_idx").on(table.handymanId)],
);

export const notificationsTable = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_read_idx").on(table.read)],
);

export const insertServiceCategorySchema = createInsertSchema(serviceCategoriesTable).omit({ id: true });
export const insertHandymanSchema = createInsertSchema(handymenTable).omit({ id: true });
export const insertServiceRequestSchema = createInsertSchema(serviceRequestsTable).omit({ id: true, createdAt: true });
export const insertQuoteSchema = createInsertSchema(quotesTable).omit({ id: true, createdAt: true });
export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });

export type ServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type Handyman = z.infer<typeof insertHandymanSchema>;
export type ServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type Quote = z.infer<typeof insertQuoteSchema>;
export type Job = z.infer<typeof insertJobSchema>;
export type Review = z.infer<typeof insertReviewSchema>;
export type Notification = z.infer<typeof insertNotificationSchema>;
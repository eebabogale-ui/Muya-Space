import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
  AcceptQuoteParams,
  CreateQuoteBody,
  CreateQuoteParams,
  CreateReviewBody,
  CreateReviewParams,
  CreateServiceRequestBody,
  GetHandymanParams,
  GetServiceRequestParams,
  JobStatusInput,
  ListHandymenQueryParams,
  ListServiceRequestsQueryParams,
  ListQuotesParams,
  UpdateJobStatusBody,
  UpdateJobStatusParams,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  handymenTable,
  jobsTable,
  notificationsTable,
  quotesTable,
  reviewsTable,
  serviceCategoriesTable,
  serviceRequestsTable,
} from "@workspace/db";

const router: IRouter = Router();
let seedPromise: Promise<void> | undefined;

const avatarUrls = {
  abebe: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80",
  hana: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=160&q=80",
  yosef: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
};

async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db
        .select({ id: serviceCategoriesTable.id })
        .from(serviceCategoriesTable)
        .limit(1);
      if (existing.length > 0) return;

      await db.insert(serviceCategoriesTable).values([
        { name: "Plumbing", description: "Leaks, pipes, sinks and water systems", icon: "droplets", requestCount: 38 },
        { name: "Electrical", description: "Wiring, lighting and power issues", icon: "zap", requestCount: 27 },
        { name: "Carpentry", description: "Furniture, doors and built-in work", icon: "hammer", requestCount: 19 },
        { name: "Appliance Repair", description: "Get essential appliances working again", icon: "washing-machine", requestCount: 16 },
        { name: "Painting", description: "Interior touch-ups and full-room refreshes", icon: "paint-roller", requestCount: 14 },
        { name: "Cleaning", description: "Reliable help for homes and offices", icon: "sparkles", requestCount: 12 },
        { name: "General Maintenance", description: "The fixes that keep your space running", icon: "wrench", requestCount: 9 },
        { name: "Other", description: "Tell us what you need help with", icon: "more-horizontal", requestCount: 5 },
      ]);

      const [abebe, hana, yosef] = await db
        .insert(handymenTable)
        .values([
          {
            name: "Abebe Mekonnen",
            title: "Professional Plumber",
            avatar: avatarUrls.abebe,
            rating: "4.8",
            completedJobs: 126,
            yearsExperience: 7,
            distanceKm: "2.1",
            responseRate: 98,
            responseTime: "Usually replies in 8 min",
            services: ["Plumbing", "General Maintenance"],
            serviceArea: "Bole, Kazanchis, Saris",
            available: true,
            verified: true,
            reviewCount: 54,
            reviewExcerpt: "Careful, transparent, and finished ahead of schedule.",
          },
          {
            name: "Hana Tesfaye",
            title: "Electrical & Appliance Specialist",
            avatar: avatarUrls.hana,
            rating: "4.9",
            completedJobs: 89,
            yearsExperience: 5,
            distanceKm: "3.4",
            responseRate: 96,
            responseTime: "Usually replies in 12 min",
            services: ["Electrical", "Appliance Repair"],
            serviceArea: "Lideta, Piassa, Megenagna",
            available: true,
            verified: true,
            reviewCount: 41,
            reviewExcerpt: "Explained every option and solved it in one visit.",
          },
          {
            name: "Yosef Alemu",
            title: "Carpenter & Home Repair",
            avatar: avatarUrls.yosef,
            rating: "4.7",
            completedJobs: 74,
            yearsExperience: 6,
            distanceKm: "5.8",
            responseRate: 92,
            responseTime: "Usually replies in 20 min",
            services: ["Carpentry", "Painting", "General Maintenance"],
            serviceArea: "Gerji, CMC, Yeka",
            available: false,
            verified: true,
            reviewCount: 28,
            reviewExcerpt: "Good craftsmanship and very respectful in our home.",
          },
        ])
        .returning();

      const [pendingRequest, bookedRequest] = await db
        .insert(serviceRequestsTable)
        .values([
          {
            customerId: 1,
            category: "Plumbing",
            description: "Kitchen sink is leaking underneath the cabinet.",
            location: "Bole Atlas, Addis Ababa",
            preferredTime: "Today, 4:00 PM - 6:00 PM",
            requestType: "normal",
            status: "OFFERS_RECEIVED",
            photoCount: 2,
          },
          {
            customerId: 1,
            category: "Electrical",
            description: "The hallway lights keep flickering after the rain.",
            location: "Kazanchis, Addis Ababa",
            preferredTime: "Tomorrow, 9:00 AM - 11:00 AM",
            requestType: "normal",
            status: "IN_PROGRESS",
            photoCount: 1,
            handymanId: hana.id,
          },
        ])
        .returning();

      const [pendingQuote] = await db
        .insert(quotesTable)
        .values({
          requestId: pendingRequest.id,
          handymanId: abebe.id,
          laborPrice: "600",
          materialCost: "200",
          duration: "2 hours",
          notes: "I can bring the replacement seal and check the pipe connection.",
          status: "PENDING",
        })
        .returning();

      const [bookedJob] = await db
        .insert(jobsTable)
        .values({
          requestId: bookedRequest.id,
          quoteId: pendingQuote.id,
          customerName: "Marta Bekele",
          handymanName: hana.name,
          handymanAvatar: hana.avatar,
          category: bookedRequest.category,
          location: bookedRequest.location,
          scheduledFor: bookedRequest.preferredTime,
          totalPrice: "1450",
          status: "IN_PROGRESS",
        })
        .returning();

      await db
        .update(serviceRequestsTable)
        .set({ jobId: bookedJob.id, status: "IN_PROGRESS" })
        .where(eq(serviceRequestsTable.id, bookedRequest.id));

      await db.insert(notificationsTable).values([
        {
          title: "New quote received",
          message: "Abebe sent an estimate of 800 ETB for your plumbing request.",
          type: "quote",
          read: false,
        },
        {
          title: "Job in progress",
          message: "Hana has started the electrical repair at Kazanchis.",
          type: "job",
          read: false,
        },
        {
          title: "Welcome to Fixr",
          message: "Tell us what needs fixing and we’ll help you find the right professional.",
          type: "welcome",
          read: true,
        },
      ]);
    })();
  }
  return seedPromise;
}

function numberValue(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function toIso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function mapHandyman(row: typeof handymenTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    avatar: row.avatar,
    rating: numberValue(row.rating),
    completedJobs: row.completedJobs,
    yearsExperience: row.yearsExperience,
    distanceKm: numberValue(row.distanceKm),
    responseRate: row.responseRate,
    responseTime: row.responseTime,
    services: row.services,
    serviceArea: row.serviceArea,
    available: row.available,
    verified: row.verified,
    reviewCount: row.reviewCount,
    reviewExcerpt: row.reviewExcerpt,
  };
}

function mapRequest(
  row: typeof serviceRequestsTable.$inferSelect,
  quoteCount: number,
  handyman?: typeof handymenTable.$inferSelect | null,
) {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    location: row.location,
    preferredTime: row.preferredTime,
    requestType: row.requestType,
    status: row.status,
    photoCount: row.photoCount,
    quoteCount,
    createdAt: row.createdAt.toISOString(),
    handymanName: handyman?.name ?? null,
    handymanAvatar: handyman?.avatar ?? null,
    jobId: row.jobId ?? null,
  };
}

async function getRequestQuoteCount(requestId: number) {
  const rows = await db
    .select({ id: quotesTable.id })
    .from(quotesTable)
    .where(eq(quotesTable.requestId, requestId));
  return rows.length;
}

async function getMappedRequests(role: "customer" | "handyman" = "customer") {
  const requests = await db
    .select()
    .from(serviceRequestsTable)
    .where(role === "customer" ? eq(serviceRequestsTable.customerId, 1) : undefined)
    .orderBy(desc(serviceRequestsTable.createdAt));
  const mapped = [];
  for (const request of requests) {
    const handyman = request.handymanId
      ? (await db.select().from(handymenTable).where(eq(handymenTable.id, request.handymanId)).limit(1))[0]
      : null;
    mapped.push(mapRequest(request, await getRequestQuoteCount(request.id), handyman));
  }
  return mapped;
}

async function getHandymanById(id: number) {
  return (await db.select().from(handymenTable).where(eq(handymenTable.id, id)).limit(1))[0];
}

router.get("/categories", async (_req, res, next) => {
  try {
    await ensureSeeded();
    res.json(await db.select().from(serviceCategoriesTable).orderBy(asc(serviceCategoriesTable.id)));
  } catch (error) {
    next(error);
  }
});

router.get("/customer/dashboard", async (_req, res, next) => {
  try {
    await ensureSeeded();
    const requests = await getMappedRequests("customer");
    const handymen = await db.select().from(handymenTable).orderBy(desc(handymenTable.rating)).limit(3);
    res.json({
      customerName: "Marta",
      activeJobs: requests.filter((request) => ["BOOKED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"].includes(request.status)).length,
      pendingRequests: requests.filter((request) => ["REQUESTED", "MATCHING", "OFFERS_RECEIVED"].includes(request.status)).length,
      completedJobs: requests.filter((request) => ["COMPLETED", "PAID", "REVIEWED"].includes(request.status)).length,
      upcomingAppointments: requests.filter((request) => ["BOOKED", "ON_THE_WAY"].includes(request.status)).length,
      requests,
      recommendedHandymen: handymen.map(mapHandyman),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/handyman/dashboard", async (_req, res, next) => {
  try {
    await ensureSeeded();
    const handyman = await getHandymanById(1);
    if (!handyman) {
      res.status(404).json({ error: "Handyman not found" });
      return;
    }
    const requests = await getMappedRequests("handyman");
    const jobs = await db.select().from(jobsTable).where(inArray(jobsTable.status, ["BOOKED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"]));
    res.json({
      handyman: mapHandyman(handyman),
      newRequests: requests.filter((request) => ["REQUESTED", "MATCHING", "OFFERS_RECEIVED"].includes(request.status)).length,
      activeJobs: jobs.length,
      completedJobs: handyman.completedJobs,
      todayEarnings: 1450,
      weeklyEarnings: 6870,
      requests,
      activeJob: jobs[0]
        ? {
            ...jobs[0],
            totalPrice: numberValue(jobs[0].totalPrice),
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/handymen", async (req, res, next) => {
  try {
    await ensureSeeded();
    const parsed = ListHandymenQueryParams.parse(req.query);
    const rows = await db.select().from(handymenTable).where(
      parsed.search
        ? or(ilike(handymenTable.name, `%${parsed.search}%`), ilike(handymenTable.title, `%${parsed.search}%`))
        : undefined,
    );
    const filtered = parsed.category
      ? rows.filter((row) => row.services.includes(parsed.category!))
      : rows;
    res.json(filtered.map(mapHandyman));
  } catch (error) {
    next(error);
  }
});

router.get("/handymen/:id", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id } = GetHandymanParams.parse({ id: Number(req.params.id) });
    const handyman = await getHandymanById(id);
    if (!handyman) {
      res.status(404).json({ error: "Handyman not found" });
      return;
    }
    res.json(mapHandyman(handyman));
  } catch (error) {
    next(error);
  }
});

router.get("/service-requests", async (req, res, next) => {
  try {
    await ensureSeeded();
    const parsed = ListServiceRequestsQueryParams.parse(req.query);
    res.json(await getMappedRequests(parsed.role === "handyman" ? "handyman" : "customer"));
  } catch (error) {
    next(error);
  }
});

router.post("/service-requests", async (req, res, next) => {
  try {
    await ensureSeeded();
    const data = CreateServiceRequestBody.parse(req.body);
    const [request] = await db
      .insert(serviceRequestsTable)
      .values({
        customerId: 1,
        category: data.category,
        description: data.description,
        location: data.location,
        preferredTime: data.preferredTime,
        requestType: data.requestType,
        status: data.requestType === "emergency" ? "MATCHING" : "MATCHING",
        photoCount: data.photoCount,
      })
      .returning();
    await db.insert(notificationsTable).values({
      title: data.requestType === "emergency" ? "Emergency request is matching" : "Request submitted",
      message: "We’re finding suitable professionals near you.",
      type: "request",
      read: false,
    });
    res.status(201).json(mapRequest(request, 0));
  } catch (error) {
    next(error);
  }
});

router.get("/service-requests/:id", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id } = GetServiceRequestParams.parse({ id: Number(req.params.id) });
    const request = (await db.select().from(serviceRequestsTable).where(eq(serviceRequestsTable.id, id)).limit(1))[0];
    if (!request) {
      res.status(404).json({ error: "Service request not found" });
      return;
    }
    const quoteRows = await db.select().from(quotesTable).where(eq(quotesTable.requestId, id)).orderBy(asc(quotesTable.laborPrice));
    const handymanIds = quoteRows.map((quote) => quote.handymanId);
    const handymanRows = handymanIds.length
      ? await db.select().from(handymenTable).where(inArray(handymenTable.id, handymanIds))
      : [];
    const handymanMap = new Map(handymanRows.map((handyman) => [handyman.id, handyman]));
    const quotes = quoteRows.map((quote) => ({
      id: quote.id,
      requestId: quote.requestId,
      handymanId: quote.handymanId,
      handyman: mapHandyman(handymanMap.get(quote.handymanId)!),
      laborPrice: numberValue(quote.laborPrice),
      materialCost: numberValue(quote.materialCost),
      totalPrice: numberValue(quote.laborPrice) + numberValue(quote.materialCost),
      duration: quote.duration,
      notes: quote.notes,
      expiresAt: toIso(quote.expiresAt),
      status: quote.status,
      createdAt: quote.createdAt.toISOString(),
    }));
    const job = request.jobId
      ? (await db.select().from(jobsTable).where(eq(jobsTable.id, request.jobId)).limit(1))[0]
      : null;
    const handyman = request.handymanId ? await getHandymanById(request.handymanId) : null;
    res.json({
      ...mapRequest(request, quotes.length, handyman),
      photos: [],
      quotes,
      job: job ? { ...job, totalPrice: numberValue(job.totalPrice) } : null,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/service-requests/:id/quotes", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id } = ListQuotesParams.parse({ id: Number(req.params.id) });
    const quotes = await db.select().from(quotesTable).where(eq(quotesTable.requestId, id)).orderBy(asc(quotesTable.laborPrice));
    const handymen = await db.select().from(handymenTable).where(inArray(handymenTable.id, quotes.map((quote) => quote.handymanId)));
    const handymanMap = new Map(handymen.map((handyman) => [handyman.id, handyman]));
    res.json(quotes.map((quote) => ({
      id: quote.id,
      requestId: quote.requestId,
      handymanId: quote.handymanId,
      handyman: mapHandyman(handymanMap.get(quote.handymanId)!),
      laborPrice: numberValue(quote.laborPrice),
      materialCost: numberValue(quote.materialCost),
      totalPrice: numberValue(quote.laborPrice) + numberValue(quote.materialCost),
      duration: quote.duration,
      notes: quote.notes,
      expiresAt: toIso(quote.expiresAt),
      status: quote.status,
      createdAt: quote.createdAt.toISOString(),
    })));
  } catch (error) {
    next(error);
  }
});

router.post("/service-requests/:id/quotes", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id: requestId } = CreateQuoteParams.parse({ id: Number(req.params.id) });
    const data = CreateQuoteBody.parse(req.body);
    const handyman = await getHandymanById(1);
    if (!handyman) {
      res.status(404).json({ error: "Handyman not found" });
      return;
    }
    const [quote] = await db.insert(quotesTable).values({
      requestId,
      handymanId: handyman.id,
      laborPrice: String(data.laborPrice),
      materialCost: String(data.materialCost),
      duration: data.duration,
      notes: data.notes,
      status: "PENDING",
    }).returning();
    await db.update(serviceRequestsTable).set({ status: "OFFERS_RECEIVED" }).where(eq(serviceRequestsTable.id, requestId));
    await db.insert(notificationsTable).values({
      title: "Quote sent",
      message: "Your estimate has been sent to the customer.",
      type: "quote",
      read: true,
    });
    res.status(201).json({
      id: quote.id,
      requestId: quote.requestId,
      handymanId: quote.handymanId,
      handyman: mapHandyman(handyman),
      laborPrice: numberValue(quote.laborPrice),
      materialCost: numberValue(quote.materialCost),
      totalPrice: numberValue(quote.laborPrice) + numberValue(quote.materialCost),
      duration: quote.duration,
      notes: quote.notes,
      expiresAt: toIso(quote.expiresAt),
      status: quote.status,
      createdAt: quote.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/quotes/:id/accept", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id: quoteId } = AcceptQuoteParams.parse({ id: Number(req.params.id) });
    const quote = (await db.select().from(quotesTable).where(eq(quotesTable.id, quoteId)).limit(1))[0];
    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }
    const request = (await db.select().from(serviceRequestsTable).where(eq(serviceRequestsTable.id, quote.requestId)).limit(1))[0];
    const handyman = await getHandymanById(quote.handymanId);
    if (!request || !handyman) {
      res.status(404).json({ error: "Request or handyman not found" });
      return;
    }
    const job = await db.transaction(async (tx) => {
      await tx.update(quotesTable).set({ status: "REJECTED" }).where(and(eq(quotesTable.requestId, quote.requestId), eq(quotesTable.status, "PENDING")));
      await tx.update(quotesTable).set({ status: "ACCEPTED" }).where(eq(quotesTable.id, quoteId));
      const [created] = await tx.insert(jobsTable).values({
        requestId: request.id,
        quoteId: quote.id,
        customerName: "Marta Bekele",
        handymanName: handyman.name,
        handymanAvatar: handyman.avatar,
        category: request.category,
        location: request.location,
        scheduledFor: request.preferredTime,
        totalPrice: String(numberValue(quote.laborPrice) + numberValue(quote.materialCost)),
        status: "BOOKED",
      }).returning();
      await tx.update(serviceRequestsTable).set({ status: "BOOKED", handymanId: handyman.id, jobId: created.id }).where(eq(serviceRequestsTable.id, request.id));
      return created;
    });
    await db.insert(notificationsTable).values({
      title: "Handyman booked",
      message: `${handyman.name} is booked for your ${request.category.toLowerCase()} request.`,
      type: "booking",
      read: false,
    });
    res.json({ ...job, totalPrice: numberValue(job.totalPrice) });
  } catch (error) {
    next(error);
  }
});

router.patch("/jobs/:id/status", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id } = UpdateJobStatusParams.parse({ id: Number(req.params.id) });
    const { status } = UpdateJobStatusBody.parse(req.body);
    const job = (await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1))[0];
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    const [updated] = await db.update(jobsTable).set({ status }).where(eq(jobsTable.id, id)).returning();
    await db.update(serviceRequestsTable).set({ status }).where(eq(serviceRequestsTable.id, job.requestId));
    await db.insert(notificationsTable).values({
      title: status === "COMPLETED" ? "Job completed" : "Job status updated",
      message: status === "COMPLETED" ? "Your job is complete. Leave a review when you’re ready." : `The job is now ${status.replaceAll("_", " ").toLowerCase()}.`,
      type: "job",
      read: false,
    });
    res.json({ ...updated, totalPrice: numberValue(updated.totalPrice) });
  } catch (error) {
    next(error);
  }
});

router.post("/jobs/:id/review", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id: jobId } = CreateReviewParams.parse({ id: Number(req.params.id) });
    const data = CreateReviewBody.parse(req.body);
    const job = (await db.select().from(jobsTable).where(eq(jobsTable.id, jobId)).limit(1))[0];
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    const handyman = (await db.select().from(handymenTable).where(eq(handymenTable.name, job.handymanName)).limit(1))[0];
    if (!handyman) {
      res.status(404).json({ error: "Handyman not found" });
      return;
    }
    const [review] = await db.insert(reviewsTable).values({
      jobId,
      handymanId: handyman.id,
      rating: data.rating,
      comment: data.comment,
      authorName: "Marta Bekele",
    }).returning();
    const nextReviewCount = handyman.reviewCount + 1;
    const nextRating = ((numberValue(handyman.rating) * handyman.reviewCount) + data.rating) / nextReviewCount;
    await db.update(handymenTable).set({
      reviewCount: nextReviewCount,
      rating: nextRating.toFixed(2),
    }).where(eq(handymenTable.id, handyman.id));
    await db.update(jobsTable).set({ status: "REVIEWED" }).where(eq(jobsTable.id, jobId));
    await db.update(serviceRequestsTable).set({ status: "REVIEWED" }).where(eq(serviceRequestsTable.id, job.requestId));
    res.status(201).json({
      id: review.id,
      jobId: review.jobId,
      rating: review.rating,
      comment: review.comment,
      authorName: review.authorName,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (_req, res, next) => {
  try {
    await ensureSeeded();
    const notifications = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt));
    res.json(notifications.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() })));
  } catch (error) {
    next(error);
  }
});

export default router;
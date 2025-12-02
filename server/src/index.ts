import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { startHeadcountCron } from "./jobs/headcountCron";

const app = express();
const port = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || "dev-secret";
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const defaultTimezone = process.env.TZ || "local";
const normalizeDateOnly = (value?: string) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

type AuthUser = { sub: number; username: string; isAdmin?: boolean; role?: string };

const asyncHandler =
  (fn: express.RequestHandler): express.RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded !== "object" || decoded === null) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const payload: AuthUser = {
      sub: (decoded as any).sub,
      username: (decoded as any).username,
      isAdmin: Boolean((decoded as any).isAdmin),
      role: (decoded as any).role,
    };
    if (typeof payload.sub !== "number" || typeof payload.username !== "string") {
      return res.status(401).json({ error: "Invalid token" });
    }
    (req as any).user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as AuthUser;
  if (!user?.isAdmin) return res.status(403).json({ error: "Admin only" });
  return next();
}

function requireSupervisorOrAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as AuthUser;
  if (user?.isAdmin) return next();
  if (user && (user as any).role === "SUPV") return next();
  return res.status(403).json({ error: "Supervisor or admin only" });
}

async function ensureProjectExists(projectId: number) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) {
    const err: any = new Error("Project not found");
    err.status = 404;
    throw err;
  }
}

type RoleKey = "ENG" | "SUPV";
type PermissionMap = Record<RoleKey, Record<string, boolean>>;

const defaultPermissions: PermissionMap = {
  ENG: {
    "sprint:create": false,
    "sprint:update": false,
    "sprint:delete": false,
    "sprint:report": true,
    "task:create": true,
    "task:update": true,
    "task:assign": false,
    "task:delete": false,
    "resource:manage": false,
  },
  SUPV: {
    "sprint:create": true,
    "sprint:update": true,
    "sprint:delete": true,
    "sprint:report": true,
    "task:create": true,
    "task:update": true,
    "task:assign": true,
    "task:delete": true,
    "resource:manage": true,
  },
};

let rolePermissions: PermissionMap = { ...defaultPermissions };

async function loadPermissions() {
  const setting = await prisma.permissionSetting.findUnique({ where: { key: "role_permissions" } });
  if (setting && setting.value) {
    rolePermissions = { ...defaultPermissions, ...(setting.value as PermissionMap) };
  }
}

async function savePermissions(next: PermissionMap) {
  rolePermissions = next;
  await prisma.permissionSetting.upsert({
    where: { key: "role_permissions" },
    create: { key: "role_permissions", value: next },
    update: { value: next },
  });
}

function can(user: AuthUser, action: string) {
  if (user.isAdmin) return true;
  const roleKey: RoleKey = user.role === "SUPV" ? "SUPV" : "ENG";
  return Boolean(rolePermissions[roleKey]?.[action]);
}

// Ensure admin user exists
(async () => {
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!admin) {
    const passwordHash = await bcrypt.hash("admin", 10);
    await prisma.user.create({
      data: { username: "admin", passwordHash, isAdmin: true },
    });
    console.log("Admin user created with username=admin, password=admin");
  }
  await loadPermissions();
})();

// Start cron after initial bootstrap
startHeadcountCron();

app.get(
  "/",
  asyncHandler((_req, res) => {
    res.json({ ok: true, message: "API healthy" });
  })
);

// Auth (username only)
app.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password are required" });
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(409).json({ error: "Username already in use" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash, isAdmin: false },
      select: { id: true, username: true, isAdmin: true, role: true, status: true },
    });
    res.json(user);
  })
);

app.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password are required" });
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ sub: user.id, username: user.username, isAdmin: user.isAdmin, role: user.role }, jwtSecret, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin, role: user.role, status: user.status } });
  })
);

// Create user with default password (admin only)
app.post(
  "/users",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(409).json({ error: "Username already in use" });
    const passwordHash = await bcrypt.hash("123456", 10);
    const user = await prisma.user.create({
      data: { username, passwordHash, isAdmin: false },
      select: { id: true, username: true, isAdmin: true, role: true, status: true },
    });
    res.json({ ...user, defaultPassword: "123456" });
  })
);

// Change password for current user
app.post(
  "/auth/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "currentPassword and newPassword are required" });
    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) return res.status(404).json({ error: "User not found" });
    const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.sub }, data: { passwordHash } });
    res.json({ ok: true });
  })
);

// Projects
app.get(
  "/projects",
  requireAuth,
  asyncHandler(async (_req, res) => {
    // Single-team model: everyone can see all projects
    const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
    res.json(projects);
  })
);

app.post(
  "/projects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const { name, key, description } = req.body;
    if (!name || !key) return res.status(400).json({ error: "name and key are required" });
    const existingKey = await prisma.project.findUnique({ where: { key } });
    if (existingKey) return res.status(409).json({ error: "project key already exists" });
    const project = await prisma.project.create({
      data: { name, key, description, ownerId: user.sub },
    });
    res.json(project);
  })
);

// Sprints
app.get(
  "/projects/:projectId/sprints",
  requireAuth,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    await ensureProjectExists(projectId);
    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    res.json(sprints);
  })
);

app.post(
  "/projects/:projectId/sprints",
  requireAuth,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    await ensureProjectExists(projectId);
    const user = (req as any).user as AuthUser;
    if (!can(user, "sprint:create")) return res.status(403).json({ error: "Forbidden" });
    const { name, startDate, endDate } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const sprint = await prisma.sprint.create({
      data: {
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        projectId,
      },
    });
    res.json(sprint);
  })
);

app.put(
  "/sprints/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const sprintId = Number(req.params.id);
    const existing = await prisma.sprint.findUnique({ where: { id: sprintId }, select: { projectId: true } });
    if (!existing) return res.status(404).json({ error: "Sprint not found" });
    await ensureProjectExists(existing.projectId);
    if (!can(user, "sprint:update")) return res.status(403).json({ error: "Forbidden" });
    const { name, startDate, endDate } = req.body;
    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        name,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      },
    });
    res.json(sprint);
  })
);

app.delete(
  "/sprints/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const sprintId = Number(req.params.id);
    const existing = await prisma.sprint.findUnique({ where: { id: sprintId }, select: { projectId: true } });
    if (!existing) return res.status(404).json({ error: "Sprint not found" });
    await ensureProjectExists(existing.projectId);
    if (!can(user, "sprint:delete")) return res.status(403).json({ error: "Forbidden" });
    await prisma.task.updateMany({ where: { sprintId }, data: { sprintId: null } });
    await prisma.sprint.delete({ where: { id: sprintId } });
    res.json({ ok: true });
  })
);

// Tasks
app.get(
  "/tasks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
      },
      include: {
        assignee: { select: { id: true, username: true } },
        createdBy: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  })
);

app.post(
  "/tasks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const { title, description, projectId, assigneeId, status, priority, dueDate, sprintId, startDate, completeDate, completionPercent, comments, assignedResourceIds, estimatedHours, actualHours } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: "title and projectId are required" });
    await ensureProjectExists(Number(projectId));
    if (!can(user, "task:create")) return res.status(403).json({ error: "Forbidden" });
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId: Number(projectId),
        assigneeId: assigneeId ? Number(assigneeId) : null,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        sprintId: sprintId ? Number(sprintId) : null,
        startDate: startDate ? new Date(startDate) : null,
        completeDate: completeDate ? new Date(completeDate) : null,
        completionPercent: typeof completionPercent === "number" ? completionPercent : 0,
        notes: comments || null,
        assignedResourceIds: Array.isArray(assignedResourceIds) ? assignedResourceIds.map(String) : [],
        estimatedHours: typeof estimatedHours === "number" ? estimatedHours : 0,
        actualHours: typeof actualHours === "number" ? actualHours : 0,
        createdById: user.sub,
      },
    });
    // Log scope creation
    const scopeDelta = typeof estimatedHours === "number" && estimatedHours > 0 ? estimatedHours : 1;
    await prisma.taskScopeLog.create({
      data: {
        taskId: task.id,
        date: new Date(),
        deltaHours: scopeDelta,
        createdById: user.sub,
      },
    });
    res.json(task);
  })
);

app.put(
  "/tasks/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const { id } = req.params;
    const { title, description, projectId, assigneeId, status, priority, orderIndex, dueDate, sprintId, startDate, completeDate, completionPercent, comments, assignedResourceIds, estimatedHours, actualHours } = req.body;
    const existing = await prisma.task.findUnique({
      where: { id: Number(id) },
      select: { projectId: true, sprintId: true, createdById: true, assignedResourceIds: true },
    });
    if (!existing) return res.status(404).json({ error: "Task not found" });
    await ensureProjectExists(existing.projectId);
    const isSupervisor = user.isAdmin || (user as any).role === "SUPV";
    if (!isSupervisor) {
      const canEdit =
        existing.createdById === user.sub ||
        (Array.isArray(existing.assignedResourceIds) && existing.assignedResourceIds.map(String).includes(String(user.sub)));
      if (!canEdit || !can(user, "task:update")) return res.status(403).json({ error: "Forbidden" });
      if ((req.body.assigneeId !== undefined || req.body.assignedResourceIds !== undefined) && !can(user, "task:assign")) {
        return res.status(403).json({ error: "Forbidden: cannot change assignees" });
      }
    } else {
      if ((req.body.assigneeId !== undefined || req.body.assignedResourceIds !== undefined) && !can(user, "task:assign")) {
        return res.status(403).json({ error: "Forbidden: cannot change assignees" });
      }
    }
    const existingTask = await prisma.task.findUnique({ where: { id: Number(id) }, select: { estimatedHours: true } });
    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        projectId: projectId ? Number(projectId) : undefined,
        assigneeId: assigneeId !== undefined ? Number(assigneeId) : undefined,
        status,
        priority,
        orderIndex,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        sprintId: sprintId !== undefined ? (sprintId ? Number(sprintId) : null) : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        completeDate: completeDate !== undefined ? (completeDate ? new Date(completeDate) : null) : undefined,
        completionPercent: completionPercent !== undefined ? completionPercent : undefined,
        notes: comments !== undefined ? comments : undefined,
        assignedResourceIds: assignedResourceIds !== undefined ? (Array.isArray(assignedResourceIds) ? assignedResourceIds.map(String) : []) : undefined,
        estimatedHours: estimatedHours !== undefined ? estimatedHours : undefined,
        actualHours: actualHours !== undefined ? actualHours : undefined,
      },
    });
    if (estimatedHours !== undefined && existingTask) {
      const delta = estimatedHours - existingTask.estimatedHours;
      if (delta !== 0) {
        await prisma.taskScopeLog.create({
          data: {
            taskId: task.id,
            date: new Date(),
            deltaHours: delta,
            createdById: user.sub,
          },
        });
      }
    }
    res.json(task);
  })
);

app.delete(
  "/tasks/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const { id } = req.params;
    const existing = await prisma.task.findUnique({
      where: { id: Number(id) },
      select: { projectId: true, createdById: true },
    });
    if (!existing) return res.status(404).json({ error: "Task not found" });
    await ensureProjectExists(existing.projectId);
    if (!can(user, "task:delete")) return res.status(403).json({ error: "Forbidden: cannot delete task" });
    await prisma.task.delete({ where: { id: Number(id) } });
    res.json({ ok: true });
  })
);

// Comments
app.get(
  "/tasks/:id/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
    if (!task) return res.status(404).json({ error: "Task not found" });
    await ensureProjectExists(task.projectId);
    const comments = await prisma.comment.findMany({
      where: { taskId: Number(id) },
      include: { author: { select: { id: true, username: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(comments);
  })
);

app.post(
  "/tasks/:id/log-hours",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    if (!can(user, "task:update")) return res.status(403).json({ error: "Forbidden" });
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid task id" });
    const { date, hours } = req.body || {};
    const numericHours = Number(hours);
    if (!date || Number.isNaN(new Date(date).getTime())) return res.status(400).json({ error: "Invalid date" });
    if (Number.isNaN(numericHours) || numericHours < 0) return res.status(400).json({ error: "hours must be >= 0" });

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const day = new Date(date);
    const normalizedDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());

    // Upsert log (set absolute hours for that date so user can edit corrections)
    await prisma.taskActualLog.upsert({
      where: { task_actual_log_task_date: { taskId: id, date: normalizedDate } },
      update: { hours: numericHours, createdById: user.sub },
      create: { taskId: id, date: normalizedDate, hours: numericHours, createdById: user.sub },
    });

    const total = await prisma.taskActualLog.aggregate({
      where: { taskId: id },
      _sum: { hours: true },
    });
    const totalHours = total._sum.hours || 0;

    const updated = await prisma.task.update({
      where: { id },
      data: { actualHours: totalHours },
    });
    res.json(updated);
  })
);

app.get(
  "/tasks/:id/log-hours",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const dateParam = String(req.query.date || "");
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid task id" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return res.status(400).json({ error: "date must be YYYY-MM-DD" });
    const task = await prisma.task.findUnique({ where: { id }, select: { id: true } });
    if (!task) return res.status(404).json({ error: "Task not found" });
    const d = new Date(dateParam);
    const normalizedDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const log = await prisma.taskActualLog.findUnique({
      where: { task_actual_log_task_date: { taskId: id, date: normalizedDate } },
    });
    res.json({ date: normalizedDate.toISOString().split("T")[0], hours: log?.hours ?? 0 });
  })
);

app.get(
  "/reports/actual-hours",
  requireAuth,
  asyncHandler(async (req, res) => {
    const monthParam = String(req.query.month || "");
    if (!/^\d{4}-\d{2}$/.test(monthParam)) {
      return res.status(400).json({ error: "month must be YYYY-MM" });
    }
    const [year, month] = monthParam.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const dayCount = new Date(year, month, 0).getDate();
    const labels = Array.from({ length: dayCount }, (_, i) => `${String(month).padStart(2, "0")}/${String(i + 1).padStart(2, "0")}`);

    const logs = await prisma.taskActualLog.findMany({
      where: { date: { gte: start, lt: end } },
      select: { date: true, hours: true },
    });

    const map = new Map<number, number>(); // day -> sum
    logs.forEach(log => {
      const d = log.date.getDate();
      map.set(d, (map.get(d) || 0) + log.hours);
    });
    const completedByDay = Array.from({ length: dayCount }, (_, i) => map.get(i + 1) || 0);

    res.json({ labels, completedByDay });
  })
);

app.get(
  "/reports/daily",
  requireAuth,
  asyncHandler(async (req, res) => {
    const dateParam = String(req.query.date || "");
    const normalized = normalizeDateOnly(dateParam);
    if (!normalized) return res.status(400).json({ error: "date must be YYYY-MM-DD" });

    const snapshot = await prisma.dailyReportSnapshot.findUnique({
      where: { date: normalized },
    });
    if (!snapshot) return res.json({ date: normalized.toISOString().split("T")[0], reportTasks: [], nextdayTasks: [], generatedById: null, createdAt: null });
    res.json({
      date: snapshot.date.toISOString().split("T")[0],
      reportTasks: snapshot.reportTasks,
      nextdayTasks: snapshot.nextdayTasks,
      generatedById: snapshot.generatedById,
      createdAt: snapshot.createdAt,
    });
  })
);

app.post(
  "/reports/daily/generate",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const dateParam = req.body?.date || req.query?.date || undefined;
    const targetDate = normalizeDateOnly(dateParam);
    if (!targetDate) return res.status(400).json({ error: "date must be YYYY-MM-DD" });

    const prevDate = new Date(targetDate);
    prevDate.setDate(prevDate.getDate() - 1);

    const prev = await prisma.dailyReportSnapshot.findUnique({
      where: { date: prevDate },
      select: { nextdayTasks: true },
    });
    const prevNextday = Array.isArray(prev?.nextdayTasks) ? prev?.nextdayTasks as any[] : [];

    const activeTasks = await prisma.task.findMany({
      where: { status: { in: ["IN_PROGRESS", "REVIEW"] } },
      select: { id: true, title: true, description: true, completionPercent: true, assignedResourceIds: true, priority: true },
    });

    const mapTask = (t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      completionPercent: typeof t.completionPercent === "number" ? t.completionPercent : 0,
      priority: t.priority || "MEDIUM",
      assignedResourceIds: Array.isArray(t.assignedResourceIds) ? t.assignedResourceIds : [],
    });

    const currentSnapshot = activeTasks.map(mapTask);
    const nextdaySnapshot = activeTasks.map(t => ({ ...mapTask(t), completionPercent: null }));
    const prevIds = new Set((prevNextday as any[]).map((t: any) => String(t.id)));
    const reportTasks = [
      ...prevNextday,
      ...currentSnapshot.filter(t => !prevIds.has(String(t.id))),
    ];

    const saved = await prisma.dailyReportSnapshot.upsert({
      where: { date: targetDate },
      update: { reportTasks, nextdayTasks: nextdaySnapshot, generatedById: user.sub },
      create: { date: targetDate, reportTasks, nextdayTasks: nextdaySnapshot, generatedById: user.sub },
    });

    res.json({
      date: saved.date.toISOString().split("T")[0],
      reportTasks: saved.reportTasks,
      nextdayTasks: saved.nextdayTasks,
      generatedById: saved.generatedById,
      createdAt: saved.createdAt,
    });
  })
);

app.get(
  "/reports/scope",
  requireAuth,
  asyncHandler(async (req, res) => {
    const monthParam = String(req.query.month || "");
    if (!/^\d{4}-\d{2}$/.test(monthParam)) {
      return res.status(400).json({ error: "month must be YYYY-MM" });
    }
    const [year, month] = monthParam.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const dayCount = new Date(year, month, 0).getDate();
    const labels = Array.from({ length: dayCount }, (_, i) => `${String(month).padStart(2, "0")}/${String(i + 1).padStart(2, "0")}`);

    const baseLogs = await prisma.taskScopeLog.groupBy({
      by: ["taskId"],
      _sum: { deltaHours: true },
      where: { date: { lt: start } },
    });
    const baseScope = baseLogs.reduce((acc, l) => acc + (l._sum.deltaHours || 0), 0);

    const logs = await prisma.taskScopeLog.findMany({
      where: { date: { gte: start, lt: end } },
      select: { date: true, deltaHours: true },
    });

    const deltaByDay = new Map<number, number>();
    logs.forEach(log => {
      const d = log.date.getDate();
      deltaByDay.set(d, (deltaByDay.get(d) || 0) + log.deltaHours);
    });

    const scopeByDay: number[] = [];
    let current = baseScope;
    const changes: Array<{ day: string; value: number; delta: number }> = [];
    for (let i = 1; i <= dayCount; i++) {
      if (deltaByDay.has(i)) {
        const delta = deltaByDay.get(i)!;
        current += delta;
        changes.push({ day: labels[i - 1], value: current, delta });
      }
      scopeByDay.push(current);
    }

    res.json({ labels, scopeByDay, changes });
  })
);

app.post(
  "/tasks/:id/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const { id } = req.params;
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: "body is required" });
    const task = await prisma.task.findUnique({ where: { id: Number(id) }, select: { projectId: true } });
    if (!task) return res.status(404).json({ error: "Task not found" });
    await ensureProjectExists(task.projectId);
    const comment = await prisma.comment.create({
      data: { body, taskId: Number(id), authorId: user.sub },
    });
    res.json(comment);
  })
);

// Resources (now users)
app.get(
  "/resources",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role, status: u.status, site: u.site, isAdmin: u.isAdmin })));
  })
);

app.post(
  "/resources",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    if (!can(user, "resource:manage")) return res.status(403).json({ error: "Forbidden" });
    const { username, role, status, site } = req.body;
    if (!username) return res.status(400).json({ error: "username is required" });
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(409).json({ error: "username already in use" });
    const passwordHash = await bcrypt.hash("123456", 10);
    const created = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role === "SUPV" ? "SUPV" : "ENG",
        status: status === "OFF_DUTY" ? "OFF_DUTY" : "ON_DUTY",
        site: site === "MT1" ? "MT1" : "PQP_HT",
      },
    });
    res.json({ id: created.id, username: created.username, role: created.role, status: created.status, site: created.site, isAdmin: created.isAdmin });
  })
);

app.put(
  "/resources/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    if (!can(user, "resource:manage")) return res.status(403).json({ error: "Forbidden" });
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "User not found" });
    const { role, status, site } = req.body;
    const roleValue = role === undefined ? undefined : role === "SUPV" ? "SUPV" : role === "ENG" ? "ENG" : null;
    if (roleValue === null) return res.status(400).json({ error: "role must be SUPV or ENG" });
    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: roleValue,
        status: status === "OFF_DUTY" ? "OFF_DUTY" : status === "ON_DUTY" ? "ON_DUTY" : undefined,
        site: site === undefined ? undefined : site === "MT1" ? "MT1" : "PQP_HT",
      },
    });
    res.json({ id: updated.id, username: updated.username, role: updated.role, status: updated.status, site: updated.site, isAdmin: updated.isAdmin });
  })
);

app.delete(
  "/resources/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    if (!can(user, "resource:manage")) return res.status(403).json({ error: "Forbidden" });
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "User not found" });
    await prisma.user.delete({ where: { id } });
    await prisma.task.updateMany({
      where: { assignedResourceIds: { has: String(id) } },
      data: { assignedResourceIds: { set: [] } },
    });
    res.json({ ok: true });
  })
);

// Permissions (role-based, admin only)
app.get(
  "/permissions",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json(rolePermissions);
  })
);

app.put(
  "/permissions",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const incoming = req.body as PermissionMap;
    const roles: RoleKey[] = ["ENG", "SUPV"];
    const actions = Object.keys(defaultPermissions.ENG);
    const next: PermissionMap = { ...defaultPermissions };
    roles.forEach(role => {
      actions.forEach(action => {
        const val = (incoming as any)?.[role]?.[action];
        next[role][action] = typeof val === "boolean" ? val : defaultPermissions[role][action];
      });
    });
    await savePermissions(next);
    res.json(next);
  })
);

// Reports: headcount variation by month
app.get(
  "/reports/headcount",
  requireAuth,
  asyncHandler(async (req, res) => {
    const monthParam = String(req.query.month || "");
    if (!/^\d{4}-\d{2}$/.test(monthParam)) {
      return res.status(400).json({ error: "month must be YYYY-MM" });
    }
    const [year, month] = monthParam.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    const rows = await prisma.dailyHeadcount.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    });

    const labels = Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return `${year}-${String(month).padStart(2, "0")}-${day}`;
    });

    const sites: Array<"PQP_HT" | "MT1"> = ["PQP_HT", "MT1"];
    const siteSeries = sites.map((site) => {
      const map = new Map<string, number>();
      rows
        .filter((r) => r.site === site)
        .forEach((r) => {
          const key = r.date.toISOString().slice(0, 10);
          map.set(key, r.onDutyCount);
        });
      const series = labels.map((l) => map.get(l) ?? 0);
      return { site, series };
    });

    res.json({ labels, sites: siteSeries });
  })
);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});

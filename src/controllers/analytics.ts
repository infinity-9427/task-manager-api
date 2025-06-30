import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../utils/auth.js';

const prisma = new PrismaClient();

/**
 * Get user dashboard analytics
 */
export const getUserDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const userId = req.user.id;
    const { period = 'week' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }

    // Get task statistics
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      tasksByPriority,
      recentTasks,
      taskCompletionTrend
    ] = await Promise.all([
      // Total tasks assigned to user
      prisma.task.count({
        where: { assignedToId: userId }
      }),

      // Completed tasks
      prisma.task.count({
        where: {
          assignedToId: userId,
          status: 'COMPLETED'
        }
      }),

      // Pending tasks
      prisma.task.count({
        where: {
          assignedToId: userId,
          status: 'PENDING'
        }
      }),

      // In progress tasks
      prisma.task.count({
        where: {
          assignedToId: userId,
          status: 'IN_PROGRESS'
        }
      }),

      // Overdue tasks
      prisma.task.count({
        where: {
          assignedToId: userId,
          dueDate: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        }
      }),

      // Tasks by priority
      prisma.task.groupBy({
        by: ['priority'],
        where: { assignedToId: userId },
        _count: { id: true }
      }),

      // Recent tasks (last 10)
      prisma.task.findMany({
        where: { assignedToId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          project: {
            select: { id: true, name: true }
          },
          assignedTo: {
            select: { id: true, username: true, firstName: true, lastName: true }
          }
        }
      }),

      // Task completion trend for the period
      prisma.task.groupBy({
        by: ['completedAt'],
        where: {
          assignedToId: userId,
          status: 'COMPLETED',
          completedAt: {
            gte: startDate,
            lte: now
          }
        },
        _count: { id: true }
      })
    ]);

    // Get time tracking data
    const timeEntries = await prisma.timeEntry.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      _sum: { durationMinutes: true },
      _count: { id: true }
    });

    // Get project participation
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { tasks: { some: { assignedToId: userId } } }
        ]
      },
      select: {
        id: true,
        name: true,
        status: true,
        _count: {
          select: {
            tasks: {
              where: { assignedToId: userId }
            }
          }
        }
      },
      take: 5
    });

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const dashboard = {
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: Math.round(completionRate * 100) / 100
      },
      tasksByPriority: tasksByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      timeTracking: {
        totalMinutes: timeEntries._sum.durationMinutes || 0,
        totalEntries: timeEntries._count
      },
      recentTasks,
      projects: userProjects,
      trends: {
        taskCompletion: taskCompletionTrend,
        period
      }
    };

    res.json({ dashboard });
  } catch (err) {
    next(err);
  }
};

/**
 * Get admin dashboard with system-wide analytics
 */
export const getAdminDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Get comprehensive system statistics
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      userGrowth,
      tasksByStatus,
      tasksByPriority,
      projectsByStatus,
      topPerformers,
      systemActivity
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          lastSeen: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Total projects
      prisma.project.count(),

      // Active projects
      prisma.project.count({
        where: { status: 'ACTIVE' }
      }),

      // Total tasks
      prisma.task.count(),

      // Completed tasks in period
      prisma.task.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: startDate,
            lte: now
          }
        }
      }),

      // Overdue tasks
      prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        }
      }),

      // User growth trend
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        _count: { id: true }
      }),

      // Tasks by status
      prisma.task.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // Tasks by priority
      prisma.task.groupBy({
        by: ['priority'],
        _count: { id: true }
      }),

      // Projects by status
      prisma.project.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // Top performing users (by completed tasks)
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          _count: {
            select: {
              assignedTasks: {
                where: {
                  status: 'COMPLETED',
                  completedAt: {
                    gte: startDate,
                    lte: now
                  }
                }
              }
            }
          }
        },
        orderBy: {
          assignedTasks: {
            _count: 'desc'
          }
        },
        take: 10
      }),

      // Recent system activity
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: {
            select: { id: true, username: true, firstName: true, lastName: true }
          }
        }
      })
    ]);

    // Calculate system health metrics
    const totalTasksCreated = await prisma.task.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      }
    });

    const completionRate = totalTasksCreated > 0 ? (completedTasks / totalTasksCreated) * 100 : 0;

    const dashboard = {
      overview: {
        totalUsers,
        activeUsers,
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: Math.round(completionRate * 100) / 100
      },
      analytics: {
        tasksByStatus: tasksByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        tasksByPriority: tasksByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        projectsByStatus: projectsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      trends: {
        userGrowth,
        period
      },
      topPerformers: topPerformers.map(user => ({
        ...user,
        completedTasks: user._count.assignedTasks
      })),
      recentActivity: systemActivity
    };

    res.json({ dashboard });
  } catch (err) {
    next(err);
  }
};

/**
 * Get task analytics for a specific project (for project managers)
 */
export const getProjectAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const projectId = parseInt(req.params.projectId);
    const { period = 'month' } = req.query;

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: req.user.id },
          { isPublic: true },
          { tasks: { some: { assignedToId: req.user.id } } }
        ]
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found or access denied' });
      return;
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Get project analytics
    const [
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      teamMembers,
      timeTracking,
      taskCompletion
    ] = await Promise.all([
      // Total tasks in project
      prisma.task.count({
        where: { projectId }
      }),

      // Tasks by status
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true }
      }),

      // Tasks by priority
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { id: true }
      }),

      // Team members and their task counts
      prisma.user.findMany({
        where: {
          assignedTasks: {
            some: { projectId }
          }
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          _count: {
            select: {
              assignedTasks: {
                where: { projectId }
              }
            }
          }
        }
      }),

      // Time tracking for project
      prisma.timeEntry.aggregate({
        where: {
          task: { projectId },
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        _sum: { durationMinutes: true },
        _count: { id: true }
      }),

      // Task completion trend
      prisma.task.groupBy({
        by: ['completedAt'],
        where: {
          projectId,
          status: 'COMPLETED',
          completedAt: {
            gte: startDate,
            lte: now
          }
        },
        _count: { id: true }
      })
    ]);

    const analytics = {
      project: {
        id: project.id,
        name: project.name,
        status: project.status
      },
      overview: {
        totalTasks,
        totalTimeSpentMinutes: timeTracking._sum.durationMinutes || 0,
        totalTimeEntries: timeTracking._count
      },
      analytics: {
        tasksByStatus: tasksByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        tasksByPriority: tasksByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      teamMembers: teamMembers.map(member => ({
        ...member,
        taskCount: member._count.assignedTasks
      })),
      trends: {
        taskCompletion,
        period
      }
    };

    res.json({ analytics });
  } catch (err) {
    next(err);
  }
};

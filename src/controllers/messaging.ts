import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

const createConversationSchema = Joi.object({
  type: Joi.string().valid('DIRECT', 'GROUP', 'GENERAL').required(),
  name: Joi.string().trim().max(100).when('type', {
    is: Joi.string().valid('GROUP', 'GENERAL'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  description: Joi.string().trim().max(500).optional(),
  participantIds: Joi.array().items(Joi.number().positive()).min(1).required()
});

const sendMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  messageType: Joi.string().valid('TEXT', 'IMAGE', 'FILE', 'SYSTEM').default('TEXT'),
  mentions: Joi.array().items(Joi.number().positive()).optional(),
  parentMessageId: Joi.number().positive().optional()
});

/**
 * Create a new conversation
 */
export const createConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { error, value } = createConversationSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { type, name, description, participantIds } = value;

    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([req.user.id, ...participantIds])];

    // Verify all participants exist
    const participants = await prisma.user.findMany({
      where: { id: { in: allParticipantIds } },
      select: { id: true }
    });

    if (participants.length !== allParticipantIds.length) {
      res.status(400).json({ error: 'One or more participants not found' });
      return;
    }

    // For direct conversations, check if one already exists
    if (type === 'DIRECT' && allParticipantIds.length === 2) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: { in: allParticipantIds }
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      if (existingConversation) {
        res.json({ conversation: existingConversation });
        return;
      }
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        type,
        name,
        createdById: req.user.id,
        participants: {
          create: allParticipantIds.map(userId => ({
            userId,
            joinedAt: new Date()
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user's conversations
 */
export const getUserConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: req.user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    });

    // Get unread message counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: req.user!.id },
            readStatus: {
              none: {
                userId: req.user!.id,
                readAt: { not: null }
              }
            }
          }
        });

        return {
          ...conversation,
          unreadCount,
          lastMessage: conversation.messages[0] || null
        };
      })
    );

    res.json({ conversations: conversationsWithUnread });
  } catch (err) {
    next(err);
  }
};

/**
 * Get conversation messages
 */
export const getConversationMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const conversationId = parseInt(req.params.conversationId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: req.user.id
      }
    });

    if (!participant) {
      res.status(403).json({ error: 'Access denied to this conversation' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        parentMessage: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        readStatus: {
          where: { userId: req.user.id },
          select: { readAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Mark messages as read
    const messageIds = messages
      .filter(msg => msg.senderId !== req.user!.id)
      .map(msg => msg.id);

    if (messageIds.length > 0) {
      await prisma.messageReadStatus.createMany({
        data: messageIds.map(messageId => ({
          messageId,
          userId: req.user!.id,
          readAt: new Date()
        })),
        skipDuplicates: true
      });
    }

    res.json({ messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

/**
 * Send a message to a conversation
 */
export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const conversationId = parseInt(req.params.conversationId);
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { content, messageType, mentions, parentMessageId } = value;

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: req.user.id
      }
    });

    if (!participant) {
      res.status(403).json({ error: 'Access denied to this conversation' });
      return;
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.user.id,
        content,
        messageType,
        mentions: mentions || [],
        parentMessageId
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        parentMessage: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Update conversation last activity
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Create notifications for mentioned users
    if (mentions && mentions.length > 0) {
      const mentionNotifications = mentions
        .filter((userId: number) => userId !== req.user!.id)
        .map((userId: number) => ({
          userId,
          type: 'TASK_MENTIONED' as const,
          title: 'You were mentioned',
          content: `${req.user!.firstName || req.user!.username} mentioned you in a message`,
          data: {
            conversationId,
            messageId: message.id
          }
        }));

      if (mentionNotifications.length > 0) {
        await prisma.notification.createMany({
          data: mentionNotifications
        });
      }
    }

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

/**
 * Leave a conversation
 */
export const leaveConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const conversationId = parseInt(req.params.conversationId);

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: req.user.id
      }
    });

    if (!participant) {
      res.status(404).json({ error: 'Not a participant in this conversation' });
      return;
    }

    // Remove participant
    await prisma.conversationParticipant.delete({
      where: {
        id: participant.id
      }
    });

    res.json({ message: 'Left conversation successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Add participants to a conversation
 */
export const addParticipants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const conversationId = parseInt(req.params.conversationId);
    const { participantIds } = req.body;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      res.status(400).json({ error: 'Participant IDs array is required' });
      return;
    }

    // Verify conversation exists and user has permission
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { createdById: req.user.id },
          { 
            participants: {
              some: { userId: req.user.id }
            }
          }
        ]
      }
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found or access denied' });
      return;
    }

    // Don't allow adding to direct conversations
    if (conversation.type === 'DIRECT') {
      res.status(400).json({ error: 'Cannot add participants to direct conversations' });
      return;
    }

    // Verify participants exist
    const users = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true }
    });

    if (users.length !== participantIds.length) {
      res.status(400).json({ error: 'One or more users not found' });
      return;
    }

    // Add participants
    await prisma.conversationParticipant.createMany({
      data: participantIds.map((userId: number) => ({
        conversationId,
        userId,
        joinedAt: new Date()
      })),
      skipDuplicates: true
    });

    res.json({ message: 'Participants added successfully' });
  } catch (err) {
    next(err);
  }
};

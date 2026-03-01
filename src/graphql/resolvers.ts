import prisma from '../lib/prisma';
import { comparePassword, generateToken, hashPassword, AuthUser } from '../lib/auth';
import { UserInputError } from 'apollo-server-express';
import {
  requireAuth,
  requireRole,
  requireOwnerOrManager,
} from '../lib/permissions';
import {
  validateEmail,
  validatePassword,
  validateRole,
  validateQuantity,
  validatePaymentType,
  validateLastFour,
} from '../lib/validation';
import { logger } from '../lib/logger';

interface Context {
  user: AuthUser | null;
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, { user }: Context) => {
      if (!user) return null;
      return prisma.user.findUnique({
        where: { id: user.id },
        include: { country: true },
      });
    },

    countries: async () => {
      return prisma.country.findMany({ orderBy: { name: 'asc' } });
    },

    restaurants: async (
      _: unknown,
      { page = 1, pageSize = 20 }: { page?: number; pageSize?: number },
      { user }: Context
    ) => {
      requireAuth(user);
      const skip = (page - 1) * pageSize;
      // Country isolation enforced at Prisma query level
      return prisma.restaurant.findMany({
        where: { countryId: user.countryId },
        include: { menuItems: true },
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
      });
    },

    restaurant: async (
      _: unknown,
      { id }: { id: string },
      { user }: Context
    ) => {
      requireAuth(user);
      // Country isolation enforced at Prisma query level
      const restaurant = await prisma.restaurant.findFirst({
        where: { id, countryId: user.countryId },
        include: { menuItems: true },
      });
      if (!restaurant) {
        throw new UserInputError('Restaurant not found or outside your country');
      }
      return restaurant;
    },

    orders: async (
      _: unknown,
      { status }: { status?: string },
      { user }: Context
    ) => {
      requireAuth(user);
      const statusFilter = status ? { status } : {};

      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        // Country isolation at Prisma query level
        return prisma.order.findMany({
          where: { countryId: user.countryId, deletedAt: null, ...statusFilter },
          include: { items: { include: { menuItem: true } } },
          orderBy: { createdAt: 'desc' },
        });
      }

      // Members only see their own orders (country isolation also enforced)
      return prisma.order.findMany({
        where: { userId: user.id, countryId: user.countryId, deletedAt: null, ...statusFilter },
        include: { items: { include: { menuItem: true } } },
        orderBy: { createdAt: 'desc' },
      });
    },

    paymentMethods: async (
      _: unknown,
      __: unknown,
      { user }: Context
    ) => {
      requireAuth(user);
      requireRole(user, 'ADMIN');
      return prisma.paymentMethod.findMany({
        where: { userId: user.id },
      });
    },

    auditLogs: async (
      _: unknown,
      __: unknown,
      { user }: Context
    ) => {
      requireAuth(user);
      requireRole(user, 'ADMIN');
      return prisma.auditLog.findMany({
        where: { countryId: user.countryId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    },
  },

  Mutation: {
    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      validateEmail(email);
      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: { country: true },
      });
      if (!user) throw new UserInputError('Invalid credentials');

      const valid = await comparePassword(password, user.password);
      if (!valid) throw new UserInputError('Invalid credentials');

      logger.info('User logged in', { userId: user.id, role: user.role });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        countryId: user.countryId,
      });

      return { token, user };
    },

    register: async (
      _: unknown,
      { email, password, role, countryId }: { email: string; password: string; role: string; countryId: string }
    ) => {
      validateEmail(email);
      validatePassword(password);
      validateRole(role);

      const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (existing) throw new UserInputError('Email already in use');

      const country = await prisma.country.findUnique({ where: { id: countryId } });
      if (!country) throw new UserInputError('Invalid country');

      const hashed = await hashPassword(password);
      const user = await prisma.user.create({
        data: { email: email.trim().toLowerCase(), password: hashed, role, countryId },
        include: { country: true },
      });

      logger.info('User registered', { userId: user.id, role: user.role, countryId });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        countryId: user.countryId,
      });

      return { token, user };
    },

    createOrder: async (
      _: unknown,
      { restaurantId, items }: { restaurantId: string; items: { menuItemId: string; quantity: number }[] },
      { user }: Context
    ) => {
      requireAuth(user);

      if (!items || items.length === 0) {
        throw new UserInputError('Order must contain at least one item');
      }

      for (const item of items) {
        validateQuantity(item.quantity);
      }

      // Country isolation at Prisma query level
      const restaurant = await prisma.restaurant.findFirst({
        where: { id: restaurantId, countryId: user.countryId },
      });
      if (!restaurant) {
        throw new UserInputError('Restaurant not found or outside your country');
      }

      let total = 0;
      const orderItemsData = [];
      for (const item of items) {
        // Ensure menu item belongs to the restaurant in user's country
        const menuItem = await prisma.menuItem.findFirst({
          where: { id: item.menuItemId, restaurantId: restaurant.id },
        });
        if (!menuItem) throw new UserInputError(`Menu item ${item.menuItemId} not found in this restaurant`);
        total += menuItem.price * item.quantity;
        orderItemsData.push({ menuItemId: item.menuItemId, quantity: item.quantity });
      }

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          countryId: user.countryId,
          totalAmount: total,
          status: 'PENDING',
          items: { create: orderItemsData },
        },
        include: { items: { include: { menuItem: true } } },
      });

      await prisma.auditLog.create({
        data: {
          action: 'CREATE_ORDER',
          userId: user.id,
          countryId: user.countryId,
          resourceId: order.id,
          resourceType: 'Order',
        },
      });

      logger.info('Order created', { orderId: order.id, userId: user.id });
      return order;
    },

    checkoutOrder: async (
      _: unknown,
      { orderId }: { orderId: string },
      { user }: Context
    ) => {
      requireAuth(user);
      requireRole(user, 'ADMIN', 'MANAGER');

      // Country isolation at Prisma query level
      const order = await prisma.order.findFirst({
        where: { id: orderId, countryId: user.countryId, deletedAt: null },
      });
      if (!order) throw new UserInputError('Order not found or outside your country');
      if (order.status !== 'PENDING') throw new UserInputError('Only PENDING orders can be checked out');

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
        include: { items: { include: { menuItem: true } } },
      });

      await prisma.auditLog.create({
        data: {
          action: 'CHECKOUT_ORDER',
          userId: user.id,
          countryId: user.countryId,
          resourceId: orderId,
          resourceType: 'Order',
        },
      });

      logger.info('Order checked out', { orderId, userId: user.id });
      return updated;
    },

    cancelOrder: async (
      _: unknown,
      { orderId }: { orderId: string },
      { user }: Context
    ) => {
      requireAuth(user);

      // Country isolation at Prisma query level
      const order = await prisma.order.findFirst({
        where: { id: orderId, countryId: user.countryId, deletedAt: null },
      });
      if (!order) throw new UserInputError('Order not found or outside your country');
      if (order.status !== 'PENDING') throw new UserInputError('Only PENDING orders can be cancelled');

      // Users can cancel their own orders; managers/admins can cancel any in their country
      requireOwnerOrManager(user, order.userId);

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: { items: { include: { menuItem: true } } },
      });

      await prisma.auditLog.create({
        data: {
          action: 'CANCEL_ORDER',
          userId: user.id,
          countryId: user.countryId,
          resourceId: orderId,
          resourceType: 'Order',
        },
      });

      logger.info('Order cancelled', { orderId, userId: user.id });
      return updated;
    },

    addPaymentMethod: async (
      _: unknown,
      { type, lastFour }: { type: string; lastFour: string },
      { user }: Context
    ) => {
      requireAuth(user);
      requireRole(user, 'ADMIN');
      validatePaymentType(type);
      validateLastFour(lastFour);

      return prisma.paymentMethod.create({
        data: { userId: user.id, type: type.toUpperCase(), lastFour },
      });
    },

    softDeleteOrder: async (
      _: unknown,
      { orderId }: { orderId: string },
      { user }: Context
    ) => {
      requireAuth(user);
      requireRole(user, 'ADMIN');

      const order = await prisma.order.findFirst({
        where: { id: orderId, countryId: user.countryId },
      });
      if (!order) throw new UserInputError('Order not found');

      return prisma.order.update({
        where: { id: orderId },
        data: { deletedAt: new Date() },
        include: { items: { include: { menuItem: true } } },
      });
    },
  },
};

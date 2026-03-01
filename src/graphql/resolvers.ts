import prisma from '../lib/prisma';
import { comparePassword, generateToken } from '../lib/auth';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';

export const resolvers = {
  Query: {
    me: async (_: any, __: any, { user }: any) => {
      if (!user) return null;
      return prisma.user.findUnique({ 
        where: { id: user.id },
        include: { country: true }
      });
    },
    restaurants: async (_: any, __: any, { user }: any) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      // ReBAC: Only see restaurants in their country
      return prisma.restaurant.findMany({
        where: { countryId: user.countryId },
        include: { menuItems: true }
      });
    },
    restaurant: async (_: any, { id }: any, { user }: any) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: { menuItems: true }
      });

      if (!restaurant || restaurant.countryId !== user.countryId) {
        throw new ForbiddenError('Access denied: Restaurant outside your country');
      }

      return restaurant;
    },
    orders: async (_: any, __: any, { user }: any) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      // ReBAC: Admins/Managers see all orders in their country, Members see only their own
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        return prisma.order.findMany({
          where: { countryId: user.countryId },
          include: { items: { include: { menuItem: true } } },
          orderBy: { createdAt: 'desc' }
        });
      }

      return prisma.order.findMany({
        where: { userId: user.id },
        include: { items: { include: { menuItem: true } } },
        orderBy: { createdAt: 'desc' }
      });
    },
    paymentMethods: async (_: any, __: any, { user }: any) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      // RBAC: Only Admin can manage payment methods (viewing here)
      if (user.role !== 'ADMIN') {
        throw new ForbiddenError('Only Admins can manage payment methods');
      }

      return prisma.paymentMethod.findMany({
        where: { userId: user.id }
      });
    }
  },

  Mutation: {
    login: async (_: any, { email, password }: any) => {
      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { country: true }
      });
      if (!user) throw new AuthenticationError('Invalid credentials');

      const valid = await comparePassword(password, user.password);
      if (!valid) throw new AuthenticationError('Invalid credentials');

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        countryId: user.countryId
      });

      return { token, user };
    },

    createOrder: async (_: any, { restaurantId, items }: any, { user }: any) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      // ReBAC: Verify restaurant is in user's country
      const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      if (!restaurant || restaurant.countryId !== user.countryId) {
        throw new ForbiddenError('Cannot order from restaurants outside your country');
      }

      // Calculate total
      let total = 0;
      const orderItemsData = [];
      for (const item of items) {
        const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
        if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
        total += menuItem.price * item.quantity;
        orderItemsData.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        });
      }

      return prisma.order.create({
        data: {
          userId: user.id,
          countryId: user.countryId,
          totalAmount: total,
          status: 'PENDING',
          items: {
            create: orderItemsData
          }
        },
        include: { items: { include: { menuItem: true } } }
      });
    },

    checkoutOrder: async (_: any, { orderId }: any, { user }: any) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      // RBAC: Only Admin and Manager can checkout
      if (user.role === 'MEMBER') {
        throw new ForbiddenError('Members cannot checkout orders');
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.countryId !== user.countryId) {
        throw new ForbiddenError('Order not found or outside your country');
      }

      return prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
        include: { items: { include: { menuItem: true } } }
      });
    },

    cancelOrder: async (_: any, { orderId }: any, { user }: any) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      // RBAC: Only Admin and Manager can cancel
      if (user.role === 'MEMBER') {
        throw new ForbiddenError('Members cannot cancel orders');
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.countryId !== user.countryId) {
        throw new ForbiddenError('Order not found or outside your country');
      }

      return prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: { items: { include: { menuItem: true } } }
      });
    },

    addPaymentMethod: async (_: any, { type, lastFour }: any, { user }: any) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      // RBAC: Only Admin can manage payment methods
      if (user.role !== 'ADMIN') {
        throw new ForbiddenError('Only Admins can manage payment methods');
      }

      return prisma.paymentMethod.create({
        data: {
          userId: user.id,
          type,
          lastFour
        }
      });
    }
  }
};

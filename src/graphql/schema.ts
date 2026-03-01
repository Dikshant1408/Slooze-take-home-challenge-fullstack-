import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Country {
    id: ID!
    name: String!
  }

  type User {
    id: ID!
    email: String!
    role: String!
    countryId: ID!
    country: Country!
  }

  type Restaurant {
    id: ID!
    name: String!
    address: String
    phone: String
    hours: String
    countryId: ID!
    menuItems: [MenuItem!]!
  }

  type MenuItem {
    id: ID!
    name: String!
    price: Float!
    restaurantId: ID!
  }

  type Order {
    id: ID!
    userId: ID!
    countryId: ID!
    status: String!
    totalAmount: Float!
    items: [OrderItem!]!
    createdAt: String!
    deletedAt: String
  }

  type OrderItem {
    id: ID!
    menuItem: MenuItem!
    quantity: Int!
  }

  type PaymentMethod {
    id: ID!
    type: String!
    lastFour: String!
  }

  type AuditLog {
    id: ID!
    action: String!
    userId: String!
    countryId: String!
    resourceId: String!
    resourceType: String!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    countries: [Country!]!
    restaurants(page: Int, pageSize: Int): [Restaurant!]!
    restaurant(id: ID!): Restaurant
    orders(status: String): [Order!]!
    paymentMethods: [PaymentMethod!]!
    auditLogs: [AuditLog!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, role: String!, countryId: ID!): AuthPayload!
    createOrder(restaurantId: ID!, items: [OrderItemInput!]!): Order!
    checkoutOrder(orderId: ID!): Order!
    cancelOrder(orderId: ID!): Order!
    addPaymentMethod(type: String!, lastFour: String!): PaymentMethod!
    softDeleteOrder(orderId: ID!): Order!
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
  }
`;

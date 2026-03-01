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

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    restaurants: [Restaurant!]!
    restaurant(id: ID!): Restaurant
    orders: [Order!]!
    paymentMethods: [PaymentMethod!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    createOrder(restaurantId: ID!, items: [OrderItemInput!]!): Order!
    checkoutOrder(orderId: ID!): Order!
    cancelOrder(orderId: ID!): Order!
    addPaymentMethod(type: String!, lastFour: String!): PaymentMethod!
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
  }
`;

// amplify/data/resource.ts
import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Order: a
    .model({
      customerPhone: a.string(),
      orderDate: a.datetime(),
      status: a.string(),
      totalAmount: a.float(),
      itemsNumber: a.integer(),
      lineItems: a.hasMany('OrderItem', 'orderID'),
    })
    .authorization((allow) => [allow.owner()]),

  OrderItem: a
    .model({
      orderID: a.id().required(),
      itemName: a.string().required(),
      quantity: a.integer().required(),
      unitPrice: a.float().required(),
      order: a.belongsTo('Order', 'orderID'),
    })
    .authorization((allow) => [allow.owner()]),

  Customer: a
    .model({
      phone: a.string().required(),
      customerName: a.string().required(),
      totalOrders: a.integer().required(),
      totalSpent: a.float().required(),
    })
    .identifier(['phone'])
    .authorization((allow) => [allow.owner()]),

  DeliveryAgent: a
    .model({
      name: a.string().required(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Define an enum for the possible states of an order.
const OrderStatusValues = [
  'ORDERED',
  'IN_PREPARATION',
  'PREPARED',
  'DELIVERED',
  'CANCELLED'
] as const;

const schema = a.schema({
  Business: a.model({
    phoneBusiness: a.phone().required(),
    address: a.string().required(),
    description: a.string(),
    logoUrl: a.url(),
    items: a.hasMany('Item', 'businessId'),
    orders: a.hasMany('Order', 'businessId'),
  }).identifier(['phoneBusiness']),

  Customer: a.model({
    phoneCustomer: a.phone().required(),
    name: a.string().required(),
    address: a.string(),
    location: a.string(),
    orders: a.hasMany('Order', 'customerId'),
  }).identifier(['phoneCustomer']),

  Item: a.model({
    name: a.string().required(),
    description: a.string(),
    quantityAvailable: a.integer().required(),
    unitPrice: a.float().required(),
    businessId: a.id().required(),
    business: a.belongsTo('Business', 'businessId'),
    type: a.string().required().default('Item'),
  }).secondaryIndexes((index) => [
    index('type').sortKeys(['quantityAvailable']).name('byAvailability'),
  ]),

  Order: a.model({
    orderDate: a.datetime().required(),
    status: a.enum(OrderStatusValues), // Removed .default('ORDERED')
    totalAmount: a.float().required(),
    vat: a.float(),
    discount: a.float(),
    businessId: a.id().required(),
    business: a.belongsTo('Business', 'businessId'),
    customerId: a.id().required(),
    customer: a.belongsTo('Customer', 'customerId'),
    details: a.hasMany('OrderDetail', 'orderId'),
    businessStatus: a.string(),
  }).secondaryIndexes((index) => [
    index('businessStatus').sortKeys(['orderDate']).name('byBusinessStatus'),
    index('customerId').sortKeys(['totalAmount']).name('byCustomerByAmount'),
  ]),

  OrderDetail: a.model({
    quantity: a.integer().required(),
    unitPrice: a.float().required(),
    orderId: a.id().required(),
    order: a.belongsTo('Order', 'orderId'),
    itemId: a.id().required(),
    item: a.belongsTo('Item', 'itemId'),
  }),
}).authorization((allow) => [allow.publicApiKey()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
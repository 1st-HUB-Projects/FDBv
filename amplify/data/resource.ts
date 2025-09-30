import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Define an enum for the possible states of an order.
// This is now a simple array of strings to match the 'a.enum' signature.
const OrderStatusValues = [
  'ORDERED',
  'IN_PREPARATION',
  'PREPARED',
  'DELIVERED',
  'CANCELLED'
] as const;

const schema = a.schema({
  // Represents a food and beverage business
  Business: a.model({
    // We use a custom identifier instead of the default 'id'
    phoneBusiness: a.phone().required(),
    address: a.string().required(),
    description: a.string(),
    logoUrl: a.url(), // For S3 object links
    // A business can have many menu items and many orders
    items: a.hasMany('Item', 'businessId'),
    orders: a.hasMany('Order', 'businessId'),
  }).identifier(['phoneBusiness']),

  // Represents an end customer
  Customer: a.model({
    phoneCustomer: a.phone().required(),
    name: a.string().required(),
    address: a.string(),
    location: a.string(), // Could store coordinates
    // A customer can place many orders
    orders: a.hasMany('Order', 'customerId'),
  }).identifier(['phoneCustomer']),

  // Represents a single menu item sold by a business
  Item: a.model({
    name: a.string().required(),
    description: a.string(),
    quantityAvailable: a.integer().required(),
    unitPrice: a.float().required(),
    // Establishes the many-to-one relationship with Business
    businessId: a.id().required(),
    business: a.belongsTo('Business', 'businessId'),
    // NEW FIELD for GSI: A static partition key for querying all items.
    type: a.string().required().default('Item'),
  }).secondaryIndexes((index) => [
    // Corrected GSI syntax using chained methods
    index('type').sortKeys(['quantityAvailable']).name('byAvailability'),
  ]),

  // Represents a customer's order from a business
  Order: a.model({
    orderDate: a.datetime().required(),
    // The enum now correctly uses the simple array of strings.
    status: a.enum(OrderStatusValues).required().default('ORDERED'),
    totalAmount: a.float().required(),
    vat: a.float(),
    discount: a.float(),
    // Establishes relationships with Business and Customer
    businessId: a.id().required(),
    business: a.belongsTo('Business', 'businessId'),
    customerId: a.id().required(),
    customer: a.belongsTo('Customer', 'customerId'),
    // An order is composed of many individual item details
    details: a.hasMany('OrderDetail', 'orderId'),
    // NEW FIELD for GSI: A composite key for querying by business and status.
    // This field must be populated when an order is created/updated,
    // e.g., `${businessId}#${status}`.
    businessStatus: a.string(),
  }).secondaryIndexes((index) => [
    // Corrected GSI syntax for all indexes
    index('customerId').sortKeys(['orderDate']).name('byCustomer'),
    index('businessId').sortKeys(['orderDate']).name('byBusiness'),
    index('businessStatus').sortKeys(['orderDate']).name('byBusinessStatus'),
    index('customerId').sortKeys(['totalAmount']).name('byCustomerByAmount'),
  ]),

  // Represents a single line item within an order (the "join" table)
  OrderDetail: a.model({
    quantity: a.integer().required(),
    unitPrice: a.float().required(), // Price at time of order
    // Establishes relationships with the parent Order and the specific Item
    orderId: a.id().required(),
    order: a.belongsTo('Order', 'orderId'),
    itemId: a.id().required(),
    item: a.belongsTo('Item', 'itemId'),
  }),

})
// Default authorization: Allow public access via an API Key.
// For a real app, you'd use more secure rules, like allow.owner() for customers.
.authorization((allow) => [allow.publicApiKey()]);


export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    }
  },
});


import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Define the schema for the Product model
const schema = a.schema({
  Product: a.model({
    name: a.string().required(),
    description: a.string(),
    price: a.float().required(),
    inStock: a.boolean().default(true),
    // 1. Add a 'type' field. This acts as a static partition key for our GSI,
    // allowing us to query across all products.
    type: a.string().default('Product'),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
  // 2. Define the Global Secondary Index (GSI).
  // This creates a new query pattern: fetch all products, sorted by price.
  .secondaryIndexes((index) => [
    index('type').sortKeys(['price']).name('byPrice'),
  ])
  // Removing the explicit 'any' type to resolve local linting errors.
  .authorization((allow) => [allow.publicApiKey()]),
});

// This is a TypeScript-only export for creating a type-safe client
export type Schema = ClientSchema<typeof schema>;

// Define the data resource
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    }
  },
});
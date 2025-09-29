import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Define the schema for the Product model
const schema = a.schema({
  Product: a.model({
    // This model now reflects your existing table attributes:
    // id (implicit), name, description, price, inStock.
    name: a.string().required(),
    description: a.string(),
    price: a.float().required(),
    inStock: a.boolean().default(true),
  })
  // Define a GSI using existing fields.
  // This version uses the chained method syntax to be compatible with your library version.
  .secondaryIndexes((index) => [
    index('name').sortKeys(['price']).name('byNameAndPrice'),
  ])
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


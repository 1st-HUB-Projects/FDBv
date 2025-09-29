import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Product: a.model({
    id: a.id().required(),
    name: a.string().required(),
    description: a.string(),
    price: a.float().required(),
    inStock: a.boolean().default(true),
  })
  .secondaryIndexes((index) => [
    index('name')
      .sortKeys(['inStock'])
      .name('byNameAndAvailability'),
  ])
  .authorization((allow) => [allow.publicApiKey()]),
});

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
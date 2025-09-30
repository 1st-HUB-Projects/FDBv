// amplify/data/resource.ts
import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Order: a
    .model({
      customerName: a.string(),
      orderDate: a.datetime(),
      totalAmount: a.float(),
      status: a.string(),
    })
    .authorization((allow) => [allow.public('apiKey')]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 7,
    },
  },
});
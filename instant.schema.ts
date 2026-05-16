import { i } from '@instantdb/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _schema = (i.schema as any)({
  entities: {
    workspaces: i.entity({
      userId:    i.string(),
      name:      i.string(),
      createdAt: i.number(),
      updatedAt: i.number(),
      stateJson: i.string().optional(),
    }),
  },
});

export type Schema = typeof _schema;
export default _schema;

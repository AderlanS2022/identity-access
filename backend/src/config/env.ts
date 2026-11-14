import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4100),
  DATABASE_URL: z.string().min(1),
  ADMIN_API_KEY: z.string().min(32),
  MOCK_PROVIDER_ENABLED: z.string().default('false').transform(value => value === 'true'),
  ACCESS_GRANT_TTL_SECONDS: z.coerce.number().int().min(10).max(300).default(60),
});

export type Config = z.infer<typeof schema>;
export function readConfig(source: NodeJS.ProcessEnv = process.env): Config {
  return schema.parse(source);
}

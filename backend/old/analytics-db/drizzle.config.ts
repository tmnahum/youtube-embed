

// For planetscale Database

import type { Config } from "drizzle-kit";

import 'dotenv/config'

export default {
    schema: "./schema.ts",
    out: "./drizzle",
    driver: "mysql2",
    dbCredentials: {
        connectionString: process.env.DATABASE_CONNECTION_STRING_PROD as string,
        // uri: process.env.DATABASE_CONNECTION_STRING as string,
    },
    tablesFilter: ["yt_embed_analytics_*"], //only look at tables starting with x others are other projects
} satisfies Config;

//My workflow: pnpm run push-schema pushes this schema to the dev branch of planetscale, then from planetscale we merge it up to the prod branch, no migration files
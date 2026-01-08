import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { connect } from '@planetscale/database';
import { events } from '../schema';


if (!process.env["DATABASE_HOST_PROD"]) {
    console.error("no db connection env vars")
}

// create the connection
const connection = connect({
    host: process.env.DATABASE_HOST_PROD,
    username: process.env.DATABASE_USERNAME_PROD,
    password: process.env.DATABASE_PASSWORD_PROD
});

export const db = drizzle(connection);
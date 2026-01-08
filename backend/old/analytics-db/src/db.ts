import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { connect } from '@planetscale/database';
import { events } from '../schema';


if (!process.env["DATABASE_HOST"]) {
    console.error("no db connection env vars")
}

// create the connection
const connection = connect({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD
});

export const db = drizzle(connection);
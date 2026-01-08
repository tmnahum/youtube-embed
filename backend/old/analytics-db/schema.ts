


import { sql } from 'drizzle-orm';
import { index, int, serial, text, varchar, datetime, json, boolean, mysqlTableCreator, bigint, timestamp } from 'drizzle-orm/mysql-core';

// Adds a prefix to the table names since I will be storing it in same db as some other projects
const mysqlTable = mysqlTableCreator((name) => `yt_embed_analytics_${name}`); 

export const events = mysqlTable('events', 
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        clientId: varchar("clientId", { length: 255 }),
        eventName: varchar("eventName", { length: 255 }),
        details: text("details"),

        datetime: datetime("datetime").default(sql`CURRENT_TIMESTAMP`),
    },
    (thisTable) => ({
        clientIdIndex: index('clientId_idx').on(thisTable.clientId),
        eventNameIndex: index('eventName_idx').on(thisTable.eventName),

        datetimeIndex: index('datetime_idx').on(thisTable.datetime),
    })
)



import { eq, sql } from "drizzle-orm";
import { events } from "../schema";
// import { db } from "./db";
import { db } from "./db_prod";

// const x = await db.select({count: sql`*`}).from(events).where(eq(events.eventName, "testEvent"))


async function getEventCount(eventName: string, hours:number):Promise<number> {
    const y = await db.execute(sql`
        SELECT COUNT(*)
        FROM ${events}
        WHERE ${events.datetime} >= NOW() - INTERVAL ${hours} HOUR
        AND ${events.eventName} = ${eventName};
    `)
    const countY = y.rows[0]["count(*)"]
    return countY
}

async function getEvents(eventName: string, hours: number) {
    const y = await db.execute(sql`
        SELECT *
        FROM ${events}
        WHERE ${events.datetime} >= NOW() - INTERVAL ${hours} HOUR
        AND ${events.eventName} = ${eventName};
    `)
    // console.log(y)
    return y.rows
}

async function getAllUsers(eventName: string, hours: number) {
    const y = await db.execute(sql`
        SELECT DISTINCT ${events.clientId}
        FROM ${events}
        WHERE ${events.datetime} >= NOW() - INTERVAL ${hours} HOUR
        AND ${events.eventName} = ${eventName};
    `)
    return y.rows
}

async function getUsersCount(eventName:string, hours:number) {
    const y = await db.execute(sql`
        SELECT COUNT(DISTINCT ${events.clientId})
        FROM ${events}
        WHERE ${events.datetime} >= NOW() - INTERVAL ${hours} HOUR
        AND ${events.eventName} = ${eventName};
    `)
    return y.rows[0]["count(distinct yt_embed_analytics_events.clientId)"]
}

async function reportLastXHours(x:number) {
    return {
        "loadedHomePage" : await getEventCount("loadedHomePage", x),
        "loadedRecommendationsPage" : await getEventCount("loadedRecommendationsPage", x),
        "loadedVideoPage" : await getEventCount("loadedVideoPage", x),
        "stayedOnVideoPageFor1Min" : await getEventCount("stayedOnVideoPageFor1Min", x),
        "stayedOnVideoPageFor5Min" : await getEventCount("stayedOnVideoPageFor5Min", x),
        "stayedOnVideoPageFor10Min" : await getEventCount("stayedOnVideoPageFor10Min", x),
        
        "uniqueUsersLoadedHomepage" : await getUsersCount("loadedHomePage", x),
        "uniqueUsersRecommendationsPage" : await getUsersCount("loadedRecommendationsPage", x),
        "uniqueUsersVideoPage" : await getUsersCount("loadedVideoPage", x),
        "uniqueUsersStayedOnVideoPageFor1Min" : await getUsersCount("stayedOnVideoPageFor1Min", x),
        "uniqueUsersStayedOnVideoPageFor5Min" : await getUsersCount("stayedOnVideoPageFor5Min", x),
        "uniqueUsersStayedOnVideoPageFor10Min" : await getUsersCount("stayedOnVideoPageFor10Min", x),

        // todo: percent of users who have watched 2 videos, 3 videos, etc or something like that
    }
}



// console.log("Last 16 Hours", await reportLastXHours(16))
// console.log("Last 8 Hours", await reportLastXHours(8))


console.log("Last _ Hours")
for await (const line of console) {
    const input = line
    console.log(`Last ${input} Hours`, await reportLastXHours(parseInt(input)))
}


// console.log(await getEvents("loadedVideoPage", 8))
// console.log(await getAllUsers("loadedVideoPage", 24))
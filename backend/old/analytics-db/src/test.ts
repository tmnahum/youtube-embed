import { events } from "../schema";
import { db } from "./db";



await db.insert(events).values({
    clientId: "testClientId",
    eventName: "testEvent",
})


await db.insert(events).values({
    clientId: "testClientId",
    eventName: "testEvent",
    details: "testDetails",
})
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;

	DATABASE_HOST: string;
	DATABASE_USERNAME: string;
	DATABASE_PASSWORD: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const searchParams = new URLSearchParams(new URL(request.url).search);
		
		const clientId = searchParams.get('clientId');
		const eventName = searchParams.get('eventName');
		const details = searchParams.get('details');
		if (!clientId || !eventName) {
			return new Response('please provide clientId and eventName', {
				status: 400,
				headers: {
					'Access-Control-Allow-Origin': '*'
				}
			});
		}


		//create db connection
		if (!env.DATABASE_HOST) {
			console.error("no db connection env vars")
		} 	

		const connection = connect({
			host: env.DATABASE_HOST,
			username: env.DATABASE_USERNAME,
			password: env.DATABASE_PASSWORD,

			fetch: (url, init) => {
				delete init['cache']
				return fetch(url, init)
			}
			//^no idea what this is, was on guide here https://planetscale.com/blog/integrate-cloudflare-workers-with-planetscale, seems to be necessary for it to work
		
		});

		
		
		// const db = drizzle(connection);
		const db = connection;

		//TODO integrate w drizzle schema
		
		if (details){
			await db.execute(`
				INSERT INTO yt_embed_analytics_events
				(clientId, eventName, details)
				VALUES (?, ?, ?);
			`, [clientId, eventName, details])
		}
		else {
			await db.execute(`
				INSERT INTO yt_embed_analytics_events
				(clientId, eventName)
				VALUES (?, ?);
			`, [clientId, eventName])
		}


		return new Response("thanks", {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*'
			}
		});
	},
};

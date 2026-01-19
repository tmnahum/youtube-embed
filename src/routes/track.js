
				// copied from mdn docs
				/** @param {string} message */
				async function hashMessage(message) {
					const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
					const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
					const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
					const hashHex = hashArray
						.map((b) => b.toString(16).padStart(2, "0"))
						.join(""); // convert bytes to hex string
					return hashHex;
				}
				
				// redacts url past #, hashes query params, hashes page title
				async function getRedactedData() {
					//hash page title
					const pageTitle = document.title
					const redactedPageTitle = "hashed-" + await hashMessage(pageTitle)
				
					// hash query params  + redact past #
					/** @param {URLSearchParams} searchParams */
					async function redactSearchParams(searchParams) {
						for (const [key, value] of searchParams.entries()) {
							searchParams.set(key, await hashMessage(value))
						}
						return searchParams.toString()
					}
					const pageUrl = window.location.pathname
					const pageQueryParamsString = window.location.search
					const redactedPageUrl = (pageUrl + "?" + await redactSearchParams(new URLSearchParams(pageQueryParamsString))).split("#")[0]
				
					// hash referers query params
					const referer = document.referrer
					const redactedRefererQueryParams = await redactSearchParams(new URLSearchParams(referer))
					const redactedRefererUrl = (referer + "?" + redactedRefererQueryParams).split("#")[0]
				
				
				
					return {redactedPageTitle, redactedPageUrl, redactedRefererUrl}
				}
				
				async function trackRedacted(){
					const {redactedPageTitle, redactedPageUrl, redactedRefererUrl} = await getRedactedData();

					console.log("tracking redacted")
					if (typeof umami === 'undefined') return;
					umami.track(props => {
						props.title = redactedPageTitle;
						props.url = redactedPageUrl;
						props.referrer = redactedRefererUrl;
			
						return props
					});
				}

				trackRedacted();
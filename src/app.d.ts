// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

// Umami analytics global (loaded via script tag)
interface UmamiTrackProps {
	title?: string;
	url?: string;
	referrer?: string;
	hostname?: string;
	language?: string;
	screen?: string;
	// Allow custom properties
	[key: string]: unknown;
}

interface Umami {
	track(callback: (props: UmamiTrackProps) => UmamiTrackProps): void;
	track(eventName: string, data?: Record<string, unknown>): void;
}

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}

	// eslint-disable-next-line no-var
	var umami: Umami | undefined;
}

export {};

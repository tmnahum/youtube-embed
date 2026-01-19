<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { browser } from '$app/environment';
	import { playerStore, seekTo } from '$lib/stores/playerStore';
	import {
		currentSponsorSegment,
		registerSkipCallback,
		unregisterSkipCallback
	} from '$lib/stores/sponsorStore';
	import { sendAnalyticsEvent } from '$lib/analytics';
	import {
		type SponsorSegment,
		type SponsorBlockSettings,
		type SponsorCategory,
		ALL_CATEGORIES,
		DEFAULT_SETTINGS,
		DEFAULT_ENABLED_CATEGORIES,
		STORAGE_KEY
	} from '$lib/types/sponsorBlock';
	import SponsorSettings from './SponsorSettings.svelte';

	interface Props {
		videoId: string;
	}

	let { videoId }: Props = $props();

	// Settings state
	let settings = $state<SponsorBlockSettings>({ ...DEFAULT_SETTINGS });
	let showSettings = $state(false);

	// Track current segment locally for skip logic
	let currentSegmentForSkip = $state<SponsorSegment | null>(null);

	// Track recently skipped segments to prevent re-triggering
	let recentlySkipped = $state<Set<string>>(new Set());

	// Debounce tracking for analytics
	let lastAutoSkipTime = 0;

	// Validate settings from localStorage
	function validateSettings(data: unknown): SponsorBlockSettings {
		if (typeof data !== 'object' || data === null) return { ...DEFAULT_SETTINGS };
		const obj = data as Record<string, unknown>;
		return {
			enabled: typeof obj.enabled === 'boolean' ? obj.enabled : DEFAULT_SETTINGS.enabled,
			mode: obj.mode === 'auto' || obj.mode === 'manual' ? obj.mode : DEFAULT_SETTINGS.mode,
			skipCategories: Array.isArray(obj.skipCategories)
				? obj.skipCategories.filter(
						(c): c is SponsorCategory => ALL_CATEGORIES.includes(c as SponsorCategory)
					)
				: [...DEFAULT_ENABLED_CATEGORIES]
		};
	}

	// Load settings from localStorage
	onMount(() => {
		if (browser) {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					settings = validateSettings(parsed);
				} catch {
					// Invalid JSON, use defaults
				}
			}
		}

		// Register skip callback for overlay button
		registerSkipCallback(handleManualSkip);
	});

	onDestroy(() => {
		unregisterSkipCallback();
		currentSponsorSegment.set(null);
	});

	// Save settings to localStorage
	function saveSettings() {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		}
	}

	// Fetch segments from SponsorBlock API
	// Must specify all categories we want - API defaults to only sponsor+selfpromo
	const sponsorQuery = createQuery({
		queryKey: ['sponsorblock', videoId],
		queryFn: async (): Promise<SponsorSegment[]> => {
			const res = await fetch(
				`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=${encodeURIComponent(JSON.stringify([...ALL_CATEGORIES]))}`
			);
			if (res.status === 404) {
				// No segments found - not an error
				return [];
			}
			if (!res.ok) {
				throw new Error('Failed to fetch sponsor segments');
			}
			return res.json();
		},
		staleTime: 1000 * 60 * 60, // 1 hour - segments rarely change
		enabled: settings.enabled
	});

	// Get segments filtered by enabled categories
	function getEnabledSegments(): SponsorSegment[] {
		if (!$sponsorQuery.data) return [];
		return $sponsorQuery.data.filter((seg) =>
			settings.skipCategories.includes(seg.category)
		);
	}

	// Skip logic - runs on time updates
	$effect(() => {
		if (!settings.enabled || !$sponsorQuery.data?.length) {
			currentSegmentForSkip = null;
			currentSponsorSegment.set(null);
			return;
		}

		const currentSec = $playerStore.currentTime;
		const enabledSegments = getEnabledSegments();

		// Find if we're in a sponsor segment
		const inSegment = enabledSegments.find((seg) => {
			const [start, end] = seg.segment;
			// Small buffer (0.1s) before end to prevent re-triggering
			return currentSec >= start && currentSec < end - 0.1;
		});

		if (settings.mode === 'auto' && inSegment && !recentlySkipped.has(inSegment.UUID)) {
			const [, end] = inSegment.segment;
			recentlySkipped.add(inSegment.UUID);
			seekTo(end);
			trackAutoSkip();
			// Clear from recently skipped after 2 seconds
			setTimeout(() => {
				recentlySkipped.delete(inSegment.UUID);
				recentlySkipped = recentlySkipped; // trigger reactivity
			}, 2000);
			currentSegmentForSkip = null;
			currentSponsorSegment.set(null);
		} else {
			// For manual mode: expose current segment to overlay button via store
			currentSegmentForSkip = inSegment ?? null;
			currentSponsorSegment.set(settings.mode === 'manual' ? (inSegment ?? null) : null);
		}
	});

	function trackAutoSkip() {
		const now = Date.now();
		// Debounce: only track once per 10 seconds
		if (now - lastAutoSkipTime > 10000) {
			lastAutoSkipTime = now;
			sendAnalyticsEvent('sponsorSkipped', 'auto');
		}
	}

	function handleManualSkip() {
		if (currentSegmentForSkip) {
			const [, end] = currentSegmentForSkip.segment;
			seekTo(end);
			sendAnalyticsEvent('sponsorSkipped', 'manual');
			currentSegmentForSkip = null;
			currentSponsorSegment.set(null);
		}
	}

	function toggleEnabled() {
		settings.enabled = !settings.enabled;
		saveSettings();
		if (settings.enabled) {
			// Only track re-enabling (not initial page load which is default on)
			sendAnalyticsEvent('toolEnabled', 'sponsors');
		} else {
			sendAnalyticsEvent('toolDisabled', 'sponsors');
		}
	}

	function handleSettingsChange(newSettings: SponsorBlockSettings) {
		settings = newSettings;
		saveSettings();
	}

	// Segment count for display
	let segmentCount = $derived($sponsorQuery.data?.length ?? 0);
	let enabledCount = $derived(getEnabledSegments().length);
</script>

<!-- Dropdown toggle -->
<div class="sponsor-skip-toggle flex items-center gap-2">
	<button
		class="text-sm hover:text-emerald-300 transition-colors"
		class:text-emerald-400={settings.enabled}
		class:text-gray-400={!settings.enabled}
		onclick={toggleEnabled}
	>
		{#if !settings.enabled}
			Skip sponsors
		{:else if $sponsorQuery.isLoading}
			Skip sponsors ...
		{:else if $sponsorQuery.isError}
			Skip sponsors <span class="text-yellow-500" title="Error fetching segments">⚠</span>
		{:else if segmentCount === 0}
			Skip sponsors (none found)
		{:else}
			Skip sponsors ✓
		{/if}
	</button>

	{#if settings.enabled}
		<button
			class="text-gray-400 hover:text-gray-300 text-sm"
			onclick={() => (showSettings = !showSettings)}
			title="Settings"
		>
			⚙
		</button>
	{/if}
</div>

<!-- Settings popover -->
{#if showSettings && settings.enabled}
	<div class="mt-2 ml-4">
		<SponsorSettings {settings} onChange={handleSettingsChange} />
	</div>
{/if}

<script lang="ts">
	import type { Snippet } from 'svelte';

	let { dropdown, active }: { dropdown?: Snippet; active?: Snippet } = $props();

	let expanded = $state(false);
</script>

<div class="video-tools">
	<button
		class="text-emerald-400 hover:text-emerald-300 text-left"
		onclick={() => expanded = !expanded}
	>
		{expanded ? '▾' : '▸'} video tools
	</button>

	{#if expanded}
		<div class="dropdown-content mt-2 ml-4 space-y-1">
			{#if dropdown}
				{@render dropdown()}
			{:else}
				<span class="text-gray-500 text-sm">No tools available yet</span>
			{/if}
		</div>
	{/if}
</div>

<!-- Active tools area - shows UI for enabled tools -->
{#if active}
	<div class="active-tools-area mt-2">
		{@render active()}
	</div>
{/if}

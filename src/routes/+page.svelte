<script lang="ts">
	import { onMount } from 'svelte';
	import InputForm from '$lib/components/InputForm.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import ResultsScreen from '$lib/components/ResultsScreen.svelte';

	type AppState = 'input' | 'loading' | 'results';

	let currentState: AppState = 'input';
	let formData: any = null;
	let results: any = null;

	function handleSuccess(event: any) {
		results = event.detail;
		currentState = 'loading';
		// Simulate loading time, then show results
		setTimeout(() => {
			currentState = 'results';
		}, 2000);
	}

	function handleError(error: any) {
		alert(`Error: ${error.message || 'Unknown error occurred'}`);
		currentState = 'input';
	}

	function resetToInput() {
		currentState = 'input';
		formData = null;
		results = null;
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
	{#if currentState === 'input'}
		<div class="container mx-auto px-4 py-8">
			<div class="text-center mb-8">
				<h1 class="text-5xl font-bold text-white mb-4 font-nunito">
					🧳 Listy
				</h1>
				<p class="text-xl text-white/90 font-quicksand">
					Your smart packing companion
				</p>
			</div>
			
			<InputForm on:success={handleSuccess} on:error={handleError} />
		</div>
	{:else if currentState === 'loading'}
		<LoadingScreen />
	{:else if currentState === 'results'}
		<ResultsScreen {results} on:reset={resetToInput} />
	{/if}
</div>

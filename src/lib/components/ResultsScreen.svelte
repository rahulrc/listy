<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	export let results: any;
	
	let activeTab = 0;
	
	// Debug logging
	$: console.log('ResultsScreen received results:', results);
	$: console.log('Results travelers:', results?.travelers);
	$: console.log('Active tab:', activeTab);
	$: console.log('Current traveler data:', results?.travelers?.[activeTab]);
	
	// Add safety checks for the results object - make it properly reactive
	$: safeResults = results ? {
		trip_summary: results.trip_summary || 'Trip details',
		location_details: results.location_details || { city: 'Unknown', country: 'Unknown', plug_type: 'Unknown' },
		weather_forecast: results.weather_forecast || { high_temp_celsius: 0, low_temp_celsius: 0, conditions: 'Unknown' },
		travelers: results.travelers || [],
		inferred_activities: results.inferred_activities || ['Unknown']
	} : {
		trip_summary: 'Trip details',
		location_details: { city: 'Unknown', country: 'Unknown', plug_type: 'Unknown' },
		weather_forecast: { high_temp_celsius: 0, low_temp_celsius: 0, conditions: 'Unknown' },
		travelers: [],
		inferred_activities: ['Unknown']
	};
	
	$: console.log('safeResults computed:', safeResults);
	$: console.log('Current traveler in safeResults:', safeResults.travelers?.[activeTab]);
	
	function resetToInput() {
		dispatch('reset');
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-white mb-4 font-nunito">
				🎉 Your Packing Lists Are Ready!
			</h1>
			<p class="text-xl text-white/90 font-quicksand">
				{results?.trip_summary || 'Trip details'}
			</p>
		</div>
		
		<!-- Trip Summary Card -->
		<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
				<div class="text-center">
					<div class="text-2xl mb-2">📍</div>
					<div class="font-semibold">
						{results?.location_details?.city || 'Unknown'}
						{#if results?.location_details?.state && results?.location_details?.state !== 'Unknown'}
							, {results.location_details.state}
						{/if}
						{#if results?.location_details?.country && results?.location_details?.country !== 'Unknown'}
							, {results.location_details.country}
						{/if}
					</div>
					<div class="text-sm opacity-80">Plug: {results?.location_details?.plug_type || 'Unknown'}</div>
				</div>
				<div class="text-center">
					<div class="text-2xl mb-2">🌤️</div>
					<div class="font-semibold">{results?.weather_forecast?.conditions || 'Unknown'}</div>
					<div class="text-sm opacity-80">{results?.weather_forecast?.high_temp_celsius || 0}°C / {results?.weather_forecast?.low_temp_celsius || 0}°C</div>
				</div>
				<div class="text-center">
					<div class="text-2xl mb-2">🎯</div>
					<div class="font-semibold">Activities</div>
					<div class="text-sm opacity-80">{results?.inferred_activities?.join(', ') || 'Unknown'}</div>
				</div>
			</div>
		</div>
		
		<!-- Traveler Tabs -->
		{#if results?.travelers?.length > 1}
			<div class="flex justify-center mb-6">
				<div class="bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
					{#each results.travelers as traveler, index}
						<button
							class="px-4 py-2 rounded-lg transition-all duration-300 font-quicksand {activeTab === index ? 'bg-white text-purple-600 font-semibold' : 'text-white hover:bg-white/20'}"
							on:click={() => activeTab = index}
						>
							{traveler.provided_name || `Traveler ${index + 1}`}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Packing List / Personalized Prompt -->
		<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
			<div class="text-center mb-6">
				<h2 class="text-2xl font-bold text-white mb-2 font-nunito">
					{results?.travelers?.[activeTab]?.provided_name || `Traveler ${activeTab + 1}`}'s Packing List
				</h2>
			</div>
			
			<!-- Packing List -->
			{#if results?.travelers?.[activeTab]?.packing_list}
				<div class="space-y-6">
					<!-- Packing List Categories -->
					{#if results.travelers[activeTab].packing_list.packing_list && typeof results.travelers[activeTab].packing_list.packing_list === 'object'}
						{#each Object.entries(results.travelers[activeTab].packing_list.packing_list) as [category, items]}
							{#if Array.isArray(items) && items.length > 0}
								<div class="bg-white/5 rounded-lg p-4">
									<h3 class="text-lg font-semibold text-white mb-3 font-nunito capitalize">
										{category === 'clothing' ? '👕' : 
										 category === 'toiletries' ? '🧴' :
										 category === 'electronics' ? '📱' :
										 category === 'documents' ? '📄' :
										 category === 'accessories' ? '👜' :
										 category === 'special_items' ? '⭐ Special Items' : '📦'} {category === 'special_items' ? 'Special Items' : category}
									</h3>
									<div class="space-y-2">
										{#each items as item}
											<div class="flex items-center space-x-3">
												<input type="checkbox" id="item-{category}-{item}" class="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500 focus:ring-2">
												<label for="item-{category}-{item}" class="text-white/90 font-quicksand cursor-pointer">
													{item}
												</label>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
					{/if}
					
					<!-- Packing Tips -->
					{#if results.travelers[activeTab].packing_list.packing_tips}
						<div class="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 border border-purple-300/30">
							<h3 class="text-lg font-semibold text-white mb-2 font-nunito">💡 Packing Tips</h3>
							<p class="text-white/90 font-quicksand">{results.travelers[activeTab].packing_list.packing_tips}</p>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Error or Loading State -->
				<div class="text-center py-8">
					<div class="text-4xl mb-4">❌</div>
					<h3 class="text-lg font-semibold text-white mb-2 font-nunito">Packing List Generation Failed</h3>
					<p class="text-white/70 font-quicksand">
						The AI was unable to generate a packing list for this traveler. This could be due to:
					</p>
					<ul class="text-white/60 font-quicksand text-sm mt-2 space-y-1 text-left max-w-md mx-auto">
						<li>• API service temporarily unavailable</li>
						<li>• Invalid or incomplete traveler information</li>
						<li>• AI processing error</li>
					</ul>
					<p class="text-white/70 font-quicksand mt-4">
						Please try again or check your input details.
					</p>
				</div>
			{/if}
		</div>
		
		<!-- Action Buttons -->
		<div class="text-center mt-8 space-y-4">
			<button
				on:click={resetToInput}
				class="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 font-quicksand border border-white/30"
			>
				🔄 Create Another List
			</button>
			
			<div class="text-sm text-white/60 font-quicksand">
				💡 Tip: Check off items as you pack them!
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	let destination = '';
	let startDate = '';
	let numberOfDays = 1;
	let travelers = '';
	let tripPurpose: string[] = [];
	let customPurpose = '';
	let additionalDetails = '';
	let isLoading = false;
	
	function togglePurpose(purpose: string) {
		if (tripPurpose.includes(purpose)) {
			tripPurpose = tripPurpose.filter(p => p !== purpose);
		} else {
			tripPurpose = [...tripPurpose, purpose];
		}
	}

	// Audio for button click
	let audioContext: AudioContext | null = null;
	let clickSound: AudioBuffer | null = null;

	onMount(() => {
		// Set default start date to tomorrow
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		startDate = tomorrow.toISOString().split('T')[0];

		// Initialize audio context for sound effects
		try {
			audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			createClickSound();
		} catch (error) {
			console.log('Audio not supported:', error);
		}
	});

	function createClickSound() {
		if (!audioContext) return;
		
		// Create a fun, happy sound (chime-like)
		const sampleRate = audioContext.sampleRate;
		const duration = 0.3;
		const frameCount = sampleRate * duration;
		
		const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
		const channelData = audioBuffer.getChannelData(0);
		
		for (let i = 0; i < frameCount; i++) {
			const t = i / sampleRate;
			const frequency = 800 + 400 * Math.sin(t * 10); // Oscillating frequency
			channelData[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3) * 0.3;
		}
		
		clickSound = audioBuffer;
	}

	function playClickSound() {
		if (audioContext && clickSound) {
			try {
				const source = audioContext.createBufferSource();
				source.buffer = clickSound;
				source.connect(audioContext.destination);
				source.start();
			} catch (error) {
				console.log('Could not play sound:', error);
			}
		}
	}
	
	async function handleSubmit() {
		if (!destination.trim()) {
			return;
		}
		
		// Format dates for display
		const start = new Date(startDate);
		const end = new Date(start);
		end.setDate(start.getDate() + numberOfDays - 1);
		
		const dateRange = numberOfDays === 1 
			? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
			: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
		
		const formData = {
			destination: destination.trim(),
			dates: dateRange,
			startDate: startDate,
			numberOfDays: numberOfDays,
			travelers: travelers.trim() || null,
			tripPurpose: tripPurpose.length > 0 ? tripPurpose : null,
			additionalDetails: additionalDetails.trim() || null
		};
		
		isLoading = true;
		
		try {
			const response = await fetch('/api/generate-list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});
			
			if (response.ok) {
				const results = await response.json();
				dispatch('success', results);
			} else {
				const errorText = await response.text();
				dispatch('error', { status: response.status, message: errorText });
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			dispatch('error', { status: 0, message: errorMessage });
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="max-w-md mx-auto">
	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
		<!-- Destination Input -->
		<div class="fade-in">
			<label for="destination" class="block text-white text-lg font-semibold mb-3 font-quicksand">
				Where are you off to?
			</label>
			<input
				id="destination"
				type="text"
				bind:value={destination}
				placeholder="e.g., Paris, France"
				class="w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300 font-quicksand"
				required
				disabled={isLoading}
			/>
		</div>
		
		<!-- Dates Section -->
		<div class="space-y-3">
			<label for="startDate" class="block text-white/80 font-quicksand">
				📅 When are you leaving?
			</label>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div>
					<input
						type="date"
						id="startDate"
						bind:value={startDate}
						class="w-full max-w-xs md:max-w-none p-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white focus:border-white/60 focus:bg-white/20 transition-all duration-300 font-quicksand"
						disabled={isLoading}
					/>
				</div>
				<div>
					<label for="numberOfDays" class="block text-white/80 font-quicksand text-sm mb-1">
						Number of days:
					</label>
					<input
						type="number"
						id="numberOfDays"
						bind:value={numberOfDays}
						min="1"
						max="30"
						class="w-full max-w-xs md:max-w-none p-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white focus:border-white/60 focus:bg-white/20 transition-all duration-300 font-quicksand"
						disabled={isLoading}
					/>
				</div>
			</div>
		</div>
		
		<!-- Travelers Input -->
		<div class="fade-in">
			<label for="travelers" class="block text-white text-lg font-semibold mb-3 font-quicksand">
				👥 Who's going?
			</label>
			<input
				id="travelers"
				type="text"
				bind:value={travelers}
				placeholder="e.g., Me, my wife Sarah, and our 10 year old son"
				class="w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300 font-quicksand"
				disabled={isLoading}
			/>
		</div>
		
		<!-- Trip Purpose -->
		<div class="fade-in">
			<label class="block text-white text-lg font-semibold mb-3 font-quicksand">
				🎯 What's the purpose of your trip?
			</label>
			<div class="grid grid-cols-2 gap-3">
				<button
					type="button"
					class="p-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 font-quicksand {tripPurpose.includes('beach') ? 'border-white/60 bg-white/20' : ''}"
					on:click={() => togglePurpose('beach')}
					disabled={isLoading}
				>
					🏖️ Beach
				</button>
				
				<button
					type="button"
					class="p-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 font-quicksand {tripPurpose.includes('outdoorsy') ? 'border-white/60 bg-white/20' : ''}"
					on:click={() => togglePurpose('outdoorsy')}
					disabled={isLoading}
				>
					🏔️ Outdoorsy
				</button>
				
				<button
					type="button"
					class="p-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 font-quicksand {tripPurpose.includes('business') ? 'border-white/60 bg-white/20' : ''}"
					on:click={() => togglePurpose('business')}
					disabled={isLoading}
				>
					💼 Business
				</button>
				
				<button
					type="button"
					class="p-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 font-quicksand {tripPurpose.includes('culture') ? 'border-white/60 bg-white/20' : ''}"
					on:click={() => togglePurpose('culture')}
					disabled={isLoading}
				>
					🏛️ Culture
				</button>
				
				<button
					type="button"
					class="p-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 font-quicksand {tripPurpose.includes('romantic') ? 'border-white/60 bg-white/20' : ''}"
					on:click={() => togglePurpose('romantic')}
					disabled={isLoading}
				>
					💕 Romantic Getaway
				</button>
				
				<button
					type="button"
					class="p-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 font-quicksand {tripPurpose.includes('family') ? 'border-white/60 bg-white/20' : ''}"
					on:click={() => togglePurpose('family')}
					disabled={isLoading}
				>
					👨‍👩‍👧‍👦 Friends/Family
				</button>
			</div>
			
			<!-- Trip Purpose Free Text Input -->
			<div class="mt-3">
				<label for="customPurpose" class="block text-white/80 font-quicksand mb-2">
					Other purpose:
				</label>
				<input
					type="text"
					id="customPurpose"
					bind:value={customPurpose}
					placeholder="e.g., attending a wedding, hiking specific trails, business conference..."
					class="w-full p-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:border-white/60 focus:bg-white/20 transition-all duration-300 font-quicksand"
					disabled={isLoading}
				/>
			</div>
		</div>
		
		<!-- Additional Details -->
		<div class="fade-in">
			<label for="additionalDetails" class="block text-white text-lg font-semibold mb-3 font-quicksand">
				💭 Anything else I should know?
			</label>
			<textarea
				id="additionalDetails"
				bind:value={additionalDetails}
				placeholder="e.g., We're staying at a resort with a pool, or We plan on doing some serious hiking..."
				rows="3"
				class="w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300 font-quicksand resize-none"
				disabled={isLoading}
			></textarea>
		</div>
		
		<!-- Submit Button -->
		<button
			type="submit"
			class="w-full bg-gradient-to-r from-coral to-turquoise hover:from-coral/90 hover:to-turquoise/90 text-white font-bold py-4 px-6 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-quicksand disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
			disabled={!destination.trim() || isLoading}
			on:click={playClickSound}
		>
			{isLoading ? '⏳ Creating...' : '🎒 Create My Lists!'}
		</button>
	</form>
</div>

<template>
  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-1 bg-gray-100 dark:bg-gray-800 py-8 px-6 md:px-8">
      <div class="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold mb-4">Create Credential</h2>
        <p class="text-red-400 text-sm"> Required credential missing. Create Credential </p>
        <form @submit.prevent="createCredential">
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">Name</label>
            <input v-model="customerName" type="text" required class="w-full p-2 border rounded" />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">Country Code</label>
            <input v-model="countryCode" type="text" maxlength="2" required class="w-full p-2 border rounded" />
          </div>
          <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 dark:text-white">
            Create Credential
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
// Import any required modules or components here
import { ref } from 'vue';

const customerName = ref('');
const countryCode = ref('');

const createCredential = () => {
  // Implement credential creation logic here
  console.log(`Creating credential for ${customerName.value} with country code ${countryCode.value}`);
};
</script>

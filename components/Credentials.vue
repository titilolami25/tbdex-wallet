<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
    <h2 class="text-2xl font-bold mb-4">Credentials</h2>
    <div v-if="parsedCredentials.length">
      <div v-for="credential, index in parsedCredentials" :key="index" class="mb-4 p-4 border rounded-lg lg:w-1/2 w-full">
        <p><strong>{{ credential.title }} </strong></p>
        <p><strong>Country Code:</strong> {{ credential.countryCode }}</p>
        <p><strong>Date:</strong> {{ credential.issuanceDate }}</p>
      </div>
    </div>
    <div v-else>
      <p>No credentials found.</p>
    </div>
  </div>
</template>

<script setup>
import { useStore } from '~/store.js';

const { state, renderCredential } = useStore();

const parsedCredentials = computed(() =>
  state.customerCredentials.map(jwt => renderCredential(jwt))
);
</script>

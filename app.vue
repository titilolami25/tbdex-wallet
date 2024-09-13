<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useStore } from '~/store.js';
import { provide } from 'vue';

const store = useStore();
provide('store', store);

useHead({
  title: 'My tbDEX Wallet',
  meta: [
    { name: 'description', content: 'An example wallet app with tbDEX' }
  ]
});
</script>

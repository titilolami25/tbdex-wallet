<template>
  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-1 bg-gray-100 dark:bg-gray-800 py-8 px-6 md:px-8 dark:text-white">
      <div class="max-w-3xl mx-auto grid gap-8">
        <Balances />
        <Credentials />
        <Transactions />
      </div>
    </main>
  </div>
</template>

<script setup>
import Header from '~/components/Header.vue';
import Balances from '~/components/Balances.vue';
import Credentials from '~/components/Credentials.vue';
import Transactions from '~/components/Transactions.vue';
</script>

<template>
  <header class="bg-gray-900 text-white py-4 px-6 md:px-8 flex items-center justify-between sticky">
    <div class="flex items-center gap-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-6 h-6"
      >
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
      </svg>
      <h1 class="text-xl font-bold">My tbDEX Wallet</h1>
    </div>
    <nav class="transition-all duration-300 ease-in-out flex flex-col gap-2 mt-4">
      <nuxt-link to="/" class="hover:underline">Home</nuxt-link>
    </nav>
  </header>
</template>

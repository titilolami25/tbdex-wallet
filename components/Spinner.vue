<template>
  <div class="flex justify-center items-center h-16">
    <div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
  </div>
</template>

<style scoped>
.loader {
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

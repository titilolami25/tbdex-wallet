<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" @click="closeOnOutsideClick">
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full max-w-md" @click.stop>
      <div class="grid gap-6">
        <div class="flex items-center gap-4">
          <div :class="statusIconBgClass">
            <svg
              v-if="transaction.status === 'completed'"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
            >
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
            <svg
              v-else-if="transaction.status === 'failed'"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium">{{ state.pfiAllowlist.find(pfi => pfi.pfiUri === transaction.pfiDid).pfiName }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Exchange from {{transaction.payinCurrency}} to {{transaction.payoutCurrency}}</p>
          </div>
          <div class="flex-1">
            <p class="text-XL font-medium text-right">{{ transaction.payinAmount }} {{ transaction.payinCurrency }}</p>

          </div>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium leading-none">Sender</label>
          <div class="flex">
            <span class="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              You
            </span>
          </div>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium leading-none">Recipient</label>
          <div class="flex">
            <span class="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              {{ transaction.to }}
            </span>
          </div>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium leading-none">Amount</label>
          <div class="flex">
            <span class="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              {{ transaction.payoutAmount }} {{ transaction.payoutCurrency }}
            </span>
          </div>
        </div>
        <div v-if="transaction.status === 'quote' && transaction.expirationTime" class="grid gap-2">
          <label class="text-sm font-medium leading-none">Expires</label>
          <div class="flex">
            <span class="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              {{ new Date(transaction.expirationTime).toLocaleDateString(undefined, {dateStyle: 'medium'}) }}
            </span>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button @click="reject" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-red-500 hover:text-white h-10 px-4 py-2">
            Reject
          </button>
          <button @click="pay" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-700 h-10 px-4 py-2">
            Pay {{ transaction.payinAmount }} {{ transaction.payinCurrency }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from '~/store.js';


const { state } = useStore();


const props = defineProps({
  transaction: {
    type: Object,
    required: true
  }
});

const statusIconBgClass = computed(() => {
  switch (props.transaction.status) {
    case 'Completed':
      return 'flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
    case 'In Progress':
      return 'flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'Failed':
      return 'flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
    default:
      return '';
  }
});

const emit = defineEmits(['close']);

const closeOnOutsideClick = () => {
  emit('close');
};

const reject = () => {
  // Handle rejection logic
  emit('close');
};

const pay = () => {
  // Handle payment logic
  emit('close');
};
</script>

<style scoped>
.bg-primary {
  background-color: #3b82f6; /* Primary color */
}
.text-primary-foreground {
  color: #ffffff; /* Primary foreground color */
}
</style>

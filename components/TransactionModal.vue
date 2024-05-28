<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" @click="closeOnOutsideClick">
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full max-w-md" @click.stop>
      <div class="grid gap-6">
        <div class="flex items-center gap-4">
          <div>
            <svg
              v-if="transaction.status === 'completed'"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="green"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
            >
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
            <svg
              v-else-if="transaction.status === 'failed' || transaction.status === 'cancelled'"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="red"
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
          <label class="text-sm font-medium leading-none">Recipient Details</label>
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
        <div v-if="transaction.status === 'quote' && !loading" class="flex justify-end gap-2">
          <button @click="reject" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-red-500 hover:text-white h-10 px-4 py-2">
            Cancel
          </button>
          <button @click="pay" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-700 h-10 px-4 py-2">
            Pay {{ transaction.payinAmount }} {{ transaction.payinCurrency }}
          </button>
        </div>
        <div v-if="loading">
          <Spinner />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from '~/store.js';
import Spinner from '~/components/Spinner.vue'


const { state, addOrder, addClose, deductAmount } = useStore();
const loading = ref(false);

const props = defineProps({
  transaction: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const closeOnOutsideClick = () => {
  emit('close');
};

const reject = async () => {
  // Handle rejection logic
  loading.value = true;
  await addClose(props.transaction.id, props.transaction.pfiDid, 'user cancelled')
  loading.value = false;
  emit('close');
};

const pay = async () => {
  // Handle payment logic
  loading.value = true;
  await addOrder(props.transaction.id, props.transaction.pfiDid)
  if(props.transaction.payinCurrency === 'TB$' && props.transaction.payoutCurrency === 'USDC') {
    deductAmount(props.transaction.payinAmount)
    location.reload()
  }
  loading.value = false;
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

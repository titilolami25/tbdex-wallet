<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
    <h2 class="text-2xl font-bold mb-4">Transactions</h2>
    <div>
      <ul v-if="transactions.length">
        <li
          v-for="transaction in transactions"
          :key="transaction.id"
          @click="openTransactionModal(transaction)"
          class="flex items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 p-4 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer mb-2"
        >
          <div class="flex items-center gap-4">
            <div class="bg-gray-200 dark:bg-gray-700 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-gray-500 dark:text-gray-400">
                <path d="m22 2-7 20-4-9-9-4Z"></path>
                <path d="M22 2 11 13"></path>
              </svg>
            </div>
            <div>
              <div class="font-medium">{{ getStatusString(transaction) }}</div>
              <div class="text-gray-500 dark:text-gray-400 text-sm">{{ new Date(transaction.createdTime).toLocaleDateString(undefined, {dateStyle: 'medium'}) }}</div>
            </div>
          </div>
          <div v-if="transaction.status === 'quote'" className="w-1/5 flex items-center justify-end">
            <!-- <div className="h-auto w-auto mt-1.5 p-2 rounded-lg bg-neutral-700 text-white text-xs flex items-center justify-center">Review</div> -->
          </div>
        </li>
      </ul>
      <div v-else class="text-center text-gray-500">
        <Spinner v-if="transactionsLoading" />
        <p v-else>No transactions available</p>
      </div>
    </div>
    <TransactionModal v-if="selectedTransaction" :transaction="selectedTransaction" @close="closeTransactionModal" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from '~/store.js';
import Spinner from '~/components/Spinner.vue'
import TransactionModal from '~/components/TransactionModal.vue';

const { state, selectTransaction, pollExchanges } = useStore();
const transactions = computed(() => state.transactions);
const transactionsLoading = computed(() => state.transactionsLoading);
const selectedTransaction = ref(null);

const openTransactionModal = (transaction) => {
  selectedTransaction.value = transaction;
  selectTransaction(transaction);
};

const closeTransactionModal = () => {
  selectedTransaction.value = null;
  selectTransaction(null);
};

const getStatusString = (exchange) => {
  switch (exchange.status) {
    case 'rfq':
      return `Requested ${(exchange.payinAmount)} ${exchange.payinCurrency}`
    case 'quote':
      return `Quoted ${(exchange.payinAmount)} ${exchange.payinCurrency}`
    case 'order':
      return `Payment for ${(exchange.payinAmount)} ${exchange.payinCurrency} submitted`
    case 'orderstatus':
      return `Payment processing for ${(exchange.payinAmount)} ${exchange.payinCurrency}...`
    case 'completed':
      return `Sent ${(exchange.payinAmount)} ${exchange.payinCurrency}`
    case 'expired':
      return `Quote for ${(exchange.payinAmount)} ${exchange.payinCurrency} expired`
    case 'cancelled':
      return `Exchange for ${(exchange.payinAmount)} ${exchange.payinCurrency} was cancelled`
    case 'failed':
      return `Payment for ${(exchange.payinAmount)} ${exchange.payinCurrency} failed`
    default:
      return exchange.status
  }
}

onMounted(() => {
  console.log('Polling exchanges...');
  pollExchanges();
});
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-1 bg-gray-100 dark:bg-gray-800 py-8 px-6 md:px-8">
      <div class="max-w-3xl mx-auto grid gap-8">
        <!-- Step 1: Select From and To Currencies, Display Offerings -->
        <div v-if="step === 1" class="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Send Money</h2>
          <div v-if="state.payinCurrencies.length">
            <div class="mb-4">
              <label class="block text-gray-700 dark:text-gray-300 mb-2">From Currency</label>
              <select v-model="fromCurrency" @change="updateToCurrencies" class="w-full p-2 border rounded">
                <option disabled value="">Select currency</option>
                <option v-for="currency in state.payinCurrencies" :key="currency" :value="currency">{{ currency }}</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 dark:text-gray-300 mb-2">To Currency</label>
              <select v-model="toCurrency" :disabled="!isToCurrencyEnabled" class="w-full p-2 border rounded">
                <option disabled value="">Select currency</option>
                <option v-for="currency in state.payoutCurrencies" :key="currency" :value="currency">{{ currency }}</option>
              </select>
            </div>
            <button @click="getFilteredOfferings" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:bg-gray-800 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              Get Offerings
            </button>
          </div>

          <Spinner v-else />


          <div v-if="filteredOfferings.length" class="mt-4">
            <h2 class="text-2xl font-bold mb-4">Exchange Rate Offerings</h2>
            <ul>
              <li v-for="offering in filteredOfferings" :key="offering.id" @click="selectOffering(offering)" class="cursor-pointer p-4 border rounded mb-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <h3 class="font-bold">{{ state.pfiAllowlist.find(pfi => pfi.pfiUri === offering.metadata.from)?.pfiName }}</h3>
                <p>{{ offering.data.description }}</p>
                <p class="text-blue-500">{{ offering.data.payoutUnitsPerPayinUnit }} {{ offering.data.payout.currencyCode }} for 1 {{ offering.data.payin.currencyCode }}</p>
              </li>
            </ul>
          </div>
        </div>

        <!-- Step 2: Enter Transaction Details -->
        <div v-if="step === 2" class="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Enter Transaction Details</h2>
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">You Send ({{ offering?.data?.payin?.currencyCode }})</label>
            <input v-model="amount" @input="calculateTheyGet" type="number" required class="w-full p-2 border rounded disabled:bg-slate-200" :disabled="needsCredentials" />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">They Get ({{ offering?.data?.payout?.currencyCode }})</label>
            <input v-model="theyGet" type="number" disabled class="w-full p-2 border rounded disabled:bg-slate-200" />
          </div>
          <div class="mb-4 text-gray-700 dark:text-gray-300">
            Exchange Rate: {{ offering?.data?.payoutUnitsPerPayinUnit }} {{ offering?.data?.payout?.currencyCode }} for 1 {{ offering?.data?.payin?.currencyCode }}
          </div>
          <div v-for="(detail, key) in offering?.data?.payout?.methods[0]?.requiredPaymentDetails?.properties" :key="key" class="mb-4">
            <label :for="key" class="block text-gray-700 dark:text-gray-300 mb-2">{{ detail.title }}</label>
            <input v-model="paymentDetails[key]" :id="key" :type="detail.type" required class="w-full p-2 border rounded disabled:bg-slate-200" :disabled="needsCredentials" />
            <small class="block text-gray-500 dark:text-gray-400">{{ detail.description }}</small>
          </div>
          <p v-if="needsCredentials" class="text-xs text-red-400 mb-2">Required credentials are missing.</p>
          <button v-if="needsCredentials" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:bg-slate-400 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mr-2" @click="navigateTo('/credentials')">Verify Identity</button>
          <button v-if="!submitLoading" @click="validateAndSubmit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:bg-slate-400 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" :disabled="needsCredentials">
            Request for Quote
          </button>
            <Spinner v-else/>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import Header from '~/components/Header.vue';
import { useStore } from '~/store.js';
import { useRouter } from 'vue-router';
import { Verify, verify } from 'crypto';
import Spinner from '~/components/Spinner.vue';

const router = useRouter();
const { state, setOffering, createExchange, filterOfferings, satisfiesOfferingRequirements, getOfferingById } = useStore();

const step = ref(1);
const fromCurrency = ref('');
const toCurrency = ref('');
const isToCurrencyEnabled = ref(false);
const offering = ref(null);
const amount = ref('');
const theyGet = ref('');
const paymentDetails = ref({});
const filteredOfferings = ref([]);
const needsCredentials = computed(() => !satisfiesOfferingRequirements(offering.value, state.customerCredentials));
const isLoadingOfferings = computed(() => state.payinCurrencies.length == 0)
const submitLoading = ref(false);

watch(fromCurrency, () => {
  updateToCurrencies();
});

watch(isLoadingOfferings, () => {
  checkExistingSelectedOffering();
});

const updateToCurrencies = () => {
  if (fromCurrency.value) {
    const relevantOfferings = state.offerings.filter(offering =>
      offering.data.payin.currencyCode === fromCurrency.value
    );
    const payoutCurrencies = new Set();
    relevantOfferings.forEach(offering => {
      payoutCurrencies.add(offering.data.payout.currencyCode);
    });
    state.payoutCurrencies = Array.from(payoutCurrencies);
    isToCurrencyEnabled.value = true;
  } else {
    state.payoutCurrencies = [];
    isToCurrencyEnabled.value = false;
  }
};

const getFilteredOfferings = () => {
  if (fromCurrency.value && toCurrency.value) {
    filteredOfferings.value = filterOfferings(fromCurrency.value, toCurrency.value);
  }
};

const selectOffering = (selectedOffering) => {
  offering.value = selectedOffering;
  setOffering(selectedOffering);
  verifyCredentials();
  step.value = 2;
};

const calculateTheyGet = () => {
  if (amount.value && offering.value) {
    theyGet.value = (amount.value * offering.value.data.payoutUnitsPerPayinUnit).toFixed(2);
  }
};

const validateAndSubmit = () => {
  if (!amount.value) {
    alert('Please enter the amount.');
    return;
  }

  for (const key in offering.value.data.payout.methods[0].requiredPaymentDetails.properties) {
    if (!paymentDetails.value[key]) {
      alert(`Please enter ${offering.value.data.payout.methods[0].requiredPaymentDetails.properties[key].title}.`);
      return;
    }
  }

  submitRequest();
};

const submitRequest = async () => {
  submitLoading.value = true
  await createExchange(offering.value, amount.value, paymentDetails.value)
  router.push('/');
};

const verifyCredentials = () => {
  if (needsCredentials.value) {
    localStorage.setItem('selectedOffering', JSON.stringify(offering.value));
    router.push('/credentials');
  }
};

const checkExistingSelectedOffering = () => {
  if (localStorage.getItem('selectedOffering')) {
    const offeringObject = JSON.parse(localStorage.getItem('selectedOffering'));
    offering.value = getOfferingById(offeringObject.metadata.id);
    localStorage.removeItem('selectedOffering');
    step.value = 2;
  }
};
</script>

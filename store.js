import { reactive, watch, onMounted } from 'vue';
import { Close, Order, Rfq, TbdexHttpClient } from '@tbdex/http-client';
import { DidDht } from '@web5/dids';
import { Jwt, PresentationExchange } from '@web5/credentials';

// TODO 1: Choose Mock PFI DIDs using info about services they provide.
const mockProviderDids = {
  aquafinance_capital: {
    uri: 'did:dht:qewzcx3fj8uuq7y551deqdfd1wbe6ymicr8xnua3xzkdw4n6j3bo',
    name: 'AquaFinance Capital',
    description: 'Provides exchanges with the Ghanaian Cedis: GHS to USDC, GHS to KES'
  },
  swiftliquidity_solutions: {
    uri: 'did:dht:zz3m6ph36p1d8qioqfhp5dh5j6xn49cequ1yw9jnfxbz1uyfnddy',
    name: 'SwiftLiquidity Solutions',
    description: 'Offers exchange rates with the South African Rand: ZAR to BTC and EUR to ZAR.'
  },
  
  titanium_trust: {
    uri: 'did:dht:kuggrw7nx3n4ehz455stdkdeuaekfjimhnbenpo8t4xz9gb8qzyy',
    name: 'Titanium Trust',
    description: 'Provides offerings to exchange USD to African currencies - USD to GHS, USD to KES.'
  },
  // Add any new providers here
  new_provider: {
    uri: 'did:dht:new_provider_uri',
    name: 'New Provider',
    description: 'Description for the new providers.'
  }
};

export const useStore = () => {
  const state = reactive({
    balance: parseFloat(localStorage.getItem('walletBalance')) || 100,
    transactions: [],
    transactionsLoading: true,
    pfiAllowlist: Object.keys(mockProviderDids).map(key => ({
      pfiUri: mockProviderDids[key].uri,
      pfiName: mockProviderDids[key].name,
      pfiDescription: mockProviderDids[key].description,
    })),
    selectedTransaction: null,
    offering: null,
    payinCurrencies: [],
    payoutCurrencies: [],
    offerings: [],
    customerDid: null,
    customerCredentials: [],
  });

  const fetchOfferings = async () => {
    try {
      const allOfferings = [];
      for (const pfi of state.pfiAllowlist) {
        const pfiUri = pfi.pfiUri;
        // Fetch offerings from PFIs
        const offerings = await fetchOfferingsFromPfi(pfiUri);
        allOfferings.push(...offerings);
      }

      state.offerings = allOfferings;
      updateCurrencies(); // Ensure that new currencies are updated
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
    }
  };

  const createExchange = async (offering, amount, payoutPaymentDetails) => {
    // TODO 3: Choose only needed credentials to present using PresentationExchange.selectCredentials
    const selectedCredentials = [];

    // TODO 4: Create RFQ message to Request for a Quote
    const rfq = {};

    try {
      // TODO 5: Verify offering requirements with RFQ - rfq.verifyOfferingRequirements(offering)
    } catch (e) {
      // handle failed verification
      console.log('Offering requirements not met', e);
    }

    // TODO 6: Sign RFQ message

    console.log('RFQ:', rfq);

    try {
      // TODO 7: Submit RFQ message to the PFI .createExchange(rfq)
    } catch (error) {
      console.error('Failed to create exchange:', error);
    }
  };

  const fetchExchanges = async (pfiUri) => {
    try {
      // TODO 8: get exchanges from the PFI
      const exchanges = [];

      const mappedExchanges = formatMessages(exchanges);
      return mappedExchanges;
    } catch (error) {
      console.error('Failed to fetch exchanges:', error);
    }
  };

  const addClose = async (exchangeId, pfiUri, reason) => {
    // TODO 9: Create Close message, sign it, and submit it to the PFI
    const close = {};

    try {
      // send Close message
    } catch (error) {
      console.error('Failed to close exchange:', error);
    }
  };

  const addOrder = async (exchangeId, pfiUri) => {
    // TODO 10: Create Order message, sign it, and submit it to the PFI
    const order = {};

    try {
      // Send order message
    } catch (error) {
      console.error('Failed to submit order:', error);
    }
  };

  const pollExchanges = () => {
    const fetchAllExchanges = async () => {
      console.log('Polling exchanges again...');
      if (!state.customerDid) return;
      const allExchanges = [];
      try {
        for (const pfi of state.pfiAllowlist) {
          const exchanges = await fetchExchanges(pfi.pfiUri);
          allExchanges.push(...exchanges);
        }
        console.log('All exchanges:', allExchanges);
        updateExchanges(allExchanges.reverse());
        state.transactionsLoading = false;
      } catch (error) {
        console.error('Failed to fetch exchanges:', error);
      }
    };

    // Run the function immediately
    fetchAllExchanges();

    // Set up the interval to run the function periodically
    setInterval(fetchAllExchanges, 5000); // Poll every 5 seconds
  };

  // Beginning of Utils - functions that help with the app experience itself.
  const initializeDid = async () => {
    try {
      // Make sure to use a more secure Key Manager in production. More info: https://developer.tbd.website/docs/web5/build/decentralized-identifiers/key-management
      const storedDid = localStorage.getItem('customerDid');
      if (storedDid) {
        state.customerDid = await DidDht.import({ portableDid: JSON.parse(storedDid) });
      } else {
        state.customerDid = await DidDht.create({ options: { publish: true } });
        const exportedDid = await state.customerDid.export();
        localStorage.setItem('customerDid', JSON.stringify(exportedDid));
      }
    } catch (error) {
      console.error('Failed to initialize DID:', error);
    }
  };

  const formatMessages = (exchanges) => {
    const formattedMessages = exchanges.map(exchange => {
      const latestMessage = exchange[exchange.length - 1];
      const rfqMessage = exchange.find(message => message.kind === 'rfq');
      const quoteMessage = exchange.find(message => message.kind === 'quote');
      const status = generateExchangeStatusValues(latestMessage);
      const fee = quoteMessage?.data['payin']?.['fee'];
      const payinAmount = quoteMessage?.data['payin']?.['amount'];
      const payoutPaymentDetails = rfqMessage.privateData?.payout.paymentDetails;
      return {
        id: latestMessage.metadata.exchangeId,
        payinAmount: (fee ? Number(payinAmount) + Number(fee) : Number(payinAmount)).toString() || rfqMessage.data['payinAmount'],
        payinCurrency: quoteMessage.data['payin']?.['currencyCode'] ?? null,
        payoutAmount: quoteMessage?.data['payout']?.['amount'] ?? null,
        payoutCurrency: quoteMessage.data['payout']?.['currencyCode'],
        status,
        createdTime: rfqMessage.createdAt,
        ...latestMessage.kind === 'quote' && { expirationTime: quoteMessage.data['expiresAt'] ?? null },
        from: 'You',
        to: payoutPaymentDetails?.address || payoutPaymentDetails?.accountNumber + ', ' + payoutPaymentDetails?.bankName || payoutPaymentDetails?.phoneNumber + ', ' + payoutPaymentDetails?.networkProvider || 'Unknown',
        pfiDid: rfqMessage.metadata.to
      };
    });

    return formattedMessages;
  };

  const loadCredentials = () => {
    const storedCredentials = localStorage.getItem('customerCredentials');
    if (storedCredentials) {
      state.customerCredentials = JSON.parse(storedCredentials);
    } else {
      console.log('No credentials exist');
    }
  };

  const addCredential = (credential) => {
    state.customerCredentials.push(credential);
    localStorage.setItem('customerCredentials', JSON.stringify(state.customerCredentials));
  };

  const renderCredential = (credentialJwt) => {
    const vc = Jwt.parse({ jwt: credentialJwt }).decoded.payload['vc'];
    return {
      id: vc['@id'],
      type: vc['@type'],
      issuer: vc.issuer,
      credentialSubject: vc.credentialSubject,
    };
  };

  const updateExchanges = (exchanges) => {
    state.transactions = exchanges;
  };

  const updateCurrencies = () => {
    const payinCurrencies = new Set();
    const payoutCurrencies = new Set();

    state.offerings.forEach(offering => {
      payinCurrencies.add(offering.data.payin.currencyCode);
      payoutCurrencies.add(offering.data.payout.currencyCode);
    });

    state.payinCurrencies = Array.from(payinCurrencies);
    state.payoutCurrencies = Array.from(payoutCurrencies);
  };

  // Run initialization when component is mounted
  onMounted(() => {
    initializeDid();
    loadCredentials();
    fetchOfferings();
    pollExchanges();
  });

  // Watch for changes to the offerings to update currencies
  watch(() => state.offerings, updateCurrencies);

  return {
    state,
    createExchange,
    addClose,
    addOrder,
    fetchOfferings,
    updateExchanges,
    addCredential,
    renderCredential,
  };
};

import { reactive, watch,  } from 'vue';
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
  }
};
// The main store composable function
export const useStore = () => {
  const state = reactive({
    balance: parseFloat(localStorage.getItem('walletBalance') || '100'),
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

  const selectTransaction = (transaction) => {
    state.selectedTransaction = transaction;
  };

  const updateCurrencies = () => {
    const payinSet = new Set();
    const payoutSet = new Set();
    for (const offering of state.offerings) {
      offering.data.payin.methods.forEach(method => payinSet.add(method.kind));
      offering.data.payout.methods.forEach(method => payoutSet.add(method.kind));
    }
    state.payinCurrencies = Array.from(payinSet);
    state.payoutCurrencies = Array.from(payoutSet);
  };
// Fetch offerings from PFIs
  const fetchOfferings = async () => {
    try {
      const allOfferings = [];
      for (const pfi of state.pfiAllowlist) {
        //TO 2:
        const offerings = await TbdexHttpClient.getOfferings({
          pfiDid: pfi.pfiUri
        });

        allOfferings.push(...offerings);
      }
      state.offerings = allOfferings;
      updateCurrencies();
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
    }
  };
// Create an Exchange request
  const createExchange = async (offering, amount, payoutPaymentDetails) => {
    const selectedCredentials = PresentationExchange.selectCredentials({
      vcJwts: state.customerCredentials,
      presentationDefinition: offering.data.requiredClaims
    });
// 
    const rfq = Rfq.create({
      metadata: {
        from: state.customerDid.uri,
        to: offering.metadata.from,
        protocol: '1.0'
      },
      data: {

        offeringId: offering.id,
        payin: {
          amount: amount.toString(),
          kind: offering.data.payin.methods[0].kind,
          paymentDetails: {}
        },
        payout: {
          kind: offering.data.payout.methods[0].kind,
          paymentDetails: payoutPaymentDetails
        },
        claim: selectedCredentials
      }
    });
    console.log('RFQ before verification:', rfq);
    try {
      
      await rfq.verifyOfferingRequirements(offering);
    } catch (e) {
    console.error('Offering requirements not met:', e.message);
    }

    await rfq.verifyOfferingRequirements(offering);
    await rfq.sign(state.customerDid);
    console.log('RFQ:after signing:', rfq)

    try {
      //TO DO 7
      await TbdexHttpClient.createExchange(rfq);
      
    
      console.log('Exchange created successfully');
    } catch (error) {
      console.error('Failed to create exchange:', error.message);
      alert('Failed to create exchange. Please try again.');
    }

  };
// Fetch exchanges from PFIs
  const fetchExchanges = async (pfiUri) => {
    try {
       // Fetch exchanges from the PFI
      const exchanges = await TbdexHttpClient.getExchanges({
        pfiDid: pfiUri,
        did: state.customerDid
      });


      const mappedExchanges = formatMessages(exchanges)
      return mappedExchanges;
    } catch (error) {
      console.error('Failed to fetch exchanges:', error);
    }
  };
// Close an exchange
  const addClose = async (exchangeId, pfiUri, reason) => {
    
    const close = Close.create({
      metadata: {
        from: state.customerDid.uri,
        to: pfiUri,
        exchangeId,
        protocol: '1.0'
      },
      data: 
      { reason }
    });

    await close.sign(state.customerDid);
    try {
  // Send Close message to the PFI
      await TbdexHttpClient.submitClose(close);
    } 
    catch (error) {
      console.error('Failed to close exchange:', error);
    }
  };
// Place an order for an exchange
  const addOrder = async (exchangeId, pfiUri) => {
   
    const order = Order.create({
      metadata: {
        from: state.customerDid.uri,
        to: pfiUri,
        exchangeId,
        protocol: '1.0'
      }
    });

    await order.sign(state.customerDid);

    try {
      // Send order message to the PFI
      await TbdexHttpClient.submitOrder(order);
    } catch (error) {
      console.error('Failed to submit order:', error);
    }
  };

// Polling function to fetch exchanges repeatedly
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

  // Run the function immediately and every 5 seconds
  fetchAllExchanges();

 // set up internal to run function 
  setInterval(fetchAllExchanges, 5000);// Poll every 5 seconds
};
// Beginning of Utils - functions that help with the app experience itself.

// DID initialization
const initializeDid = async () => {
  try {
    // Ensure to use a more secure Key Manager in production. More info: https://developer.tbd.website/docs/web5/build/decentralized-identifiers/key-management
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
      const latestMessage = exchange[exchange.length - 1]
      const rfqMessage = exchange.find(message => message.kind === 'rfq')
      const quoteMessage = exchange.find(message => message.kind === 'quote')
      // console.log('quote', quoteMessage)
      const status = generateExchangeStatusValues(latestMessage)
      const fee = quoteMessage?.data['payin']?.['fee']
      const payinAmount = quoteMessage?.data['payin']?.['amount']
      const payoutPaymentDetails = rfqMessage.privateData?.payout.paymentDetails
      return {
        id: latestMessage.metadata.exchangeId,
        payinAmount: (fee ? Number(payinAmount) + Number(fee) : Number(payinAmount)).toString() || rfqMessage.data['payinAmount'],
        payinCurrency: quoteMessage.data['payin']?.['currencyCode'] ?? null,
        payoutAmount: quoteMessage?.data['payout']?.['amount'] ?? null,
        payoutCurrency: quoteMessage.data['payout']?.['currencyCode'],
        status,
        createdTime: rfqMessage.createdAt,
        ...latestMessage.kind === 'quote' && {expirationTime: quoteMessage.data['expiresAt'] ?? null},
        from: 'You',
        to: payoutPaymentDetails?.address || payoutPaymentDetails?.accountNumber + ', ' + payoutPaymentDetails?.bankName || payoutPaymentDetails?.phoneNumber + ', ' + payoutPaymentDetails?.networkProvider || 'Unknown',
        pfiDid: rfqMessage.metadata.to
      }
    })

    return formattedMessages;
}

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
  const vc = Jwt.parse({ jwt: credentialJwt }).decoded.payload['vc']
  return {
    title: vc.type[vc.type.length - 1].replace(/(?<!^)(?<![A-Z])[A-Z](?=[a-z])/g, ' $&'), // get the last credential type in the array and format it with spaces
    name: vc.credentialSubject['name'],
    countryCode: vc.credentialSubject['countryOfResidence'],
    issuanceDate: new Date(vc.issuanceDate).toLocaleDateString(undefined, {dateStyle: 'medium'}),
  }
}

  onMounted(async () => {
    await initializeDid();
    loadCredentials();
    fetchOfferings();
  });
  return {
    state,
    selectTransaction,
    createExchange,
    fetchExchanges,
    addOrder,
    addClose,
    fetchOfferings,
  };
};

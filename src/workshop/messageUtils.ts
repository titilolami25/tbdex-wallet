/* Use `TbdexHttpClient` to access convenience methods for creating and sending messages */

import { Close, Order, Rfq, TbdexHttpClient, CloseData, CreateRfqData } from '@tbdex/http-client'
import { BearerDid } from '@web5/dids'

export type SendRfqOptions = CreateRfqData & {
  didState: BearerDid,
  pfiUri: string
}

export type SendOrderOptions = {
  exchangeId: string,
  didState: BearerDid,
  pfiUri: string
}

export type SendCloseOptions = CloseData & {
  exchangeId: string,
  didState: BearerDid,
  pfiUri: string
}

export async function sendRFQ(opts: SendRfqOptions) {
  const {
    didState,
    pfiUri,
    offeringId,
    payin,
    payout,
    claims
  } = opts
  const rfq = Rfq.create(
    {
      metadata: {
        from: didState.uri,
        to: pfiUri,
        protocol: '1.0'
      },
      data: {
        offeringId,
        payin,
        payout,
        claims
      }
    }
  )
  await rfq.sign(didState)
  return await TbdexHttpClient.createExchange(rfq)
}

export async function sendOrder(opts: SendOrderOptions) {
  const {
    didState,
    pfiUri,
    exchangeId
  } = opts
  const order = Order.create(
    {
      metadata: {
        from: didState.uri,
        to: pfiUri,
        exchangeId
      },
    }
  )
  await order.sign(didState)
  return await TbdexHttpClient.submitOrder(order)
}

export async function sendClose(opts: SendCloseOptions) {
  const {
    didState,
    pfiUri,
    exchangeId,
    reason
  } = opts
  const close = Close.create(
    {
      metadata: {
        from: didState.uri,
        to: pfiUri,
        exchangeId
      },
      data: {
        reason
      }
    }
  )
  await close.sign(didState)
  return await TbdexHttpClient.submitClose(close)
}
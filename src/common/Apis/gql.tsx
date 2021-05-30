import { gql, ApolloClient, InMemoryCache } from '@apollo/client'
import * as Config from './Config'

let gqlMantleClient: any = undefined
let gqlPriceClient: any = undefined
export function setGql() {
  gqlMantleClient = new ApolloClient({
    uri: Config.currentDomain.gqlMantleClientDomain,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
      },
      query: {
        fetchPolicy: 'no-cache',
      },
    },
  })

  gqlPriceClient = new ApolloClient({
    uri: Config.currentDomain.gqlPriceClientDomain,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
      },
      query: {
        fetchPolicy: 'no-cache',
      },
    },
  })
}

export async function getBankBalancesAddress(address: string) {
  const query = gql`
    query($address: String!) {
      BankBalancesAddress(Address: $address) {
        Result {
          Amount
          Denom
        }
      }
    }
  `
  const result = await gqlMantleClient.query({
    query: query,
    variables: {
      address: address,
    },
  })

  return result.data.BankBalancesAddress.Result as []
}

export async function getTreasuryTaxRate() {
  const query = gql`
    query {
      TreasuryTaxRate {
        Result
      }
    }
  `
  const result = await gqlMantleClient.query({
    query: query,
  })
  return result.data.TreasuryTaxRate.Result
}

export async function getOracleDenomsExchangeRates() {
  const query = gql`
    query {
      OracleDenomsExchangeRates {
        Result {
          Amount
          Denom
        }
      }
    }
  `
  const result = await gqlMantleClient.query({
    query: query,
  })

  return result.data.OracleDenomsExchangeRates.Result as []
}

export async function getMarketSwap(offer: string, ask: string) {
  const query = gql`
    query($offer: String!, $ask: String!) {
      MarketSwap(OfferCoin: $offer, AskDenom: $ask) {
        Result {
          Amount
          Denom
        }
      }
    }
  `
  const result = await gqlMantleClient.query({
    query: query,
    variables: {
      offer: offer,
      ask: ask,
    },
  })

  return result.data.MarketSwap.Result
}

export async function getTreasuryTaxCapDenom(denom: string) {
  const query = gql`
    query($denom: String!) {
      TreasuryTaxCapDenom(Denom: $denom) {
        Result
      }
    }
  `
  const result = await gqlMantleClient.query({
    query: query,
    variables: {
      denom: denom,
    },
  })

  return result.data.TreasuryTaxCapDenom.Result
}

export async function getWasmContractsContractAddressStore(
  contract: string,
  msg: string
) {
  const query = gql`
    query($contract: String!, $msg: String!) {
      WasmContractsContractAddressStore(
        ContractAddress: $contract
        QueryMsg: $msg
      ) {
        Result
      }
    }
  `

  const result = await gqlMantleClient.query({
    query: query,
    variables: {
      contract: contract,
      msg: msg,
    },
  })

  return result.data.WasmContractsContractAddressStore.Result
}

export async function getPrice(
  contract: string,
  address: string,
  closeBalance: boolean = false
) {
  const now = new Date()
  let yesterday = now.setDate(now.getDate() - 1)

  if (closeBalance) {
    const day = 60 * 60 * 24 * 1000
    const min = now.getMinutes() - (now.getMinutes() % 10) + 10
    const close = new Date().setHours(now.getHours(), min, 0, 0) - day
    yesterday = close
  }

  const query = gql`
    query($contract: String!, $address: String!, $yesterday: Float!) {
      asset(token: $contract) {
        prices {
          price
          priceAt(timestamp: $yesterday)
        }
      }

      balance(address: $address, token: $contract) {
        averagePrice
      }
    }
  `
  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      contract: contract,
      address: address,
      yesterday: yesterday,
    },
  })

  return result.data
}

export async function getPriceAt(contract: string, timestamp: number) {
  // const DAY = 60 * 60 * 24 * 1000
  // const yesterday = Date.now() - DAY

  const query = gql`
    query($contract: String!, $timestamp: Float!) {
      asset(token: $contract) {
        prices {
          priceAt(timestamp: $timestamp)
        }
      }
    }
  `
  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      contract: contract,
      timestamp: timestamp,
    },
  })

  return result.data.asset.prices.priceAt
}

export async function getPriceHistory(
  contract: string,
  interval: string,
  from: string,
  to: string
) {
  const DAY = 60 * 60 * 24 * 1000

  const query = gql`
    query($contract: String!, $interval: Float!, $from: Float!, $to: Float!) {
      asset(token: $contract) {
        prices {
          history(interval: $interval, from: $from, to: $to) {
            timestamp
            price
          }
        }
      }
    }
  `
  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      contract: contract,
      interval: parseFloat(interval),
      from: parseFloat(from),
      to: parseFloat(to),
    },
  })

  return result.data
}

export async function getBalanceHistory(
  address: string,
  from: string,
  to: string,
  interval: string
) {
  const query = gql`
    query($address: String!, $from: Float!, $to: Float!, $interval: Float!) {
      balanceHistory(
        address: $address
        from: $from
        to: $to
        interval: $interval
      ) {
        timestamp
        value
      }
    }
  `

  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      address: address,
      from: parseFloat(from),
      to: parseFloat(to),
      interval: parseFloat(interval), //분단위.
    },
  })

  return result.data.balanceHistory
}

export async function getAssetInfo(contract: string) {
  const query = gql`
    query($contract: String!) {
      asset(token: $contract) {
        symbol
        name
        description
        news {
          datetime
          headline
          source
          url
        }
      }
    }
  `
  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      contract: contract,
    },
  })

  return result.data
}

export async function getAssetTokens() {
  const query = gql`
    query {
      assets {
        symbol
        token
      }
    }
  `
  const result = await gqlPriceClient.query({
    query: query,
  })

  return result.data
}

export async function getAssetBalances(
  address: string,
  close: boolean = false
) {
  const now = new Date()
  let yesterday = now.setDate(now.getDate() - 1)

  if (close) {
    const day = 60 * 60 * 24 * 1000
    const min = now.getMinutes() - (now.getMinutes() % 10) + 10
    const close = new Date().setHours(now.getHours(), min, 0, 0) - day
    yesterday = close
  }

  const query = gql`
    query($address: String!, $yesterday: Float!) {
      balances(address: $address) {
        token
        balance
        averagePrice
      }

      assets {
        token
        prices {
          price
          priceAt(timestamp: $yesterday)
        }
      }
    }
  `
  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      address,
      yesterday,
    },
  })

  return result.data
}

export async function getTxs(
  address: string,
  offset: number,
  limit: number,
  tag: string
) {
  const query = gql`
    query($address: String!, $offset: Float!, $tag: String!, $limit: Float!) {
      txs(account: $address, offset: $offset, tag: $tag, limit: $limit) {
        id
        height
        txHash
        address
        type
        token
        data
        datetime
        fee
        memo
      }
    }
  `

  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      address: address,
      offset: offset,
      tag: tag,
      limit: limit,
    },
  })

  return result.data
}

export async function getAccount(address: string) {
  const query = gql`
    query($address: String!) {
      account(address: $address) {
        address
        haveBalanceHistory
      }
    }
  `
  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      address: address,
    },
  })

  return result.data
}

export async function setConnect(address: string, email?: string) {
  const query = gql`
    mutation($address: String!, $email: String) {
      connect(address: $address, isAppUser: true, email: $email) {
        address
      }
    }
  `

  const result = await gqlPriceClient.mutate({
    mutation: query,
    variables: {
      address: address,
      email: email === undefined ? '' : email,
    },
  })

  return result.data
}

export async function getMoonpayHistory(address: string) {
  const query = gql`
    query($address: String!) {
      moonpayHistory(transactionId: $address, limit: 1)
    }
  `
  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      address: address,
    },
  })

  return result.data
}

export async function getTradingVolume(
  address: string,
  from: number,
  to: number
) {
  const query = gql`
    query($address: String!, $from: Float!, $to: Float!) {
      tradingVolume(address: $address, from: $from, to: $to)
    }
  `
  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      address: address,
      from: from,
      to: to,
    },
  })

  return result.data
}

export async function getCdps(tokens: string[]) {
  const query = gql`
    query($tokens: [String!]) {
      cdps(maxRatio: 9999, tokens: $tokens) {
        id
        address
        token
        mintAmount
        collateralToken
        collateralAmount
        collateralRatio
      }
    }
  `

  const result = await gqlPriceClient.query({
    query: query,
    variables: {
      tokens,
    },
  })

  return result.data
}

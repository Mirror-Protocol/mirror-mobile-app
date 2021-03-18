import * as Keychain from '../Keychain'
import * as Utils from '../Utils'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import base64 from 'base-64'
import * as Config from './Config'

import {
  LCDClient,
  Coin,
  MsgSend,
  StdFee,
  MsgExecuteContract,
  RawKey,
  MsgSwap,
} from '@terra-money/terra.js'
import * as gql from './gql'

let GAS_PRICES: any = undefined
export const gas = new BigNumber(333333)
export let fee: any = undefined

export function feeFromDenom(denom: string) {
  return new BigNumber(Math.ceil(gas.times(GAS_PRICES[denom]).toNumber()))
}

export async function setGasPrice() {
  GAS_PRICES = (await get(Config.currentDomain.gasPrices)).data
  fee = feeFromDenom(Keychain.baseCurrency)
}

let terra: any = undefined
export function setTerra() {
  terra = new LCDClient({
    URL: Config.currentDomain.chainDomain,
    chainID: Config.currentDomain.chainId,
  })
}

function buildUrl(baseUrl: string, queryParams: any) {
  let url = `${baseUrl}/?`
  let firstFlag = true

  for (const k of Object.keys(queryParams)) {
    const armoredKey = encodeURIComponent(k)
    const armoredData = encodeURIComponent(queryParams[k])
    url = `${url}${firstFlag ? '' : '&'}${armoredKey}=${armoredData}`
    firstFlag = false
  }

  return url
}

export async function getMoonpayUrl(usdAmount: number | null): Promise<string> {
  const queryParams: any = {
    apiKey: Config.moonpay.pk,
    walletAddress: await Keychain.getDefaultAddress(),
    currencyCode: Config.moonpay.currency,
    baseCurrencyCode: 'USD',
    externalTransactionId: await Keychain.getDefaultAddress(),
  }

  if (usdAmount != null) {
    queryParams['baseCurrencyCode'] = 'USD'
    queryParams['baseCurrencyAmount'] = `${usdAmount}`
  }

  const url = buildUrl(Config.moonpay.url, queryParams)
  const signerResp = await axios.get(Config.moonpay.urlsigner, {
    params: {
      url: url,
    },
  })

  return signerResp.data.result
}

async function get(address: string) {
  const response = await axios.get(address, {
    timeout: 30000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    validateStatus: (status): boolean => {
      return status == 200
    },
  })

  return response
}

export function getAssetIcon(symbol: string) {
  return Config.assetIconAddress.replace('$1', symbol)
}

export async function getPrivacy() {
  return await get(Config.agreement)
}

async function getWallet(pw: string) {
  const masterKey = pw
  const pk = await Keychain.getDefaultPrivateKey(masterKey)
  const pkArray: any = Utils.hexToArray(pk)
  const key = new RawKey(pkArray)
  const wallet = terra.wallet(key)
  return wallet
}

export async function getAddress() {
  return await Keychain.getDefaultAddress()
}

export async function getUstBalance(): Promise<BigNumber> {
  const coins = await getBalances()
  const uusd = coins.filter((item) => {
    return item.denom == 'uusd'
  })
  if (uusd.length > 0) {
    return new BigNumber(uusd[0].amount.toString())
  } else {
    return new BigNumber(0)
  }
}

export async function getSwapEstimate(
  amount: BigNumber,
  symbol: string
): Promise<{
  estimate: BigNumber
  spread: BigNumber
}> {
  let swapRate = await getSwapRate(amount, symbol)
  let rates = await getExchangeRates()

  let spread = new BigNumber(0)

  const rate_symbol = rates.filter((item) => {
    return item.denom == symbol
  })[0]

  const rate_base = rates.filter((item) => {
    return item.denom == Keychain.baseCurrency
  })[0]

  if (rate_symbol) {
    const rate = new BigNumber(rate_symbol.amount.toString())
    const luna = amount.dividedBy(rate)
    const converted = new BigNumber(rate_base.amount.toString()).multipliedBy(
      luna
    )

    const sp = converted
      .minus(new BigNumber(swapRate.amount.toString()))
      .dividedBy(1000000)
    spread = Utils.getCutNumber(sp, 6)
  }

  return {
    estimate: new BigNumber(swapRate.amount.toString()),
    spread: spread,
  }
}

export async function swap(pw: string, symbol: string, amount: BigNumber) {
  const wallet = await getWallet(pw)
  const swap = new MsgSwap(
    wallet.key.accAddress,
    new Coin(symbol, amount.toNumber()),
    Keychain.baseCurrency
  )

  const tx = await wallet.createAndSignTx({
    msgs: [swap],
    memo: '',
    fee: new StdFee(gas.toNumber(), [
      new Coin(Keychain.baseCurrency, fee.toNumber()),
    ]),
  })

  const response = await terra.tx.broadcast(tx)
  if (response.code) {
    throw new Error(response.raw_log)
  } else {
    return response
  }
}

export async function getBalances(): Promise<
  {
    amount: BigNumber
    denom: string
    converted: BigNumber
  }[]
> {
  const address = await getAddress()
  const coins: {
    amount: BigNumber
    denom: string
  }[] = (await gql.getBankBalancesAddress(address)).map((item: any) => {
    return {
      amount: new BigNumber(item.Amount),
      denom: item.Denom,
    }
  })

  let list: {
    amount: BigNumber
    denom: string
    converted: BigNumber
  }[] = []

  let rates = await getExchangeRates()
  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i]

    let converted = new BigNumber(0)

    if (coin.denom == Keychain.baseCurrency) {
      converted = coin.amount
    } else {
      let rate_amount = new BigNumber('0')
      let base_amount = new BigNumber('0')
      rates.map((item) => {
        if (item.denom == coin.denom) {
          rate_amount = new BigNumber(item.amount)
        } else if (item.denom == Keychain.baseCurrency) {
          base_amount = new BigNumber(item.amount)
        }
      })

      if (!rate_amount.isEqualTo(new BigNumber(0))) {
        const luna = coin.amount.dividedBy(rate_amount)
        converted = Utils.getCutNumber(base_amount.multipliedBy(luna), 0)
      }
    }

    list.push({
      amount: coin.amount,
      denom: coin.denom,
      converted: converted,
    })
  }

  return list
}

export async function getTaxRate() {
  const response = await gql.getTreasuryTaxRate()
  return new BigNumber(response)
}

async function getExchangeRates() {
  let rates = (await gql.getOracleDenomsExchangeRates()).map((item: any) => {
    return {
      amount: item.Amount,
      denom: item.Denom,
    }
  })

  rates.push({
    amount: '1',
    denom: 'uluna',
  })

  return rates
}

async function getSwapRate(amount: BigNumber, symbol: string) {
  const result = await gql.getMarketSwap(
    amount.toString() + symbol,
    Keychain.baseCurrency
  )
  const swapRate = {
    amount: result.Amount,
    denom: result.Denom,
  }

  return swapRate
}

export async function getTaxCap(denom: string): Promise<BigNumber> {
  const cap = await gql.getTreasuryTaxCapDenom(denom)
  return new BigNumber(cap)
}

export async function getAssetTokens(symbol: string): Promise<string> {
  const response = await gql.getAssetTokens()
  const assetList = response.assets

  for (let i = 0; i < assetList.length; ++i) {
    if (assetList[i].symbol === symbol) return assetList[i].token
  }

  throw new Error('Could not find tokens')
}

export async function getAssetBalances(): Promise<GQL_AssetList1[]> {
  const address = await getAddress()
  const response = await gql.getAssetBalances(address)
  const assetList = response.balances
  const priceList = response.assets

  const assets = await readMAssets()

  let list = []
  for (let i = 0; i < assetList.length; i++) {
    const asset = assetList[i]

    if (parseInt(asset.balance) <= 0) {
      continue
    }

    let assetMeta: MAssetModel

    const assetMetas = assets.filter((item) => {
      return item.token == asset.token
    })
    if (assetMetas.length == 0) {
      continue
    } else {
      assetMeta = assetMetas[0]
    }

    const priceMeta = priceList.filter((item: any) => {
      return item.token == asset.token
    })[0]

    const obj: GQL_AssetList1 = {
      symbol: assetMeta.symbol,
      name: assetMeta.name,
      category: '',
      price: priceMeta.prices.price,
      amount: asset.balance,
      yesterday: '0',
      dayDiff: '0',
      averagePrice: asset.averagePrice,
      ret: '0',
    }
    list.push(obj)
  }

  return list
}

export async function assetList(
  needBalance: boolean,
  closeBalance: boolean = false
) {
  const assetList = await readMAssets()

  let list = []
  for (let i = 0; i < assetList.length; i++) {
    const newItem = await assetItem(assetList[i], needBalance, closeBalance)

    list.push(newItem)
  }
  return list
}

export async function assetInfo(symbol: string) {
  const assetList = (await readMAssets()).filter((item) => {
    return item.symbol == symbol
  })
  return await assetItem(assetList[0], true)
}

async function assetItem(
  item: MAssetModel,
  needBalance: boolean,
  closeBalance: boolean = false
): Promise<GQL_AssetList1> {
  const address = await getAddress()
  const token_contract = item.token

  let amount = '0'
  let prices = {
    averagePrice: new BigNumber(0),
    ret: new BigNumber(0),
    price: new BigNumber(0),
    yesterday: new BigNumber(0),
    dayDiff: new BigNumber(0),
  }

  if (needBalance) {
    const balance = await terraWasmQuery(token_contract, {
      balance: {
        address: address,
      },
    })

    amount = balance.balance

    prices = await terraPriceQuery(token_contract, address, closeBalance)
  }

  const newItem: GQL_AssetList1 = {
    symbol: item.symbol,

    category: 'STOCK',
    name: item.name,
    amount: amount,
    price: prices.price.toString(),
    yesterday: prices.yesterday.toString(),
    dayDiff: prices.dayDiff.toString(),
    averagePrice: prices.averagePrice.toString(),
    ret: prices.ret.toString(),
  }

  return newItem
}

async function terraWasmQuery(contract: string, msg: any) {
  const result = await gql.getWasmContractsContractAddressStore(
    contract,
    JSON.stringify(msg)
  )
  return JSON.parse(result)
}

async function terraPriceQuery(
  contract: string,
  address: string,
  closeBalance: boolean = false
) {
  const result = await gql.getPrice(contract, address, closeBalance)

  const price = new BigNumber(result.asset.prices.price)

  let averagePrice = new BigNumber(0)
  if (result.balance && result.balance.averagePrice) {
    averagePrice = new BigNumber(result.balance.averagePrice)
  }

  let priceAt = new BigNumber(0)
  if (result.asset.prices.priceAt) {
    priceAt = new BigNumber(result.asset.prices.priceAt)
  }

  let dayDiff = new BigNumber(0)
  if (!priceAt.isEqualTo(new BigNumber(0))) {
    dayDiff = Utils.getCutNumber(price.dividedBy(priceAt).minus(1), 3)
  }

  let ret = new BigNumber(0)
  if (!averagePrice.isEqualTo(new BigNumber(0))) {
    ret = Utils.getCutNumber(price.dividedBy(averagePrice).minus(1), 4)
  }

  return {
    averagePrice: averagePrice,
    ret: ret,
    price: price,
    yesterday: priceAt,
    dayDiff: dayDiff,
  }
}

export enum ChartDataType {
  three_year = 'THREE_HOUR',
  day = 'ONE_DAY',
  week = 'ONE_WEEK',
  month = 'ONE_MONTH',
  year = 'ONE_YEAR',
}

export async function assetOther(symbol: string) {
  const contract = (await readMAssets()).filter((item) => {
    return item.symbol == symbol
  })[0]

  const response = await gql.getAssetInfo(contract.token)
  const desc = response.asset.description
  let news = (response.asset.news as []).map((item: any) => {
    const obj: AssetNewsModel = {
      timestamp: Date.parse(item.datetime),
      title: item.headline,
      url: item.url,
      source: item.source,
      summary: '',
      image: '',
    }

    return obj
  })

  const now = new Date().getTime()
  const sixMonthsAgo = now - 60 * 60 * 24 * 30 * 6 * 1000
  news = news.filter((item) => {
    return item.timestamp >= sixMonthsAgo
  })

  news = news.sort((item1, item2) => {
    return item1.timestamp < item2.timestamp ? 1 : 0
  })

  news = news.filter((item, index) => {
    return index < 5
  })

  return {
    desc: desc,
    news: news,
  }
}

export async function assetChart(
  symbol: string,
  range: ChartDataType
): Promise<GQL_AssetChartList> {
  const info = getChartRange(range)

  const contract = (await readMAssets()).filter((item) => {
    return item.symbol == symbol
  })[0]

  const response = await gql.getPriceHistory(
    contract.token,
    info.interval.toString(),
    info.from.toString(),
    info.to.toString()
  )

  const list: GQL_AssetChartData[] = response.asset.prices.history

  return refineChartData(list)
}

export async function summaryChart(
  range: ChartDataType
): Promise<GQL_AssetChartList> {
  const address = await getAddress()

  const info = getChartRange(range)

  const response: {
    timestamp: number
    value: string
  }[] = await gql.getBalanceHistory(
    address,
    info.from.toString(),
    info.to.toString(),
    info.interval.toString()
  )

  let list: GQL_AssetChartData[] = response.map((item) => {
    return {
      timestamp: item.timestamp,
      price: item.value,
    }
  })

  return refineChartData(list)
}

function getChartRange(
  range: ChartDataType
): { to: BigNumber; from: BigNumber; interval: number } {
  const DAY = new BigNumber(60 * 60 * 24 * 1000)

  const now = new Date()

  let to = new BigNumber(0)
  let from = new BigNumber(0)
  let interval = 0
  if (range == ChartDataType.day) {
    interval = 10

    const min = now.getMinutes() - (now.getMinutes() % interval)
    const newTo = new Date(
      new Date(now.setMinutes(min)).setSeconds(0)
    ).setMilliseconds(0)
    to = new BigNumber(newTo.toString())
    from = to.minus(DAY)
  } else if (range == ChartDataType.week) {
    interval = 60

    const min = now.getMinutes() - (now.getMinutes() % interval)
    const newTo = new Date(
      new Date(now.setMinutes(min)).setSeconds(0)
    ).setMilliseconds(0)
    to = new BigNumber(newTo.toString())
    from = to.minus(DAY.multipliedBy(7))
  } else if (range == ChartDataType.month) {
    interval = 240

    const min = now.getMinutes() - (now.getMinutes() % 30)
    const newTo = new Date(
      new Date(now.setMinutes(min)).setSeconds(0)
    ).setMilliseconds(0)
    to = new BigNumber(newTo.toString())
    from = to.minus(DAY.multipliedBy(30))
  } else if (range == ChartDataType.year) {
    interval = 1440 * 2

    const min = now.getMinutes() - (now.getMinutes() % 30)
    const newTo = new Date(
      new Date(now.setMinutes(min)).setSeconds(0)
    ).setMilliseconds(0)
    to = new BigNumber(newTo.toString())
    from = to.minus(DAY.multipliedBy(365))
  } else if (range == ChartDataType.three_year) {
    interval = 1440 * 7

    const min = now.getMinutes() - (now.getMinutes() % 30)
    const newTo = new Date(
      new Date(now.setMinutes(min)).setSeconds(0)
    ).setMilliseconds(0)
    to = new BigNumber(newTo.toString())
    from = to.minus(DAY.multipliedBy(365).multipliedBy(3))
  }

  return {
    to: to,
    from: from,
    interval: interval,
  }
}

function refineChartData(list: GQL_AssetChartData[]): GQL_AssetChartList {
  let minValue = new BigNumber('99999999999999999999999999999999')
  let maxValue = new BigNumber('0')
  let minIndex = 0
  let maxIndex = 0
  for (let i = 0; i < list.length; i++) {
    const price = new BigNumber(list[i].price)
    if (price.isGreaterThan(maxValue)) {
      maxValue = price
      maxIndex = i
    }
    if (price.isLessThan(minValue)) {
      minValue = price
      minIndex = i
    }
  }

  const simplified = list
    .filter((item, index) => index % 6 == 0)
    .map((item) => ({
      price: item.price,
      timestamp: item.timestamp,
    }))

  if (simplified.length > 0) {
    simplified[Math.floor(minIndex / 6)].price = minValue.toString()
    simplified[Math.floor(maxIndex / 6)].price = maxValue.toString()
  }

  return {
    list,
    simplified,
    minValue: minValue.toString(),
    maxValue: maxValue.toString(),
  }
}

async function readMAssets(): Promise<MAssetModel[]> {
  const response = await get(Config.assetsAddress)

  const json = response.data.whitelist
  let result: MAssetModel[] = []
  for (const key in json) {
    let obj: MAssetModel = {
      symbol: json[key].symbol,
      name: json[key].name,
      address: key,
      token: json[key].token,
      pair: json[key].pair,
      lptoken: json[key].lpToken,
    }
    result.push(obj)
  }
  return result
}

export async function buysellSimulate(
  isBuy: boolean,
  symbol: string,
  amount: BigNumber
): Promise<{
  return_amount: string
  spread_amount: string
  commission_amount: string
}> {
  const contract = (await readMAssets()).filter((item) => {
    return item.symbol == symbol
  })[0]

  const info = isBuy
    ? { native_token: { denom: Keychain.baseCurrency } }
    : { token: { contract_addr: contract.address } }

  const response: {
    return_amount: string
    spread_amount: string
    commission_amount: string
  } = await terraWasmQuery(contract.pair, {
    simulation: {
      offer_asset: {
        info: info,
        amount: amount.toString(),
      },
    },
  })

  return response
}

export async function calcBuyFeeTax(
  _amount: BigNumber,
  _denom: string
): Promise<{ amount: BigNumber; fee: BigNumber; tax: BigNumber }> {
  const amount = _amount.minus(fee)

  const taxRate = await getTaxRate()
  const taxCap = await getTaxCap(Keychain.baseCurrency)

  const calculatedAmount1 = amount.dividedBy(taxRate.plus(1))
  const calculatedAmount2 = amount.minus(taxCap)
  const calculatedAmount = Utils.getCutNumber(
    BigNumber.max(calculatedAmount1, calculatedAmount2),
    0
  )

  const tax = _amount.minus(calculatedAmount).minus(fee)

  return {
    amount: calculatedAmount,
    fee: fee,
    tax: tax,
  }
}

export async function buy(
  pw: string,
  price: BigNumber,
  symbol: string,
  amount: BigNumber,
  fee: BigNumber,
  tax: BigNumber
) {
  const contract = (await readMAssets()).filter((item) => {
    return item.symbol == symbol
  })[0]

  const wallet = await getWallet(pw)
  const msg = new MsgExecuteContract(
    wallet.key.accAddress,
    contract.pair,
    {
      swap: {
        belief_price: Utils.getCutNumber(price, 18).toString(),
        max_spread: '0.01',
        offer_asset: {
          info: { native_token: { denom: Keychain.baseCurrency } },
          amount: amount.toString(),
        },
      },
    },
    [new Coin(Keychain.baseCurrency, amount.toNumber())]
  )

  const tx = await wallet.createAndSignTx({
    msgs: [msg],
    memo: '',
    fee: new StdFee(gas.toNumber(), [
      new Coin(Keychain.baseCurrency, fee.plus(tax).toNumber()),
    ]),
  })
  const response = await terra.tx.broadcast(tx)
  if (response.code) {
    throw new Error(response.raw_log)
  } else {
    return response
  }
}

export async function sell(
  pw: string,
  price: BigNumber,
  symbol: string,
  amount: BigNumber,
  fee: BigNumber
) {
  const contract = (await readMAssets()).filter((item) => {
    return item.symbol == symbol
  })[0]

  const wallet = await getWallet(pw)
  const msg = new MsgExecuteContract(
    wallet.key.accAddress,
    contract.address,
    {
      send: {
        amount: amount.toString(),
        contract: contract.pair,
        msg: base64.encode(
          '{"swap":{"belief_price":"' +
            Utils.getCutNumber(price, 18).toString() +
            '", "max_spread":"0.01"}}'
        ),
      },
    },
    []
  )

  const tx = await wallet.createAndSignTx({
    msgs: [msg],
    memo: '',
    fee: new StdFee(gas.toNumber(), [
      new Coin(Keychain.baseCurrency, fee.toNumber()),
    ]),
  })

  const response = await terra.tx.broadcast(tx)
  if (response.code) {
    throw new Error(response.raw_log)
  } else {
    return response
  }
}

export async function transfer(
  pw: string,
  to: string,
  amount: BigNumber,
  denom: string,
  fee: BigNumber,
  feeDenom: string,
  tax: BigNumber,
  memo: string
) {
  const wallet = await getWallet(pw)
  let msg: any

  if (denom.startsWith('m') || denom.toLowerCase() === 'mir') {
    const contract = (await readMAssets()).filter((item) => {
      return item.symbol == denom
    })[0]

    msg = new MsgExecuteContract(
      wallet.key.accAddress,
      contract.token,
      {
        transfer: { recipient: to, amount: amount.toString() },
      },
      []
    )
  } else {
    msg = new MsgSend(wallet.key.accAddress, to, [
      new Coin(denom, amount.toNumber()),
    ])
  }

  const tx = await wallet.createAndSignTx({
    msgs: [msg],
    memo: memo,
    fee: new StdFee(gas.toNumber(), [
      denom.startsWith('m') || denom.toLowerCase() === 'mir'
        ? new Coin(feeDenom, fee.plus(tax).toNumber())
        : new Coin(feeDenom, feeFromDenom(denom).plus(tax).toNumber()),
    ]),
  })

  const response = await terra.tx.broadcast(tx)

  if (response.code) {
    throw new Error(response.raw_log)
  } else {
    return response
  }
}

export enum HistoryType {
  ALL = 'All',
  BUY = 'Buy',
  SELL = 'Sell',
  SWAP = 'Swap',
  DEPOSIT = 'Deposit',
  WITHDRAW = 'Withdraw',
  REGISTRATION = 'REGISTRATION',
}

export async function get_history(offset: number, limit: number, tag: string) {
  const address = await getAddress()
  const txs = (await gql.getTxs(address, offset, limit, tag)).txs
  const assets = await readMAssets()

  let list: GQL_TxModel[] = []
  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i]

    const filteredAsset = assets.filter((item) => {
      return item.token == tx.token
    })

    if (tx.token != null && filteredAsset.length <= 0) {
      continue
    }

    const asset = filteredAsset[0]

    let type = ''
    let amount = '0'
    let denom = 'uusd'
    let converted = '0'
    let convertedDenom = ''

    let price = '0'
    let txAddress = ''

    let feeAmount = '0'
    let feeDenom = 'uusd'

    const timestamp = Date.parse(tx.datetime) / 1000

    const txFee = tx.fee as string
    if (txFee != '') {
      const fee = txFee.split(',')[0].trim()

      for (let i = 0; i < fee.length; i++) {
        const n = parseInt(fee.charAt(i))
        if (isNaN(n)) {
          feeAmount = fee.substring(0, i)
          feeDenom = fee.substring(i, fee.length)
          break
        }
      }
    }

    if (tx.type == 'BUY') {
      type = HistoryType.BUY

      amount = tx.data.returnAmount
      denom = asset.symbol
      price = tx.data.price
      converted = tx.data.offerAmount
    } else if (tx.type == 'SELL') {
      type = HistoryType.SELL

      amount = tx.data.returnAmount
      denom = asset.symbol
      price = tx.data.price
      converted = tx.data.offerAmount
    } else if (tx.type == 'SEND') {
      type = HistoryType.WITHDRAW

      const priceAt = await gql.getPriceAt(tx.token, timestamp * 1000)

      txAddress = tx.data.to

      amount = tx.data.amount
      denom = asset.symbol
      price = priceAt.toString()
      converted = new BigNumber(price)
        .multipliedBy(new BigNumber(amount))
        .toString()
    } else if (tx.type == 'RECEIVE') {
      type = HistoryType.DEPOSIT

      const priceAt = await gql.getPriceAt(tx.token, timestamp * 1000)

      txAddress = tx.data.from

      amount = tx.data.amount
      denom = asset.symbol
      price = priceAt.toString()
      converted = new BigNumber(price)
        .multipliedBy(new BigNumber(amount))
        .toString()
    } else if (tx.type == 'TERRA_SWAP') {
      type = HistoryType.SWAP
      if (tx.data.offer == undefined || tx.data.offer == null) {
        continue
      }

      const offer = tx.data.offer
      for (let i = 0; i < offer.length; i++) {
        const n = parseInt(offer.charAt(i))
        if (isNaN(n)) {
          amount = offer.substring(0, i)
          denom = offer.substring(i, offer.length)
          break
        }
      }

      const swap = tx.data.swapCoin
      for (let i = 0; i < swap.length; i++) {
        const n = parseInt(swap.charAt(i))
        if (isNaN(n)) {
          converted = swap.substring(0, i)
          convertedDenom = swap.substring(i, swap.length)
          break
        }
      }
    } else if (tx.type == 'TERRA_SEND') {
      type = HistoryType.WITHDRAW

      txAddress = tx.data.to
      denom = tx.data.denom
      converted = tx.data.amount
    } else if (tx.type == 'TERRA_RECEIVE') {
      type = HistoryType.DEPOSIT

      txAddress = tx.data.from
      denom = tx.data.denom
      converted = tx.data.amount
    } else if (tx.type == 'REGISTRATION') {
      type = HistoryType.REGISTRATION
    } else {
      continue
    }

    const item: GQL_TxModel = {
      type: type,
      address: txAddress,
      amount: {
        amount: amount,
        denom: denom,
        converted: converted,
        convertedDenom: convertedDenom,
      },
      fee: {
        amount: feeAmount,
        denom: feeDenom,
      },
      price: price,
      memo: tx.memo ? tx.memo : '',
      hash: tx.txHash,
      timestamp: timestamp.toString(),
    }
    list.push(item)
  }

  return list
}

export async function getHaveBalanceHistory(): Promise<boolean> {
  const address = await getAddress()
  const response = await gql.getAccount(address)
  if (response.account == null) {
    return false
  }
  return response.account.haveBalanceHistory
}

export async function setConnect(email?: string) {
  const address = await getAddress()
  return await gql.setConnect(address, email)
}

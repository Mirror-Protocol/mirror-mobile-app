interface ResponseModel {
  statusCode: number
  body: any
}

interface GQL_TxModel {
  type: string
  address: string
  amount: {
    amount: string
    denom: string
    converted: string
    convertedDenom: string
  }
  fee: {
    amount: string
    denom: string
  }
  price: string
  memo: string
  hash: string
  timestamp: string
}

type AssetStatus = 'LISTED' | 'DELISTED'

interface GQL_AssetList1 {
  token: string
  symbol: string
  name: string
  category: string
  price: string
  amount: string
  yesterday: string
  dayDiff: string
  averagePrice: string
  ret: string
  status: AssetStatus
}

interface GQL_AssetChartData {
  timestamp: number
  price: string
}

interface GQL_AssetChartList {
  list: GQL_AssetChartData[]
  simplified: GQL_AssetChartData[]
  minValue: string
  maxValue: string
}

interface DoNotShowDelistToken {
  token: string
}

interface DelistMAssetModel {
  token: string
  symbol: string
  date: string
  ratio: string
}

interface MAssetModel {
  symbol: string
  name: string
  address: string
  token: string
  pair: string
  lptoken: string
  status: AssetStatus
}

interface AssetNewsModel {
  timestamp: number
  title: string
  url: string
  source: string
  summary: string
  image: string
}

interface CDP {
  address: string
  collateralAmount: string
  collateralRatio: string
  collateralToken: string
  id: string
  mintAmount: string
  token: string
}

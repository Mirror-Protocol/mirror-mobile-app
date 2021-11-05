import {
  LazyGradedVestingAccount,
  LCDClient,
  LCDClientConfig,
  MnemonicKey,
} from '@terra-money/terra.js'
import wordlist from './wordlist.json'

/**
 * Checks a mnemonic to ensure it conforms to standard Terra-recommended format. Expects
 * a space-separated list of 24-words of a predefined wordlist.
 *
 * @param mnemonic mnemonic to check
 * @returns whether mnemonic is proper
 */
export const validateMnemonic = (mnemonic: string) => {
  const array = mnemonic.split(' ')
  return array.every((word) => wordlist.includes(word)) && array.length === 24
}

/**
 * Retrieves assets for both standard Terra HD path (m/44'/330'/0'/0) and legacy HD paths
 * (m/44'/118'/0'/0).
 *
 * @param mnemonic mnemonic phrase
 * @param lcdClientConfig LCDClient configuration
 * @returns object containing keys with vesting, balance, delegations and unbonding delegations
 */
export const getMnemonicKeys = async (
  mnemonic: string,
  lcdClientConfig: LCDClientConfig
) => {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic')
  }

  const mk118 = new MnemonicKey({ mnemonic, coinType: 118 })
  const mk330 = new MnemonicKey({ mnemonic, coinType: 330 })

  const terra = new LCDClient(lcdClientConfig)

  const getAssets = async (address: string) => {
    const acct = await terra.auth.accountInfo(address)
    return {
      vestingSchedules:
        acct instanceof LazyGradedVestingAccount
          ? acct.vesting_schedules
          : undefined,
      balance: await terra.bank.balance(address),
      delegations: await terra.staking.delegations(address),
      unbondingDelegations: await terra.staking.unbondingDelegations(address),
    }
  }

  return {
    118: { mnemonicKey: mk118, assets: await getAssets(mk118.accAddress) },
    330: { mnemonicKey: mk330, assets: await getAssets(mk330.accAddress) },
  }
}

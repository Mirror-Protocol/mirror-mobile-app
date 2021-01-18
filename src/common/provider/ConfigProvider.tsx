import React, { createContext, useState } from 'react'
import LocalizedStrings from 'react-native-localization'

import * as Keychain from '../Keychain'
import { en, ko } from '../Localization'

enum Language {
  English = 0,
  Korean = 1,
}

enum LanguageSymbol {
  English = 'en',
  Korean = 'ko',
}

export function ConfigProvider(props: { children: any }) {
  // 9
  const [appLanguage, setAppLanguage] = useState(0)
  const [pw, setPw] = useState('')

  function setLanguage(language: Language) {
    switch (language) {
      case Language.English:
        translations.setLanguage(LanguageSymbol.English)
        break
      case Language.Korean:
        translations.setLanguage(LanguageSymbol.Korean)
        break
    }
    setAppLanguage(language)
    Keychain.setLocalePref(language)
  }

  async function initializeConfig() {
    const currentLanguage: number = await Keychain.getLocalePref()
    const language: Language = currentLanguage
    setLanguage(language)
  }

  return (
    <ConfigContext.Provider
      value={{
        pw: pw,
        setPw: setPw,
        translations,
        setAppLanguage: setLanguage,
        appLanguage: appLanguage,
        initializeConfig,
      }}
    >
      {props.children}
    </ConfigContext.Provider>
  )
}

const languages = { en, ko }
const translations = new LocalizedStrings(languages)

export const ConfigContext = createContext({
  pw: '',
  setPw: (password: string) => {},
  translations,
  setAppLanguage: (language: number) => {},
  appLanguage: 0,
  initializeConfig: () => {},
})

import React, { createContext, useState } from 'react'
import * as Resources from '../Resources'

export function NotificationProvider(props: { children: any }) {
  const [isShowDialog, setDialogShow] = useState(false)
  const [notificationInfo, setNotificationInfo] = useState({
    message: '',
    color: '',
    onPressed: () => {},
  })

  function showNotification(
    message: string,
    color: string,
    onPressed: () => void = () => {}
  ) {
    setNotificationInfo({
      message: message,
      color: color,
      onPressed: onPressed,
    })

    setDialogShow(true)
  }

  function hide() {
    setNotificationInfo({
      message: '',
      color: '',
      onPressed: () => {},
    })
    setDialogShow(false)
  }

  return (
    <NotificationContext.Provider
      value={{
        showNotification: showNotification,
        hideNotification: hide,
        isShowNotification: isShowDialog,
        notificationInfo: notificationInfo,
      }}
    >
      {props.children}
    </NotificationContext.Provider>
  )
}

export const NotificationContext = createContext({
  showNotification: (
    message: string,
    color: string,
    onPressed: () => void = () => {}
  ) => {},

  hideNotification: () => {},
  isShowNotification: false,
  notificationInfo: {
    message: '',
    color: Resources.Colors.brightPink,
    onPressed: () => {},
  },
})

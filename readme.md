# Mirror Mobile App

## Prerequisites

### Android
-   Android Studio 3.6.1 or later

### iOS
-   XCode 11.0 or later
-   Cocoapods 1.9.1 or later

### React Native
-   Node.js v12.16.1 or later

## Installation
1. `git clone`
2. `npm install`
3. `cd ios && pod install && cd ..` // (to install iOS libraries.)
4. `npm start`

## How to run on Android

### Run in the Debug(development) environment
Run android studio -> open up the project > build(Ctrl or cmd + R)
> You must add your ip address to 'network_security_config.xml'
> App resources will be synchronized with developing computer

### Run in the Release environment
1. Click 'Build Variants'(located left vertical menu)
2. Change value 'debug' to 'release' from 'Active Build Variant' of 'app' Module
3. Build (Ctrl or cmd + R)

### How to build APK
1. Click 'Build' menu
2. Click 'Generate Signed Bundle(s) / APK(s)'
3. Select 'APK'
4. Check environment values
 - 'Key store path' = '{your path}/mirror-app/android/keystore'
 - 'Key store password' = 'mynamefelix'
 - 'Key alias' = 'mirror'
 - 'Key password' = 'mynamefelix'
> the keystore should be managed securely and privately
5. In the next screen, check the 'Signature Versions'.
6. Click Finish

## How to run on Apple iOS

Run XCode -> build(Cmd + R) -> run by phone

1. Click 'Product' -> 'Scheme' -> 'Edit Scheme...'
2. Change value 'Debug' to 'Release' from 'Build Configuration'
3. Build (Cmd + R) -> run by phone.

### Publishing

1. Click 'XCode' -> 'Preferences...' -> 'Accounts' tab
2. Add your apple account(this account must be added KysenTechnologies member and have permissions)
3. Click 'Download Manual Profiles'
4. Build binary. Click 'Product' -> 'Archive'.
5. Click 'Window' -> 'Organizer'. You can see Built Acrhives.
6. Choose Archive and Click 'Distribute App'
7. Click 'App Store Connect' -> 'Upload' -> Check prefer options(recommend check all) -> 'Automatically manage signing' -> 'Upload'
8. Go to 'https://appstoreconnect.apple.com' and login. You can request Testflight or AppReview

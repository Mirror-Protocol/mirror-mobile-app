import Foundation
/*
 bridging header에
 #import <TrezorCrypto/TrezorCrypto.h>
 #import <React/RCTBridgeModule.h>
 추가할것.
*/

@objc(TerraWallet)
class TerraWallet: NSObject {
  
  
    static func moduleName() -> String! {
        return "TerraWallet";
    }

    static func requiresMainQueueSetup() -> Bool {
        //If your module does not require access to UIKit, then you should respond to + requiresMainQueueSetup with NO.
        return false
    }
  
    @objc func isValidAddress(_ address:String,
                              resolver: RCTPromiseResolveBlock,
                              rejecter:RCTPromiseRejectBlock) {
        let result = TerraWalletSDK.isValidAddress(address);
        resolver(result);
    }
}

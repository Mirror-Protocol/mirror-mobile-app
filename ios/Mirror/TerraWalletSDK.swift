//
//  TerraWalletSDK.swift
//  TerraWalletSDK
//
//  Created by Felix on 04/07/2020.
//  Copyright (c) 2020 TerraFormLabs. All rights reserved.
//

import Foundation

@objc public class TerraWalletSDK : NSObject {
    
    @objc static public func isValidAddress(_ address:String) -> Bool {
        return Utils.isValidAddress(address: address)
    }
}

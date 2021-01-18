//
//  TerraWallet.m
//  Harvest
//
//  Created by Felix on 2020/04/03.
//

//method export를 위함.

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TerraWallet, NSObject)

+ (BOOL)requiresMainQueueSetup
{
  return false;  // only do this if your module initialization relies on calling UIKit!
}

RCT_EXTERN_METHOD(isValidAddress:(NSString *)address
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

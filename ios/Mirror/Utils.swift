import Foundation
import CommonCrypto


class Utils {
    static func bech32(prefix:String, data:Data) -> Data {
        let prefix = prefix.data(using: .utf8)!
        var result = Data(repeating: 0, count: 44)
      
        data.withUnsafeBytes { (ptr) in
            prefix.withUnsafeBytes { (ptrPrefix) in
                result.withUnsafeMutableBytes { (keyPtr) in
                  bech32_encode(keyPtr, ptrPrefix, ptr, 32)
                }
            }
        }
        
        return result;
    }
  
    static func isValidAddress(address:String) -> Bool {
        guard let addressBytes = address.data(using: .utf8) else {
            return false
        }
        
        var prefixData = Data(repeating: 0, count: 10)
        var outputdata = Data(repeating: 0, count: 32)
        var length = Data(repeating: 0, count: 1)
        
        prefixData.withUnsafeMutableBytes { (prefix) in
          outputdata.withUnsafeMutableBytes { (out) in
            length.withUnsafeMutableBytes { (length) in
              addressBytes.withUnsafeBytes { (address) in
                bech32_decode(prefix, out, length, address)
              }
            }
          }
        }
      
        guard let prefix = String(data: prefixData, encoding: .utf8) else {
            return false
        }
      
        let bech32Result = bech32(prefix: prefix, data: outputdata)
        guard let recovered = String(data: bech32Result, encoding: .utf8) else {
            return false
        }
        
        return recovered == address
    }
}

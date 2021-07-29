package io.kysenpool.mirror.android.KeystoreLib;

@Deprecated
public interface StorageCipher {
  byte[] encrypt(byte[] input) throws Exception;

  byte[] decrypt(byte[] input) throws Exception;
}

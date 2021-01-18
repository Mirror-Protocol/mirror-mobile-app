package io.kysenpool.mirror.android.RnKeystoreLib;

public interface StorageCipher {
    byte[] encrypt(byte[] input) throws Exception;

    byte[] decrypt(byte[] input) throws Exception;
}

import _sodium from "libsodium-wrappers"

const initSodium = async () => {
  await _sodium.ready;
  return _sodium;
}

const encrypt = async (message: string, SK: Uint8Array, AD: Uint8Array) => {
  const sodium = await initSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_IETF_NPUBBYTES);

  const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      message,
      AD,
      null,
      nonce,
      SK
  );
  
  return sodium.to_hex(nonce) + sodium.to_hex(encrypted);
}

const decrypt = async (encrypted: string, SK: Uint8Array, AD: Uint8Array) => {
  const sodium = await initSodium();
  const sep = sodium.crypto_aead_xchacha20poly1305_IETF_NPUBBYTES * 2;
  const nonce = sodium.from_hex(encrypted.slice(0, sep));
  const ciphertext = sodium.from_hex(encrypted.slice(sep));

  const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      AD,
      nonce,
      SK
  );

  return new TextDecoder().decode(decrypted);
}

export { encrypt, decrypt }
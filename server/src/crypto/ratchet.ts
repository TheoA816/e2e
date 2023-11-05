import _sodium from "libsodium-wrappers";
import { encrypt as encryptMssg, decrypt as decryptMssg } from "./encryption";

class Ratchet {

  ck: string;

  constructor (init_key: string) {
    this.ck = init_key;
  }

  async initSodium() {
    await _sodium.ready;
    return _sodium;
  }

  async next () {
    const sodium = await this.initSodium();
    const next_ck = sodium.crypto_kdf_derive_from_key(32, 1, '___ck___', sodium.from_hex(this.ck));
    const next_mk = sodium.crypto_kdf_derive_from_key(32, 1, '___mk___', sodium.from_hex(this.ck));
    this.ck = sodium.to_hex(next_ck);
    return next_mk;
  }
}

class UserRatchets {

  send_ratchet: Ratchet = null!;
  rec_ratchet: Ratchet = null!;
  AD: Uint8Array  = null!;

  constructor () {}

  async initSodium() {
    await _sodium.ready;
    return _sodium;
  }

  async init (SK: string, is_sender: boolean, sender: string, receiver: string) {
    const sodium = await this.initSodium();
    const send_ck = sodium.crypto_kdf_derive_from_key(32, (is_sender) ? 1 : 2, '___ck___', sodium.from_hex(SK));
    const recv_ck = sodium.crypto_kdf_derive_from_key(32, (is_sender) ? 2 : 1, '___ck___', sodium.from_hex(SK));
    this.send_ratchet = new Ratchet(sodium.to_hex(send_ck));
    this.rec_ratchet = new Ratchet(sodium.to_hex(recv_ck));
    this.AD = new TextEncoder().encode(sender + receiver);
  }

  async restore (send_ck: string, recv_ck: string, sender: string, receiver: string) {
    this.send_ratchet = new Ratchet(send_ck);
    this.rec_ratchet = new Ratchet(recv_ck);
    this.AD = new TextEncoder().encode(sender + receiver);
  }

  async encrypt (message: string) {
    const mk = await this.send_ratchet.next();
    // console.log("Encrypt MK ", mk, " AD ", this.AD, " ENCRYPTED ", await encryptMssg(message, mk, this.AD));
    return await encryptMssg(message, mk, this.AD);
  }

  async decrypt (encrypted: string) {
    const mk = await this.rec_ratchet.next();
    // console.log("Decrypt MK ", mk, " AD ", this.AD, " ENCRYPTED ", encrypted);
    return await decryptMssg(encrypted, mk, this.AD);
  }

  new_cks () {
    return {
      send_ck: this.send_ratchet.ck,
      rec_ck: this.rec_ratchet.ck
    };
  }
}

// (async () => {
//   await _sodium.ready;
//   const sodium = _sodium;

//   const SK = sodium.to_hex(sodium.crypto_kdf_keygen());

//   // const sender = new UserRatchets();
//   // await sender.init(SK, true, 'theo', 'aud');

//   // const receiver = new UserRatchets();
//   // await receiver.init(SK, false, 'theo', 'aud');

//   const root = new UserRatchets();
//   await root.init(SK, true, 'theo', 'aud');
//   const keys = root.new_cks();

//   console.log(keys)

//   const sender = new UserRatchets();
//   await sender.restore(keys.send_ck, keys.rec_ck, 'theo', 'aud');

//   const receiver = new UserRatchets();
//   await receiver.restore(keys.rec_ck, keys.send_ck, 'theo', 'aud');

//   const encrypted = await sender.encrypt("Please Nana");
//   const decrypted = await receiver.decrypt(encrypted);
//   console.log(decrypted);
// })()

export { UserRatchets }

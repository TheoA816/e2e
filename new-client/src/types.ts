interface User {
  username: string,
  i_key: string,
  s_key: string,
  sign: string,
  o_keys: string[]
}

interface Err {
  err?: any,
}

interface Message {
  senderId: number,
  text: string
}

interface X3DH_Message {
  ciphertext: string,
  sender_IK: string,
  sender_eph: string,
  OTK: string
}

interface KeyPair {
  publicKey: Uint8Array,
  privateKey: Uint8Array
}

interface HexKeys {
  publicKey: string,
  privateKey: string
}

export type { User, Err, Message, X3DH_Message, KeyPair, HexKeys }
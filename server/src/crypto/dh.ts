import _sodium from "libsodium-wrappers";
import { HexKeys, KeyPair, X3DH_Message } from "../types";
import { decrypt, encrypt } from "./encryption";

const initSodium = async () => {
    await _sodium.ready;
    return _sodium;
}

// Generates a X25519 keypair
const generateKeyPair = async (): Promise<KeyPair> => {
    const sodium = await initSodium();
    const keypair = sodium.crypto_box_keypair();
    return {
        privateKey: keypair.privateKey,
        publicKey: keypair.publicKey
    };
}

// Generates a Ed25519 keypair
const generateIK = async (): Promise<KeyPair> => {
    const sodium = await initSodium();
    const keypair = sodium.crypto_sign_keypair();
    return {
        privateKey: keypair.privateKey,
        publicKey: keypair.publicKey
    };
}

const generateBundle = async (numKeys: number = 100) => {
    const keys: KeyPair[] = [];
    for (let i = 0; i < numKeys; ++i) {
        keys.push(await generateKeyPair());
    }
    return keys;
}

const keys_to_hex = async (keypair: KeyPair) => {
    const sodium = await initSodium();
    const hex_keys: HexKeys = { publicKey: '', privateKey: '' };
    hex_keys.publicKey = sodium.to_hex(keypair.publicKey);
    hex_keys.privateKey = sodium.to_hex(keypair.privateKey);
    return hex_keys;
}

// leave for now - look at signal docs
const encodePK = (key: Uint8Array) => {
    return key;
}

// EdDSA
const signKey = async (signingKey: Uint8Array, signedKey: Uint8Array) => {
    const sodium = await initSodium();
    return sodium.crypto_sign_detached(encodePK(signedKey), signingKey);
}

const verifyKey = async (verifyKey: Uint8Array, SK: Uint8Array, signature: Uint8Array) => {
    const sodium = await initSodium();
    return sodium.crypto_sign_verify_detached(signature, encodePK(SK), verifyKey);
}

// Key Bundle Generation - IK is Ed25519 (for signing) rest are X25519
const refillOkeys = async () => {
    const OTK = await generateBundle(100);
    const hex_OTK: HexKeys[] = [];
    for (const keypair of OTK) {
        hex_OTK.push(await keys_to_hex(keypair));
    }
    return hex_OTK;
}

const generateUserKeys = async () => {
    const sodium = await initSodium();

    const IK = await generateIK();
    const SP = await generateKeyPair();
    const SIGN = await signKey(IK.privateKey, SP.publicKey);

    const hex_IK = await keys_to_hex(IK);
    const hex_SP = await keys_to_hex(SP);
    const hex_SIGN = sodium.to_hex(SIGN);
    const hex_OTK = await refillOkeys();
    
    return { hex_IK, hex_SP, hex_SIGN, hex_OTK };
}

// Helper Concat Buffers
const concat = (arrays: Uint8Array[]) => {

    let totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
    let result = new Uint8Array(totalLength);

    if (!arrays.length) return result;

    let length = 0;
    for (let array of arrays) {
        result.set(array, length);
        length += array.length;
    }

    return result;
}

// HKDF as per the rfc5869 spec
const HKDF = async (fkm: Uint8Array) => {
    const sodium = await initSodium();

    const L = 32;
    const salt = new Uint8Array(32).fill(0);
    const info = 'e2e-x3dh';

    // 1. Extract
    const prk = sodium.crypto_auth(fkm, salt);  // HMAC-SHA512-256

    // 2. Expand
    const N = Math.ceil(L / 32);
    const T = new Uint8Array(N * 32);
    const info_bin = new TextEncoder().encode(info);

    let lastT_i = new Uint8Array(32);

    for (let i = 1; i <= N; i++) {

        let message: Uint8Array = new Uint8Array(0);

        // T(0) is empty string
        if (i == 1) {
            message = new Uint8Array(info_bin.length + 1);
            message.set(info_bin);
            message[info_bin.length] = i;
        }
        
        else {
            message = new Uint8Array(32 + info_bin.length + 1);
            message.set(lastT_i);
            message.set(info_bin, lastT_i.length);
            message[lastT_i.length + info_bin.length] = i;
        }

        let T_i = sodium.crypto_auth(message, prk);
        T.set(T_i, (i - 1) * 32);   // we don't set T(0)
        lastT_i = T_i;
    }

    return new Uint8Array(T.slice(0, L));
}

// X3DH
const x3dh_send_SK = async (IK_PRIV: string, r_IK: string, 
                            r_SP: string, r_sign: string, r_OTK: string) => {

    const sodium = await initSodium();

    const sender_ik = sodium.from_hex(IK_PRIV);
    const rec_ik = sodium.from_hex(r_IK);
    const rec_sp = sodium.from_hex(r_SP);
    const rec_sign = sodium.from_hex(r_sign);
    const rec_otk = sodium.from_hex(r_OTK);

    const valid = await verifyKey(rec_ik, rec_sp, rec_sign);
    if (!valid) {
        throw new Error('Validation failed');
    }

    const ephemeral = await generateKeyPair();
    const eph_PK = ephemeral.publicKey;
    const eph_PRIV = ephemeral.privateKey;

    const sender_x = sodium.crypto_sign_ed25519_sk_to_curve25519(sender_ik);
    const rec_x = sodium.crypto_sign_ed25519_pk_to_curve25519(rec_ik);

    const DH1 = sodium.crypto_scalarmult(sender_x, rec_sp);
    const DH2 = sodium.crypto_scalarmult(eph_PRIV, rec_x);
    const DH3 = sodium.crypto_scalarmult(eph_PRIV, rec_sp);
    const DH4 = sodium.crypto_scalarmult(eph_PRIV, rec_otk);
    
    const FKM = new Uint8Array(concat([new Uint8Array(32).fill(0xFF), DH1, DH2, DH3, DH4]));
    const SK = await HKDF(FKM);
    
    return { SK, eph_PK };
}

const x3dh_send = async (IK_PUB: string, IK_PRIV: string, r_IK: string, 
                        r_SP: string, r_sign: string, r_OTK: string, message: string) => {

    const sodium = await initSodium();

    try {
        const { SK, eph_PK } = await x3dh_send_SK(IK_PRIV, r_IK, r_SP, r_sign, r_OTK);
        // console.log("SEND SK")
        // console.log(SK)
        const ik = sodium.from_hex(IK_PUB);
        const rec_ik = sodium.from_hex(r_IK);
        const AD = concat([encodePK(ik), encodePK(rec_ik)]);
        const encrypted = await encrypt(message, SK, AD);
        return {
            message: {
                ciphertext: encrypted,
                sender_IK: IK_PUB,
                sender_eph: sodium.to_hex(eph_PK),
                OTK: r_OTK
            } as X3DH_Message,
            SK: sodium.to_hex(SK)
        }
    } catch (e) {
        throw (e)
    }
}

const x3dh_rec_SK = async (s_IK: string, EPH: string, IK: string, SP: string, OTK: string) => {
    const sodium = await initSodium();

    const sender_ik = sodium.from_hex(s_IK);
    const sender_eph = sodium.from_hex(EPH);
    const rec_ik = sodium.from_hex(IK);
    const rec_sp = sodium.from_hex(SP);
    const rec_otk = sodium.from_hex(OTK);

    const sender_x = sodium.crypto_sign_ed25519_pk_to_curve25519(sender_ik);
    const rec_x = sodium.crypto_sign_ed25519_sk_to_curve25519(rec_ik);

    const DH1 = sodium.crypto_scalarmult(rec_sp, sender_x);
    const DH2 = sodium.crypto_scalarmult(rec_x, sender_eph);
    const DH3 = sodium.crypto_scalarmult(rec_sp, sender_eph);
    const DH4 = sodium.crypto_scalarmult(rec_otk, sender_eph);

    const FKM = new Uint8Array(concat([new Uint8Array(32).fill(0xFF), DH1, DH2, DH3, DH4]));
    const SK = await HKDF(FKM);
    
    return { SK };
}

const x3dh_rec = async (s_IK: string, EPH: string, IK_PUB: string, IK_PRIV: string,
                        SP: string, OTK: string, ciphertext: string) => {
    const sodium = await initSodium();

    try {
        const { SK } = await x3dh_rec_SK(s_IK, EPH, IK_PRIV, SP, OTK);
        // console.log("REC SK")
        // console.log(SK)
        const ik = sodium.from_hex(IK_PUB);
        const sender_ik = sodium.from_hex(s_IK);
        const AD = concat([encodePK(sender_ik), encodePK(ik)]);
        const decrypted = await decrypt(ciphertext, SK, AD);
        return {
            message: decrypted,
            SK: sodium.to_hex(SK)
        };
    } catch (e) {
        throw (e)
    }
}

(async () => {
    // const sodium = await initSodium();
    // const e = await encrypt('Hi', new Uint8Array(32), new Uint8Array(32));
    // console.log(e)
    // console.log(await decrypt(e, new Uint8Array(32), new Uint8Array(32)))
})()

export { refillOkeys, generateUserKeys, x3dh_send, x3dh_rec }
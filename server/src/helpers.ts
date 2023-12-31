import * as dotenv from 'dotenv';
import fs from 'fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Pool } from 'pg';
import { Err, Message, User, X3DH_Message } from './types';
import { generateUserKeys, refillOkeys, x3dh_rec, x3dh_send } from './crypto/dh';
import { UserRatchets } from './crypto/ratchet';

dotenv.config()

///////////////////////////// VARS ///////////////////////////////////////
const pool = new Pool({
  user: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_NAME
});

const root = path.join(os.homedir(), process.env.ROOT_FOLDER as string);

///////////////////////////// HELPERS ///////////////////////////////////////
const generateKeys = async (username: string) => {
  
  const { hex_IK, hex_SP, hex_SIGN, hex_OTK } = await generateUserKeys();

  const OTK_PK: string[] = [];
  const OTK_PRIV: { [index: string]: string } = {};
  for (const keypair of hex_OTK) {
    OTK_PK.push(keypair.publicKey);
    OTK_PRIV[keypair.publicKey] = keypair.privateKey;
  }
  
  const privKey_dir = path.join(root, 'private_keys', username);
  const privKey_file = path.join(privKey_dir, 'keys.txt');

  const privateKeys = {
    i_key: hex_IK.privateKey,
    s_key: hex_SP.privateKey,
    o_keys: OTK_PRIV,
  }
  
  await fs.mkdir(privKey_dir, { recursive: true });
  await fs.writeFile(privKey_file, JSON.stringify(privateKeys));

  return {
    username: username,
    i_key: hex_IK.publicKey,
    s_key: hex_SP.publicKey,
    sign: hex_SIGN,
    o_keys: OTK_PK
  } as User
}

const createStorage = async (username: string) => {

  // create root folder if not yet
  try {
    await fs.access(root);
  } catch (e) {
    await fs.mkdir(root);
  }

  // create user's folder
  const user_dir = path.join(root, username);
  try {
    await fs.access(user_dir);
  } catch (e) {
    fs.mkdir(user_dir);
  }
}

const get_priv = async (user: string) => {

  const priv_file = path.join(root, 'private_keys', user, 'keys.txt');
  try {
    const keys = await fs.readFile(priv_file, { encoding: 'utf8' });
    return JSON.parse(keys) as { 
      i_key: string,
      s_key: string,
      o_keys: { [index: string]: string }
    };
  } catch (e) {
    throw (e);
  }
}

const get_ck = async (user: string, contact: string) => {

  const ck_file = path.join(root, user, contact, 'ck.txt');
  try {
    const keys = await fs.readFile(ck_file, { encoding: 'utf8' });
    return JSON.parse(keys) as { 
      send_ck: string,
      rec_ck: string,
    };
  } catch (e) {
    return {
      send_ck: '',
      rec_ck: ''
    }
  }
}

const store_ck = async (user: string, contact: string, send_ck: string, rec_ck: string) => {

  const ck_file = path.join(root, user, contact, 'ck.txt');
  const ck = {
    send_ck: send_ck,
    rec_ck: rec_ck
  }

  try {
    await fs.writeFile(ck_file, JSON.stringify(ck));
  } catch (e) {
    console.log(`Cannot write ck keys between ${user} and ${contact}`);
  }
}

///////////////////////////// QUERIES ///////////////////////////////////////
const createAccount = async (username: string) => {

  const error: Err = {};

  try {
    createStorage(username);
    const user = await generateKeys(username);
    const insertRes = await pool.query(`INSERT INTO USERS (username, i_key, s_key, sign, o_keys)
                                        VALUES ($1, $2, $3, $4, $5)`, 
                                        [username, user.i_key, user.s_key, user.sign, user.o_keys]);
    return user;
  } catch (err) {
    error.err = err;
  }

  return error;
}

const findAccount = async (username: string) => {

  let error: Err = {};

  try {
    const findRes = await pool.query(`SELECT * FROM USERS where username = $1`, [username]);
    if (findRes.rows.length === 0) error.err = `User ${username} not found`;
    else return (findRes.rows[0] as User);
  } catch (err) {
    error.err = err;
  }

  return error;
}

const saveTempMessages = async (sender: string, receiver: string, text: string) => {

  let error: Err = {};

  try {
    const insertRes = await pool.query(`INSERT INTO TEMP_MSSG (sender, receiver, mssg) 
                                        VALUES ($1, $2, $3)`, 
                                        [sender, receiver, text]);
  } catch (err) {
    error.err = err;
  }

  return error;
}

const getTempMessages = async (username: string) => {

  let mssgs: any[] = [];

  try {
    const findRes = await pool.query(`SELECT sender, mssg AS text FROM TEMP_MSSG
                                        where receiver = $1`, 
                                        [username]);
    mssgs = findRes.rows;
  } catch (err) {
    console.log(err)
  }

  try {
    const delRes = await pool.query(`DELETE FROM TEMP_MSSG
                                        where receiver = $1`, 
                                        [username]);
  } catch (err) {}

  return mssgs;
}

const remove_okey = async (user: string, o_key: string) => {

  try {
    const updateRes = await pool.query(`UPDATE USERS SET o_keys =
                                        ARRAY_REMOVE(o_keys, $1)
                                        WHERE username = $2`,
                                        [o_key, user])
  } catch (e) {
    console.log(e);
  }
}

const refill_okeys = async (user: string) => {

  try {
    const okeys = await refillOkeys();

    const OTK_PK: string[] = [];
    const OTK_PRIV: { [index: string]: string } = {};
    for (const keypair of okeys) {
      OTK_PK.push(keypair.publicKey);
      OTK_PRIV[keypair.publicKey] = keypair.privateKey;
    }

    const curPriv = await get_priv(user);
    curPriv.o_keys = OTK_PRIV;
    
    const privKey_file = path.join(root, 'private_keys', user, 'keys.txt');
    await fs.writeFile(privKey_file, JSON.stringify(curPriv))

    const updateRes = await pool.query(`UPDATE USERS SET o_keys = $1
                                        WHERE username = $2`,
                                        [OTK_PK, user])
  } catch (e) {
    console.log(e);
  }
}

///////////////////////////// EXPORTS ///////////////////////////////////////
const createContact = async (username: string, contact: string) => {

  const contact_dir = path.join(root, username, contact);
  try {
    await fs.access(contact_dir);
  } catch (e) {
    try { await fs.mkdir(contact_dir); }
    catch (e) { console.log(`Duplicate command building ${username} - ${contact} folder`)}
  }
}

const getContacts = async (username: string) => {

  if (username.length !== 0) {

    const user_dir = path.join(root, username);
    const contacts = await fs.readdir(user_dir);
    return contacts;
  }

  return [];
}

const getMessages = async (username: string, contact: string) => {

  if (username.length === 0 || contact.length === 0) return [];

  const contact_dir = path.join(root, username, contact, 'messages.txt');

  try {
    const messages = await fs.readFile(contact_dir, { encoding: 'utf8' });
    return JSON.parse(messages);
  } catch (e) {
    return [];
  }
}

const storeMessages = async (username: string, contact: string, messages: Message[]) => {

  if (username.length === 0  || contact.length === 0) return;
  
  const contact_dir = path.join(root, username, contact, 'messages.txt');
  const message_store = JSON.stringify(messages);
  
  try {
    await fs.writeFile(contact_dir, message_store, { encoding: 'utf8' } );
  } catch (e) {
    console.log(`User ${username} attempting to write at invalid contact ${contact}`)
  }
}

const initChatSend = async(username: string, contact: string, initMessage: string) => {

  try {
    let contactBundle = (await findAccount(contact)) as User;
    if (contactBundle.o_keys.length === 0) {
      await refill_okeys(contact);
      contactBundle = (await findAccount(contact)) as User;
    }
    const user_pub_IK = ((await findAccount(username)) as User).i_key;
    const user_priv_IK = (await get_priv(username)).i_key;
    const res = await x3dh_send(user_pub_IK, user_priv_IK, contactBundle.i_key, contactBundle.s_key,
      contactBundle.sign, contactBundle.o_keys[0], initMessage);

    const ratchet = new UserRatchets();
    await ratchet.init(res.SK, true, username, contact);
    const cks = ratchet.new_cks();
    await store_ck(username, contact, cks.send_ck, cks.rec_ck);

    await remove_okey(contact, contactBundle.o_keys[0]);
    return res.message;
  } catch (e) {
    console.log(e);
    return { 'err': e } as Err;
  }
}

const initChatRec = async(username: string, contact: string, packet: X3DH_Message) => {

  try {
    const user_pub_IK = ((await findAccount(username)) as User).i_key;
    const privKeys = (await get_priv(username));
    const res = await x3dh_rec(packet.sender_IK, packet.sender_eph, user_pub_IK, privKeys.i_key,
                                    privKeys.s_key, privKeys.o_keys[packet.OTK], packet.ciphertext);

    const ratchet = new UserRatchets();
    await ratchet.init(res.SK, false, username, contact);
    const cks = ratchet.new_cks();
    await store_ck(username, contact, cks.send_ck, cks.rec_ck);

    return { message: res.message };
  } catch (e) {
    console.log(e);
    return { 'err': e } as Err;
  }
}

const chatEncrypt = async (user: string, contact: string, text: string) => {

  try {
    const cks = await get_ck(user, contact);
    const ratchet = new UserRatchets();
    ratchet.restore(cks.send_ck, cks.rec_ck, user, contact);
    const encrypted = await ratchet.encrypt(text);
    const new_cks = ratchet.new_cks();
    await store_ck(user, contact, new_cks.send_ck, new_cks.rec_ck);
    return { message: encrypted };
  } catch (e) {
    console.log(e);
    return { message: '' };
  }
}

const chatDecrypt = async (user: string, contact: string, encrypted: string) => {

  try {
    const cks = await get_ck(user, contact);
    const ratchet = new UserRatchets();
    ratchet.restore(cks.send_ck, cks.rec_ck, contact, user);
    const decrypted = await ratchet.decrypt(encrypted);
    const new_cks = ratchet.new_cks();
    await store_ck(user, contact, new_cks.send_ck, new_cks.rec_ck);
    return { message: decrypted };
  } catch (e) {
    console.log(e);
    return { message: '' };
  }
}

const errHandler = (err: any) => {
  switch (err.code) {
    case '23505':
      return 'Username taken';
    default:
      return err;
  }
}

export {
  createAccount,
  findAccount,
  createContact,
  getContacts,
  getMessages,
  storeMessages,
  initChatSend,
  initChatRec,
  saveTempMessages,
  getTempMessages,
  chatEncrypt,
  chatDecrypt,
  errHandler
}
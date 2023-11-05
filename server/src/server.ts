import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'node:http';
import { corsOptionsDelegate } from '../config/corsOptions';

import { Server, Socket } from 'socket.io';

import { chatDecrypt, chatEncrypt, createAccount, createContact, errHandler, findAccount, getContacts, getMessages, getTempMessages, initChatRec, initChatSend, saveTempMessages, storeMessages } from './helpers';

dotenv.config();

const port = parseInt(process.env.PORT as string);

const app = express();
app.use(express.json());
app.use(cors(corsOptionsDelegate))

const server = http.createServer(app);

///////////////////////////// EXPRESS //////////////////////////////////////
app.get('/', (req, res) => {
  res.status(200).send('Hello World');
})

// account creation
app.post('/signup', async (req, res) => {

  const { username } = req.body;
  const insertRes = await createAccount(username);

  if ('err' in insertRes) res.status(400).json({ 'err': errHandler(insertRes.err) })
  else res.status(200).json(insertRes);

  return;
})

// account search
app.get('/contact/search', async (req, res) => {

  const username = req.query.username as string;
  const findRes = await findAccount(username);

  if ('err' in findRes) res.status(400).json({ 'err': errHandler(findRes.err) })
  else res.status(200).json(findRes);

  return;
})

// initialize user's contacts
app.get('/contact/init', async (req, res) => {

  const username = req.query.username as string;
  const contactsRes = await getContacts(username);

  res.status(200).json(contactsRes);
  return;
})

// add contact (make chat folder)
app.post('/contact/add', async (req, res) => {

  const { username, contact } = req.body;
  await createContact(username as string, contact as string);
  
  res.status(200).json();
  return;
})

// chat
app.post('/chat/start', async (req, res) => {

  const { username, contact, message } = req.body;

  // X3DH
  const chatRes = await initChatSend(username, contact, message);
  console.log("Send Packet")
  console.log(chatRes)
  if ('err' in chatRes) res.status(400).json({ 'err': errHandler(chatRes.err) });
  else res.status(200).json(chatRes);

  return;
})

app.post('/chat/verify', async (req, res) => {

  const { username, contact, packet } = req.body;

  // X3DH
  const chatRes = await initChatRec(username, contact, packet);
  console.log("Final")
  console.log(chatRes)
  if ('err' in chatRes) res.status(400).json({ 'err': errHandler(chatRes.err) });
  else res.status(200).json(chatRes);

  return;
})

app.get('/chat/messages', async (req, res) => {

  const { username, contact } = req.query;
  const messagesRes = await getMessages(username as string, contact as string);
  res.status(200).json(messagesRes);
  return;
})

app.post('/chat/store', async (req, res) => {

  const { username, contact, messages } = req.body;
  console.log("Storing messages");
  console.log(messages)
  const storeRes = await storeMessages(username, contact, messages);
  res.status(200).json();
  return;
})

app.delete('/chat/load', async (req, res) => {

  const { username } = req.body;
  const mssgs = await getTempMessages(username);

  res.status(200).json(mssgs);
  return;
})

app.get('/chat/decrypt', async (req, res) => {

  const { encrypted, user, contact } = req.query;
  const decrypted = await chatDecrypt(user as string, contact as string, encrypted as string);
  res.status(200).json(decrypted.message);
})

server.listen(port, () => {
  console.log(`App running on port ${port}.`)
})


////////////////////////////// SOCKET.IO ///////////////////////////////
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
  }
});

const users: { [index: string]: Socket } = {};

io.on('connection', (socket) => {

  let socket_user = '';
  
  socket.on('disconnect', () => {
    if (socket_user.length !== 0) delete users[socket_user];
  });

  socket.on('user-connect', (user: string) => {
    socket_user = user;
    users[user] = socket;
  });

  socket.on('user-disconnect', (user: string) => {
    delete users[user];
    socket_user = '';
  });

  socket.on('message-out', async (data) => {
    const { sender, receiver, text, is_first } = data;
    const encrypted = await chatEncrypt(sender, receiver, text);
    console.log(`Sending messages - users active`);
    console.log(Object.keys(users));
    if (receiver in users) {
      users[receiver].emit('message-in', { sender: sender, text: (is_first) ? text : encrypted.message });
    } else {
      await saveTempMessages(sender, receiver, (is_first) ? text : encrypted.message);
    }
  });
})

import { useState } from "react";
import Account from './account/Account';
import Chat from './chat/Chat';
import Contacts from './contacts/Contacts';
import styles from './App.module.css';
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001');

function App() {
  
  const [curChat, setCurChat] = useState(''); // current person we're chatting to
  const [username, setUsername] = useState(''); // current user
  const [contacts, setContacts] = useState<string[]>([]); // list of people in our contacts

  return (
    <div className={styles.container}>
      <Contacts username={username} setCurChat={setCurChat} contacts={contacts} setContacts={setContacts}/>
      <Chat username={username} curChat={curChat} socket={socket} contacts={contacts} setContacts={setContacts}/>
      <Account username={username} setUsername={setUsername} setCurChat={setCurChat} socket={socket}/>
    </div>
  )
}

export default App

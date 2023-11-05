import { useEffect, useState } from "react";
import Account from './account/Account';
import Chat from './chat/Chat';
import Contacts from './contacts/Contacts';
import styles from './App.module.css';
import { io } from 'socket.io-client';
import { MessagesStruct } from "./types";

const socket = io('ws://localhost:3001');

function App() {
  
  // This is very bad but oh well
  const [curChat, setCurChat] = useState(''); // current person we're chatting to
  const [username, setUsername] = useState(''); // current user
  const [contacts, setContacts] = useState<string[]>([]); // list of people in our contacts
  const [messages, setMessages] = useState<MessagesStruct>({ '': [] }); // list of messages of current user

  // log out no user - reinitialize states
  useEffect(() => {
    if (username.length !== 0) return;
    setCurChat('');
    setContacts([]);
    setMessages({ '': [] });
  }, [username])

  return (
    <div className={styles.container}>
      <Contacts username={username} setCurChat={setCurChat} contacts={contacts} setContacts={setContacts}/>
      <Chat username={username} curChat={curChat} socket={socket} contacts={contacts}
            setContacts={setContacts} messages={messages} setMessages={setMessages}/>
      <Account username={username} setUsername={setUsername} messages={messages} socket={socket}/>
    </div>
  )
}

export default App

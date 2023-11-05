// EVENT LISTENER STORE BREAKING / RUNS ON LOAD FOR SOME REASON
import { useEffect, useState } from 'react';
import styles from './Chat.module.css';
import { MessagesStruct } from '../types';
import MessageBlock from './MessageBlock';
import { Socket } from 'socket.io-client';

interface ChatProps {
  username: string,
  curChat: string,
  socket: Socket,
  contacts: string[],
  setContacts: React.Dispatch<React.SetStateAction<string[]>>,
  messages: MessagesStruct,
  setMessages: React.Dispatch<React.SetStateAction<MessagesStruct>>
}

const Chat = ({ username, curChat, socket, contacts, setContacts, messages, setMessages }: ChatProps) => {

  const [incoming, setIncoming] = useState<string[]>([]);
  const [sus, setSus] = useState<string[]>([]);
  const [init, setInit] = useState(false);

  // helpers
  const createContact = async (contact: string) => {

    console.log(`Making contact for ${username} of ${contact}`)

    await fetch(`http://localhost:3001/contact/add`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        contact: contact
      })
    });
  }

  // + load messages on change chat and get temp messages too - if not yet previously
  useEffect(() => {

    const getMessages = async () => {
      for (let contact of contacts) {
        const res = await fetch(`http://localhost:3001/chat/messages/?username=${username}&contact=${contact}`);
        const user_messages = await res.json();
        setMessages(messages => {
          console.log("Load On File Messages")
          const new_messages = { ...messages };
          new_messages[contact] = [ ...user_messages, ...new_messages[contact] ?? [] ] ;
          return new_messages;
        })
      }
    }

    const loadTempMssgs = async () => {

      const res = await fetch(`http://localhost:3001/chat/load`, {
        method: 'delete',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username
        })
      });

      const mssgs: { sender: string, text: string }[] = await res.json();
      if (mssgs.length === 0) return false;

      const decryptedMssgs: string[] = [];
      const sus_contacts: string[] = [];

      for (let mssg of mssgs) {
        const { sender, text } = mssg;
        const res = await fetch(`http://localhost:3001/chat/decrypt?encrypted=${text}&user=${username}&contact=${sender}`);
        const decrypted = await res.json();
        decryptedMssgs.push((decrypted.length === 0) ? text : decrypted);
        if (decrypted.length === 0) sus_contacts.push(sender);
      }

      const incoming_contacts: string[] = [];

      setContacts(contacts => {
        const new_contacts = [ ...contacts ];
        let contacts_changed = false;
        for (let mssg of mssgs) {
          const { sender, text } = mssg;
          if (!contacts.includes(sender)) {
            createContact(sender);
            new_contacts.push(sender);
            incoming_contacts.push(sender);
            contacts_changed = true;
          }
        }
        return (contacts_changed) ? new_contacts : contacts;
      })

      setMessages(messages => {
        console.log("Load Temp Messages")
        const new_messages = { ...messages };
        for (let i in mssgs) {
          const { sender, text } = mssgs[i];
          const decrypted = decryptedMssgs[i];
          new_messages[sender] = [...new_messages[sender] ?? [], {
            senderId: 0,  // 1 send 0 receive
            text: (decrypted.length === 0) ? text : decrypted
          }];
        }
        return new_messages;
      })

      setIncoming(incoming_contacts);
      setSus(sus => [ ...sus, ...sus_contacts ]);
      return true;
    }
    
    const loadAllMessages = async () => {
      if (username.length !== 0 && !init) {
        if (contacts.length > 0) {
          await getMessages();
          await loadTempMssgs();
          setInit(true);
        } else {
          await loadTempMssgs();
        }
      }
    }

    ///////////////////////////////// LOGOUT ///////////////////////////////
    const logout = async () => {
      if (username.length === 0 && contacts.length === 0 && curChat.length === 0) {
        setInit(false);
      }
    }

    loadAllMessages();
    logout();

  }, [username, contacts]);
  
  // + Real-time message
  useEffect(() => {

    const receiveMessage = async (data: { sender: string, text: string }) => {
      const { sender, text } = data;
      const incoming_contacts: string[] = [];
      console.log(`Message received from ${sender} and content ${text}`)

      const res = await fetch(`http://localhost:3001/chat/decrypt?encrypted=${text}&user=${username}&contact=${sender}`);
      const decrypted = await res.json();

      // runs twice for some reason
      setContacts(contacts => {
        const new_contacts = [ ...contacts ];
        if (!new_contacts.includes(sender)) {
          createContact(sender);
          new_contacts.push(sender);
        }
        return new_contacts;
      })

      setMessages(messages => {
        console.log("Setting Live Messages")
        const new_messages = { ...messages };
        if (!(sender in new_messages) || new_messages[sender].length === 0) incoming_contacts.push(sender);
        new_messages[sender] = [...new_messages[sender] ?? [], {
          senderId: 0,  // 1 send 0 receive
          text: (decrypted.length === 0) ? text : decrypted
        }];
        return new_messages;
      });

      setIncoming(incoming_contacts);
      if (decrypted.length === 0) setSus(sus => [ ...sus, sender ])
    }

    socket.on('message-in', receiveMessage);

    return () => {
      socket.off('message-in', receiveMessage);
    }
  }, [username])

  // + X3DH receive initial message from new contact
  useEffect(() => {

    if (incoming.length == 0) return;

    const verify = async () => {

      const not_sus: string[] = [];
      const init_messages: { [index: string]: string } = {};

      for (const contact of incoming) {
        console.log("Initial Message")
        console.log(JSON.parse(messages[contact][0].text))
        const res = await fetch(`http://localhost:3001/chat/verify`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: username,
            contact: contact,
            packet: JSON.parse(messages[contact][0].text)
          })
        });

        const x3dh_message = await res.json();

        if (!('err' in x3dh_message)) {
          not_sus.push(contact);
          init_messages[contact] = x3dh_message.message;
        }
      }
      
      console.log(init_messages)
      setSus(sus => sus.filter((s) => !not_sus.includes(s)));
      
      setMessages(messages => {
        const new_messages = { ...messages };
        for (const contact in init_messages) {
          new_messages[contact][0].text = init_messages[contact];
        }
        return new_messages;
      })
    }

    verify();
    setIncoming([]);
  }, [incoming])
  
  // + Store messages locally when quit
  useEffect(() => {
    
    const storeMessages = async (e: any) => {

      e.preventDefault();
      
      for (const contact in messages) {
          await fetch(`http://localhost:3001/chat/store`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: username,
            contact: contact,
            messages: messages[contact]
          })
        });
      }
    }

    window.addEventListener('beforeunload', storeMessages);

    return () => {
      window.removeEventListener('beforeunload', storeMessages);
    }

  }, [messages])

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    
    e.preventDefault();

    if (curChat.length === 0) {
      alert('No chat chosen');
      return;
    }

    const form = e.target as HTMLFormElement;
    const input = form.children[0] as HTMLInputElement;
    let x3dh_message = null;
    let is_first = false;

    // initial message
    if (!(curChat in messages) || messages[curChat].length === 0) {

      const res = await fetch(`http://localhost:3001/chat/start`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          contact: curChat,
          message: input.value
        })
      });

      x3dh_message = await res.json();
      is_first = true;

      if ('err' in x3dh_message) {
        setSus(sus => [...sus, curChat]);
        return;
      }
    }

    const new_messages = { ...messages };
    new_messages[curChat] = [...new_messages[curChat] ?? [], {
      senderId: 1,  // 1 send 0 receive
      text: input.value
    }];

    setMessages(new_messages);

    socket.emit('message-out', {
      sender: username,
      receiver: curChat,
      text: (x3dh_message) ? JSON.stringify(x3dh_message) : input.value,
      is_first: is_first
    })

    input.value = '';
  }
  
  return (
    <div className={styles.container}>
      <span className={styles.chatTitle}>{curChat}</span>
      <div className={styles.messages}>
        {messages[curChat]?.map((mssg, idx) => <MessageBlock key={idx} senderId={mssg.senderId} text={mssg.text}/>)}
      </div>
      { sus.includes(curChat) ? 
        <div>User is Sus sorry don't chat him</div>
      :
        <form onSubmit={sendMessage} className={styles.messageInput}>
          <input required></input>
        </form>
      }
    </div>
  )
}

export default Chat
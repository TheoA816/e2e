import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import styles from './Account.module.css'
import Popup from 'reactjs-popup'
import { MessagesStruct } from '../types'

interface AccountProps {
  username: string,
  setUsername: React.Dispatch<React.SetStateAction<string>>,
  messages: MessagesStruct,
  socket: Socket
}

const Account = ({ username, setUsername, messages, socket }: AccountProps) => {

  const [open, setOpen] = useState(false);
  const [loginPopup, setLoginPopup] = useState(false);

  /*  
    doLogin - doLogout - doSignup
      socket.on('connect') and disconnect

    setCurChat jus clear chat when logout
  */

  // check if user in localStorage (previously logged in)
  useEffect(() => {
    const curUser = localStorage.getItem('username');
    if (curUser !== null) {
      setUsername(curUser);
      socket.emit('user-connect', curUser);
    }
  }, [])

  const doSignup = async (e: React.FormEvent<HTMLFormElement>) => {

    const form = e.target as HTMLFormElement;
    const input = form.children[0] as HTMLInputElement;
    const user = input.value;

    const res = await fetch(`http://localhost:3001/signup`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: user
      })
    });
    const created = await res.json();

    if ('err' in created) {
      alert(created.err);
      setOpen(false);
      return;
    }

    socket.emit('user-connect', user);
    localStorage.setItem('username', user);

    setUsername(user);
    setOpen(false);
  }

  const doLogin = async (e: React.FormEvent<HTMLFormElement>) => {

    const form = e.target as HTMLFormElement;
    const input = form.children[0] as HTMLInputElement;
    const user = input.value;

    const res = await fetch(`http://localhost:3001/contact/search?username=${user}`);
    const found = await res.json();

    if ('err' in found) {
      alert(`User ${user} does not exist`);
      setOpen(false);
      return;
    }

    socket.emit('user-connect', user);
    localStorage.setItem('username', user);

    setUsername(user);
    setOpen(false);
  }

  const storeMessages = async () => {
      
    for (const contact in messages) {
      console.log(`Saved chat with ${contact}`)
      console.log(messages[contact])
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

  const doLogout = async () => {
    await storeMessages();
    socket.emit('user-disconnect', username);
    setUsername('');
    localStorage.clear();
  }

  const openPopup = (is_login: boolean) => {
    setOpen(true);
    setLoginPopup(is_login);
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loginPopup) doLogin(e);
    else doSignup(e);
  }

  return (
    <>
      <div className={styles.container}>
        { username.length === 0 ? 
            <>
              <button onClick={() => openPopup(false)}>Sign up</button>
              <button onClick={() => openPopup(true)}>Log in</button>
            </>
          :
            <button onClick={() => doLogout()}>Log out of {username}</button>
        }
      </div>
      <Popup open={open}>
        <span>Username</span>
        <form onSubmit={onSubmit}>
          <input required></input>
        </form>
      </Popup>
    </>
  )
}

export default Account
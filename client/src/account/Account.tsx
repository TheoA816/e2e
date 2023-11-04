import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import styles from './Account.module.css'
import Popup from 'reactjs-popup'

interface AccountProps {
  username: string,
  setUsername: React.Dispatch<React.SetStateAction<string>>,
  setCurChat: React.Dispatch<React.SetStateAction<string>>,
  socket: Socket
}

const Account = ({ username, setUsername, setCurChat, socket }: AccountProps) => {

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
    }
  }, [])

  const doSignup = async (e: React.FormEvent<HTMLFormElement>) => {

    const form = e.target as HTMLFormElement;
    const input = form.children[0] as HTMLInputElement;

    const res = await fetch(`http://localhost:3001/signup`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: input.value
      })
    });
    const created = await res.json();

    if ('err' in created) {
      alert(created.err);
      setOpen(false);
      return;
    }

    socket.emit('user-connect', input.value);
    localStorage.setItem('username', input.value);

    setUsername(input.value);
    setOpen(false);
  }

  const doLogin = async (e: React.FormEvent<HTMLFormElement>) => {

    const form = e.target as HTMLFormElement;
    const input = form.children[0] as HTMLInputElement;

    const res = await fetch(`http://localhost:3001/contact/search?username=${input.value}`);
    const found = await res.json();

    if ('err' in found) {
      alert(`User ${input.value} does not exist`);
      setOpen(false);
      return;
    }

    socket.emit('user-connect', input.value);
    localStorage.setItem('username', input.value);

    setUsername(input.value);
    setOpen(false);
  }

  const doLogout = () => {
    socket.emit('user-disconnect', username);
    setUsername('');
    setCurChat('');
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
import { useState } from 'react'
import { Socket } from 'socket.io-client'
import styles from './Account.module.css'

interface AccountProps {
  username: string,
  setUsername: React.Dispatch<React.SetStateAction<string>>,
  setCurChat: React.Dispatch<React.SetStateAction<string>>,
  socket: Socket
}

const Account = ({ username, setUsername, setCurChat, socket }: AccountProps) => {

  const [open, setOpen] = useState(false);

  /*  
    doLogin - doLogout - doSignup
      socket.on('connect') and disconnect

    setCurChat jus clear chat when logout
  */

  return (
    <>
      <div className={styles.container}>
        { username.length === 0 ? 
            <>
              <button>Sign up</button>
              <button>Log in</button>
            </>
          :
            <button>Log out of {username}</button>
        }
      </div>
      { open && <div className={styles.popup_module}></div> }
    </>
  )
}

export default Account
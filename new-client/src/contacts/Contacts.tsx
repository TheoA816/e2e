import styles from './Contacts.module.css';

interface ContactsProps {
  username: string,
  setCurChat: React.Dispatch<React.SetStateAction<string>>,
  contacts: string[],
  setContacts: React.Dispatch<React.SetStateAction<string[]>>
}

const Contacts = ({ username, setCurChat, contacts, setContacts }: ContactsProps) => {

  /*
    input - onsubmit add contact
    contact - onclick set curchat
      put this in sub ContactChat.tsx
  */

  return (
    <div className={styles.container}>

    </div>
  )
}

export default Contacts
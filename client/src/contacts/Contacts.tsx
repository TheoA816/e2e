import { useEffect } from 'react';
import ContactChat from './ContactChat';
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

  // load a user's contacts
  useEffect(() => {

    const initContacts = async () => {
      if (username.length === 0) return;
      const res = await fetch(`http://localhost:3001/contact/init?username=${username}`);
      const user_contacts = await res.json();
      setContacts(user_contacts);
    }

    initContacts();

  }, [username])

  const createContact = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const input = form.children[0] as HTMLInputElement;
    const contact = input.value;

    // contact already added
    if (contacts.includes(input.value)) {
      setCurChat(contact);
      input.value = '';
      return;
    }

    // check contact exists
    const res = await fetch(`http://localhost:3001/contact/search?username=${contact}`);
    const found = await res.json();

    if ('err' in found) {
      alert(`User ${contact} does not exist`);
      input.value = '';
      return;
    }

    // add contact - mkdir
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

    setCurChat(contact);
    setContacts(contacts => [...contacts, contact]);
    input.value = '';
  }

  return (
    <div className={styles.container}>

      {/* Add Contact */}
      <form onSubmit={createContact} className={styles.form}>
        <input className={styles.input} required></input>
      </form>

      {/* Contact List */}
      <div className={styles.contactList}>
        {contacts.map((contact, idx) => <ContactChat key={idx} contact={contact} setCurChat={setCurChat}/>)}
      </div>
    </div>
  )
}

export default Contacts
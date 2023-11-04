import styles from './Contacts.module.css';

interface ContactChatProps {
  contact: string
  setCurChat: React.Dispatch<React.SetStateAction<string>>
}

const ContactChat = ({ contact, setCurChat}: ContactChatProps) => {

  /*
    set curchat
  */

  return (
    <div className={styles.contact} onClick={() => setCurChat(contact)}>
      {contact}
    </div>
  )
}

export default ContactChat
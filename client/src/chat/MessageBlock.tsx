import styles from './Chat.module.css';

interface MessageBlockProps {
  senderId: number,
  text: string
}

const MessageBlock = ({ senderId, text }: MessageBlockProps) => {

  /*
    based on senderId just change style
  */

  return (
    <div className={(senderId === 1) ? styles.senderMssg : styles.receiverMssg}>
      {text}
    </div>
  )
}

export default MessageBlock
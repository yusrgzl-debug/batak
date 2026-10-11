import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChatMsg, EMOJIS, MAX_MESSAGE, QUICK_MESSAGES } from '../chat';

interface Props {
  log: ChatMsg[];
  names: string[];
  onSend: (text: string) => void;
  onClose: () => void;
}

export function ChatPanel({ log, names, onSend, onClose }: Props) {
  const [text, setText] = useState('');
  const send = (t: string) => {
    const v = t.trim().slice(0, MAX_MESSAGE);
    if (!v) return;
    onSend(v);
    setText('');
    onClose();
  };
  return (
    <motion.div className="overlay overlay--chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="chat"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="chat-head">
          <b>Mesajlar</b>
          <button className="icon-btn" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        {log.length > 0 && (
          <div className="chat-log">
            {log.slice(-6).map((m) => (
              <div key={m.id} className={`chat-line ${m.player === 0 ? 'chat-line--me' : ''}`}>
                <b>{names[m.player]}:</b> {m.text}
              </div>
            ))}
          </div>
        )}
        <div className="chat-emojis">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => send(e)}>
              {e}
            </button>
          ))}
        </div>
        <div className="chat-quick">
          {QUICK_MESSAGES.map((q) => (
            <button key={q} onClick={() => send(q)}>
              {q}
            </button>
          ))}
        </div>
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <input
            value={text}
            maxLength={MAX_MESSAGE}
            placeholder="Mesaj yaz…"
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn--gold" type="submit" disabled={!text.trim()}>
            Gönder
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

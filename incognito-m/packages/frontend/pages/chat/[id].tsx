import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';

export default function ChatPage() {
  const router = useRouter();
  const { id } = router.query;
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const s = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      path: '/ws',
      auth: { token }
    });
    setSocket(s);
    s.on('connect', () => {
      if (id) s.emit('join_conversation', id);
    });
    s.on('message.created', (m:any) => setMessages(prev => [...prev, m]));
    return () => { s.disconnect(); };
  }, [id]);

  const send = (text:string) => {
    socket.emit('message.send', { conversationId: id, body: text });
  };

  const sendImage = async (file: File) => {
    // naive flow: request upload URL from backend then PUT directly to S3
    const form = new FormData();
    form.append('filename', file.name);
    form.append('contentType', file.type);
    const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/media/upload-url`, { method: 'POST', body: JSON.stringify({ filename: file.name, contentType: file.type }), headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }});
    const j = await r.json();
    await fetch(j.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    socket.emit('message.send', { conversationId: id, body: '', mediaUrl: j.publicUrl, mediaType: file.type });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Chat {id}</h2>
      <div style={{ border: '1px solid #ddd', minHeight: 300, padding: 8, overflow: 'auto' }}>
        {messages.map(m => <div key={m.id}><b>{m.sender_id}</b>: {m.body}{m.media_url && <div><img src={m.media_url} style={{maxWidth:200}}/></div>}</div>)}
      </div>
      <Composer onSend={send} onFileSelected={sendImage} />
    </div>
  );
}

function Composer({ onSend, onFileSelected }:{ onSend:(t:string)=>void, onFileSelected:(f:File)=>void }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ marginTop: 8 }}>
      <input value={val} onChange={e=>setVal(e.target.value)} />
      <input type="file" onChange={e=>{ if (e.target.files && e.target.files[0]) onFileSelected(e.target.files[0]); }} />
      <button onClick={()=>{ onSend(val); setVal(''); }}>Send</button>
    </div>
  );
}

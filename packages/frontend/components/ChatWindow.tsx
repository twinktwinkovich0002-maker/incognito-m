export default function ChatWindow({ messages }:{ messages:any[] }) {
  return (
    <div>
      {messages.map(m => <div key={m.id}><b>{m.sender_id}</b>: {m.body}</div>)}
    </div>
  );
}

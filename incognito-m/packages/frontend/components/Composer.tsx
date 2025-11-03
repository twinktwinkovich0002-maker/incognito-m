import { useState } from 'react';
export default function Composer({ onSend }:{ onSend:(t:string)=>void }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ marginTop: 8 }}>
      <input value={val} onChange={e=>setVal(e.target.value)} />
      <button onClick={()=>{ onSend(val); setVal(''); }}>Send</button>
    </div>
  );
}

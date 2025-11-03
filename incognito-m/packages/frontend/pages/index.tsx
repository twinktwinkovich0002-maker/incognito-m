import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Incognito M. — Messenger</h1>
      <p><Link href="/chat/demo">Open demo chat</Link></p>
    </div>
  );
}

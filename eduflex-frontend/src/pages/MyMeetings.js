import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
export default function MyMeetings() {
  const { fetchMyMeetings, updateMeetingStatus } = useApp();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgText, setMsgText] = useState('');
  // No forum tab: only meets

  const load = async () => {
    setLoading(true);
    const data = await fetchMyMeetings();
    setMeetings(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadMessages = async (meetingId) => {
    setMsgLoading(true);
    const res = await fetch(`/api/student/meetings/${meetingId}/messages`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } });
    const data = await res.json();
    setMessages(data || []);
    setMsgLoading(false);
  };

  const sendMessage = async (meetingId) => {
    if (!msgText.trim()) return;
    try {
      const res = await fetch(`/api/student/meetings/${meetingId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ text: msgText })
      });
      if (res.ok) {
        const newMsg = await res.json();
        // append optimistically
        setMessages(prev => [...prev, newMsg]);
        setMsgText('');
        // also refresh to ensure consistency
        await loadMessages(meetingId);
      } else {
        console.error('Send message failed', await res.text());
      }
    } catch (err) {
      console.error('Send message error', err);
    }
  };

  return (
    <div className="p-8 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">My 1:1 Sessions</h2>
      {loading ? (
        <div>Loading...</div>
      ) : meetings.length === 0 ? (
        <div className="text-gray-500">You have no scheduled sessions.</div>
      ) : (
        <div className="space-y-4">
          {meetings.map(m => (
            <div key={m._id} className="p-4 border rounded bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-semibold">{m.course?.title || ''} — {m.quiz?.title || ''}</div>
                  <div className="text-sm text-gray-600">With: {m.professor?.name || 'Professor'}</div>
                  <div className="text-sm text-gray-600">When: {new Date(m.scheduledAt).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Duration: {m.durationMins} mins</div>
                </div>
                <div className="text-right">
                  <div className="mb-2 text-sm font-medium">Status: <span className="text-indigo-600">{m.status}</span></div>
                  {m.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={async () => { await updateMeetingStatus(m._id, 'confirmed'); await load(); }} className="px-3 py-1 bg-green-600 text-white rounded">Confirm</button>
                      <button onClick={async () => { await updateMeetingStatus(m._id, 'cancelled'); await load(); }} className="px-3 py-1 bg-red-400 text-white rounded">Cancel</button>
                    </div>
                  )}
                  <button onClick={async () => { setChatOpen(m._id); await loadMessages(m._id); }} className="ml-2 px-3 py-1 bg-blue-600 text-white rounded">Chat</button>
                </div>
              </div>
              {m.notes && <div className="mt-3 text-sm text-gray-700">Notes: {m.notes}</div>}
              {/* Chat UI */}
              {chatOpen === m._id && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold mb-2">Chat with {m.professor?.name || 'Professor'}</h4>
                  {msgLoading ? <div>Loading messages...</div> : (
                    <div className="max-h-64 overflow-y-auto mb-2 bg-gray-50 p-2 rounded">
                      {messages.length === 0 ? <div className="text-gray-400">No messages yet.</div> : messages.map(msg => (
                        <div key={msg._id} className={`mb-2 flex ${msg.sender?._id === m.professor?._id ? 'justify-start' : 'justify-end'}`}>
                          <div className={`px-3 py-2 rounded-lg ${msg.sender?._id === m.professor?._id ? 'bg-gray-200 text-gray-800' : 'bg-green-200 text-green-900'}`}>
                            <span className="font-semibold text-xs">{msg.sender?.name || 'User'}:</span> {msg.text}
                            <div className="text-[10px] text-gray-500 mt-1">{new Date(msg.sentAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input type="text" value={msgText} onChange={e => setMsgText(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Type a message..." />
                    <button onClick={() => sendMessage(m._id)} className="px-3 py-1 bg-blue-600 text-white rounded">Send</button>
                    <button onClick={() => setChatOpen(null)} className="px-3 py-1 bg-gray-300 rounded">Close</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

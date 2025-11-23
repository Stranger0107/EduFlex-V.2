import React, { useState, useEffect } from 'react';

export default function CourseForum({ courseId, apiPrefix }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState('');

  const loadMessages = async () => {
    setLoading(true);
    const res = await fetch(`${apiPrefix}/courses/${courseId}/forum`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });
    const data = await res.json();
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { if (courseId) loadMessages(); }, [courseId]);

  const sendMessage = async () => {
    if (!msgText.trim()) return;
    await fetch(`${apiPrefix}/courses/${courseId}/forum`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ text: msgText })
    });
    setMsgText('');
    await loadMessages();
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Course Forum</h4>
      {loading ? <div>Loading forum...</div> : (
        <div className="max-h-64 overflow-y-auto mb-2 bg-gray-50 p-2 rounded">
          {messages.length === 0 ? <div className="text-gray-400">No posts yet.</div> : messages.map(msg => (
            <div key={msg._id} className="mb-2">
              <div className="px-3 py-2 rounded-lg bg-gray-200 text-gray-800">
                <span className="font-semibold text-xs">{msg.sender?.name || 'User'}:</span> {msg.text}
                <div className="text-[10px] text-gray-500 mt-1">{new Date(msg.sentAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" value={msgText} onChange={e => setMsgText(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Type a message..." />
        <button onClick={sendMessage} className="px-3 py-1 bg-blue-600 text-white rounded">Post</button>
      </div>
    </div>
  );
}

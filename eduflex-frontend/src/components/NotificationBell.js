import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

export default function NotificationBell() {
  const { fetchNotifications, markNotificationAsRead } = useApp();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const data = await fetchNotifications();
    setList(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const unread = list.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative text-2xl">
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-2 rounded-full">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white shadow-lg rounded p-3 z-50">
          <h3 className="font-bold mb-2">Notifications</h3>

          {list.length === 0 && (
            <p className="text-gray-500 text-sm">No notifications.</p>
          )}

          {list.map((n) => (
            <div
              key={n._id}
              className={`p-2 border-b cursor-pointer ${
                n.read ? "bg-gray-100" : "bg-green-50"
              }`}
              onClick={() => {
                markNotificationAsRead(n._id);

                if (n.link) window.location.href = n.link;
              }}
            >
              <p className="text-sm">{n.text}</p>
              <p className="text-xs text-gray-500">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

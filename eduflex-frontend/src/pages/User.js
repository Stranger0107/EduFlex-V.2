import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { API_HOST } from '../config/api';

const fallbackAvatar =
  'https://ui-avatars.com/api/?background=10b981&color=fff&rounded=true&size=128&name=User';

export default function User() {
  const {
    user,
    loadUserProfile,
    fetchUserStats,
    fetchEnrolledCourses,
    fetchRecentGrades,
    uploadProfilePhoto,
    theme,
    toggleTheme,
  } = useApp();

  const [stats, setStats] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [avatarKey, setAvatarKey] = useState(0);
  const fileRef = useRef();

  useEffect(() => {
    const loadEverything = async () => {
      setLoading(true);

      await loadUserProfile();
      const s = await fetchUserStats();
      const c = await fetchEnrolledCourses();
      const g = await fetchRecentGrades();

      setStats(s);
      setEnrolledCourses(c);
      setRecentGrades(g);

      setLoading(false);
    };

    loadEverything();
  }, []);

  if (loading || !user) {
    return <div className="flex justify-center items-center h-80">Loading profile...</div>;
  }

  const getAvatarUrl = (url) => {
    if (!url) return fallbackAvatar;
    // Already absolute
    if (url.startsWith('http')) return avatarKey ? `${url}?t=${avatarKey}` : url;
    // Relative path from backend (e.g. /uploads/...) -> prefix host
    const full = `${API_HOST}${url}`;
    return avatarKey ? `${full}?t=${avatarKey}` : full;
  };

  const avatarSrc = preview || getAvatarUrl(user.photo || user.photoUrl || '');

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
  };

  const triggerSelect = () => fileRef.current && fileRef.current.click();

  const upload = async (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    setUploading(true);
    // Upload original file (no resizing)
    try {
      await uploadProfilePhoto(f);
    } catch (err) {
      console.error('Profile upload failed', err);
      setUploading(false);
      return;
    }
    setUploading(false);
    setPreview(null);
    // reload profile to ensure new photo is shown
    await loadUserProfile();
    // force cache-bust for new avatar
    setAvatarKey(Date.now());
  };

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* HEADER */}
      <div className="flex gap-6 items-center">
        <div className="relative">
          <img
            src={preview || avatarSrc}
            alt="avatar"
            className="w-28 h-28 rounded-full shadow object-cover"
          />

          <div
            className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow cursor-pointer"
            onClick={triggerSelect}
            title="Change profile photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
            </svg>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { onFileChange(e); upload(e); }}
          />
        </div>

        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-green-700 dark:text-green-300">{user.name}</h1>
            {(user.role === 'student' || user.role === 'professor') && (
              <button
                onClick={toggleTheme}
                className="ml-2 px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                title="Toggle light / dark"
              >
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-semibold">{user.role?.toUpperCase()}</span>
            {user.role === 'student' && user.studentId ? ` • ID: ${user.studentId}` : ''}
          </p>

          <p className="text-gray-500 dark:text-gray-300 text-sm">{user.email}</p>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Joined: {new Date(user.joinedAt).toDateString()}</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        <StatsCard title="Courses" value={stats?.totalCourses} color="#3b82f6" />
        <StatsCard title="Pending" value={stats?.pendingAssignments} color="#ef4444" />
        <StatsCard title="Avg Grade" value={stats?.averageGrade} color="#22c55e" />
        <StatsCard title="Progress" value={stats?.overallProgress} color="#f59e0b" />
      </div>

      {/* COURSES */}
      <h2 className="text-xl font-semibold text-green-700 mb-3">Enrolled Courses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {enrolledCourses.length === 0 && <p className="text-gray-500">No enrolled courses</p>}

        {enrolledCourses.map((c) => (
          <div key={c._id} className="p-4 bg-gray-50 border rounded-lg">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-xs text-gray-600">Credits: {c.credits}</p>
          </div>
        ))}
      </div>

      {/* GRADES */}
      <h2 className="text-xl font-semibold text-green-700 mb-3">Recent Grades</h2>
      {recentGrades.length === 0 ? (
        <p className="text-gray-500">No grades yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recentGrades.map((g, i) => (
            <div key={i} className="p-4 bg-white border rounded-lg shadow-sm flex justify-between">
              <div>
                <strong>{g.assignmentTitle}</strong>
                <p className="text-xs text-gray-500">{g.course}</p>
              </div>
              <span className="text-green-600 font-bold text-xl">{g.grade}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsCard({ title, value, color }) {
  return (
    <div className="px-5 py-4 rounded-xl shadow-md text-center bg-white dark:bg-gray-700" style={{ background: `${color}15` }}>
      <div className="text-xl font-bold" style={{ color }}>
        {value ?? 0}
      </div>
      <p className="text-xs opacity-80 text-gray-600 dark:text-gray-300">{title}</p>
    </div>
  );
}

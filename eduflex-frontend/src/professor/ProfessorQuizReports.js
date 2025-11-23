import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export default function ProfessorQuizReports() {
  const { user, fetchMyProfessorCourses, fetchQuizzesForCourse, fetchQuizReports, scheduleMeeting } = useApp();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [scheduleOpenFor, setScheduleOpenFor] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMins, setDurationMins] = useState(30);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchMyProfessorCourses();
      setCourses(data || []);
      if (data && data[0]) setSelectedCourseId(data[0]._id);
    };
    load();
  }, [fetchMyProfessorCourses]);

  useEffect(() => {
    const loadQuizzes = async () => {
      if (!selectedCourseId) return;
      const q = await fetchQuizzesForCourse(selectedCourseId);
      setQuizzes(q || []);
      if (q && q[0]) setSelectedQuizId(q[0]._id);
    };
    loadQuizzes();
  }, [selectedCourseId, fetchQuizzesForCourse]);

  useEffect(() => {
    const loadReports = async () => {
      if (!selectedQuizId) return;
      setLoading(true);
      const data = await fetchQuizReports(selectedQuizId);
      setReports(data.reports || []);
      setLoading(false);
    };
    loadReports();
  }, [selectedQuizId, fetchQuizReports]);

  // meeting chat removed — reports only

  return (
    <div className="p-8 pl-24 min-h-screen flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/3 flex flex-col h-[calc(100vh-100px)]">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Quiz Reports</h2>
          <p className="text-sm text-gray-500">Select a course and quiz to view per-student scores.</p>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 flex-1">
          {courses.map(c => (
            <div key={c._id} onClick={() => setSelectedCourseId(c._id)}
              className={`p-3 rounded-lg border cursor-pointer ${selectedCourseId === c._id ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
              <div className="font-bold">{c.title}</div>
              <div className="text-xs text-gray-500">{c.description}</div>
            </div>
          ))}

          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Quizzes</h3>
            {quizzes.map(q => (
              <div key={q._id} onClick={() => setSelectedQuizId(q._id)}
                className={`p-2 rounded border mb-2 cursor-pointer ${selectedQuizId === q._id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100'}`}>
                <div className="text-sm font-medium">{q.title}</div>
                <div className="text-xs text-gray-500">Questions: {q.questions?.length || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full md:w-2/3 bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-[calc(100vh-100px)] overflow-y-auto">
        {!selectedQuizId ? (
          <div className="flex items-center justify-center h-full text-gray-400">Select a quiz to see reports.</div>
        ) : (
          <>
            <div className="flex gap-6 mb-4 border-b pb-2">
              <button className={`px-4 py-2 rounded ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setActiveTab('reports')}>Reports</button>
            </div>
            {activeTab === 'reports' ? (
              <>
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">{quizzes.find(q => q._id === selectedQuizId)?.title || 'Quiz'}</h2>
                  <div className="mt-2 text-sm text-gray-500">Student submissions and scores</div>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center h-48">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Score</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Percent</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Submitted</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reports.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No submissions yet</td></tr>
                        ) : (
                          reports.map((r, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{r.student?.name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{r.student?.email || ''}</div>
                              </td>
                              <td className="px-4 py-3">{r.score ?? '—'} / {r.total ?? '—'}</td>
                              <td className="px-4 py-3">{r.percent !== null && r.percent !== undefined ? `${r.percent}%` : '—'}</td>
                              <td className="px-4 py-3">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => { setScheduleOpenFor(r.student?._id || null); setScheduledAt(''); setNotes(''); setDurationMins(30); }}
                                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">Schedule 1:1</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {/* Inline scheduling form */}
                    {scheduleOpenFor && (
                      <div className="mt-4 p-4 border rounded bg-gray-50">
                        <h4 className="font-semibold mb-2">Schedule 1:1 with student</h4>
                        <div className="flex gap-2 items-center mb-2">
                          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="border p-2 rounded" />
                          <input type="number" min={15} max={240} value={durationMins} onChange={e => setDurationMins(Number(e.target.value))} className="w-28 border p-2 rounded" />
                          <span className="text-sm text-gray-500">mins</span>
                        </div>
                        <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded mb-2" />
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            if (!scheduledAt) return alert('Please pick date & time');
                            const res = await scheduleMeeting(selectedQuizId, scheduleOpenFor, { scheduledAt, durationMins, notes });
                            if (res && res.meeting) {
                              // refresh reports
                              const data = await fetchQuizReports(selectedQuizId);
                              setReports(data.reports || []);
                              setScheduleOpenFor(null);
                            }
                          }} className="px-3 py-1 bg-green-600 text-white rounded">Send Invite</button>
                          <button onClick={() => setScheduleOpenFor(null)} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

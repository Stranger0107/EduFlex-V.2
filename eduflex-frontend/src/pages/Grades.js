// src/pages/Grades.js
import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import api from "../config/api";

function Grades() {
  const { getStudentGrades, theme, user } = useApp();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grades');

  // Analysis states
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      const data = await getStudentGrades();
      setGrades(data || []);
      setLoading(false);
    };
    fetchGrades();
  }, [getStudentGrades]);

  // Fetch insights when Analysis tab is selected
  useEffect(() => {
    const fetchInsights = async () => {
      if (activeTab !== 'analysis') return;
      if (!user) return;
      setInsightsLoading(true);
      try {
        const { data } = await api.get(`/insights/student/${user._id || user.id}`);
        console.log('Fetched insights:', data);
        setInsights(data || []);
      } catch (err) {
        console.error('Failed to load insights', err);
      }
      setInsightsLoading(false);
    };
    fetchInsights();
  }, [activeTab, user]);

  // Helper: unique courses from insights
  const insightCourses = [...new Set(insights.map(i => (i.course && i.course.title) ? i.course.title : String(i.course)))];
  const [selectedCourseForChart, setSelectedCourseForChart] = useState(insightCourses[0] || '');

  useEffect(() => {
    if (insightCourses.length && !selectedCourseForChart) setSelectedCourseForChart(insightCourses[0]);
  }, [insightCourses]);

  // Simple inline two-line chart (Avg Quiz = blue, Progress = green)
  const TrendChart = ({ seriesA = [], seriesB = [], labels = [] }) => {
    // seriesA: avgQuizScore, seriesB: progressPct
    const w = 520; const h = 120; const pad = 28; // room for axis labels
    const min = 0; const max = 100; // percentage scale
    const norm = v => (typeof v === 'number' ? ((v - min) / (max - min || 1)) : 0);

    const pointX = i => {
      if (!labels || labels.length <= 1) return Math.round(w / 2);
      return pad + (i * (w - pad * 2) / Math.max(1, labels.length - 1));
    };
    const pointY = (v) => h - pad - norm(v) * (h - pad * 2);

    const pathFrom = (arr) => {
      if (!arr || arr.length === 0) return '';
      if (arr.length === 1) {
        const cx = pointX(0);
        const cy = pointY(arr[0]);
        const left = Math.max(pad, cx - 30);
        const right = Math.min(w - pad, cx + 30);
        return `M ${left} ${cy} L ${right} ${cy}`;
      }
      return arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pointX(i)} ${pointY(v)}`).join(' ');
    };

    if ((!seriesA || seriesA.length === 0) && (!seriesB || seriesB.length === 0)) {
      return (
        <div className="w-full h-24 flex items-center justify-center text-sm text-gray-500">No trend data to plot</div>
      );
    }

    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="rounded">
        <rect x="0" y="0" width="100%" height="100%" fill="transparent" />

        {/* Y axis grid & labels */}
        {[0,25,50,75,100].map((val, idx) => {
          const y = pointY(val);
          return (
            <g key={idx}>
              <line x1={pad} x2={w - pad} y1={y} y2={y} stroke="#eef2f7" strokeWidth={0.8} />
              <text x={6} y={y + 4} fontSize={10} fill="#6b7280">{val}</text>
            </g>
          );
        })}

        {/* X axis labels */}
        {labels && labels.map((lab, i) => (
          <text key={`x-${i}`} x={pointX(i)} y={h - 6} fontSize={10} fill="#6b7280" textAnchor="middle">{lab}</text>
        ))}

        {/* Draw progress (green) then avgQuiz (blue) */}
        {seriesB.length > 0 && (
          <path d={pathFrom(seriesB)} fill="none" stroke="#10b981" strokeWidth={2.5} strokeOpacity={0.95} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {seriesA.length > 0 && (
          <path d={pathFrom(seriesA)} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeOpacity={0.95} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Markers */}
        {seriesB.map((v, i) => (
          <circle key={`b-${i}`} cx={pointX(i)} cy={pointY(v)} r={4} fill="#10b981" stroke="#fff" strokeWidth={0.6} />
        ))}
        {seriesA.map((v, i) => (
          <rect key={`a-${i}`} x={pointX(i)-4} y={pointY(v)-4} width={8} height={8} fill="#3b82f6" stroke="#fff" strokeWidth={0.6} rx={1} />
        ))}

        {/* Legend */}
        <g>
          <rect x={w - pad - 150} y={8} width={142} height={28} rx={6} fillOpacity={0.02} fill="#000" />
          <rect x={w - pad - 136} y={16} width={12} height={6} fill="#3b82f6" />
          <text x={w - pad - 116} y={21} fontSize={11} fill="#374151">Avg Quiz</text>
          <rect x={w - pad - 60} y={16} width={12} height={6} fill="#10b981" />
          <text x={w - pad - 40} y={21} fontSize={11} fill="#374151">Progress</text>
        </g>
      </svg>
    );
  };

  // Render analysis panel
  const renderAnalysis = () => {
    if (insightsLoading) return <div className="text-center py-8">Loading analysis...</div>;
    if (!insights || insights.length === 0) return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-300">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium mb-2">No analysis available yet</h3>
        <p>Insights are generated weekly. Check back later or contact your professor.</p>
      </div>
    );

    const filtered = insights
      .filter(ins => !selectedCourseForChart || ((ins.course && ins.course.title) ? ins.course.title : String(ins.course)) === selectedCourseForChart)
      .sort((a,b) => new Date(a.weekStart) - new Date(b.weekStart));
    const labels = filtered.map(f => new Date(f.weekStart).toLocaleDateString());
    const seriesA = filtered.map(f => (typeof f.metrics?.avgQuizScore === 'number' ? f.metrics.avgQuizScore : 0));
    const seriesB = filtered.map(f => (typeof f.metrics?.progressPct === 'number' ? f.metrics.progressPct : 0));

    let trendText = 'No trend available';
    if (seriesA.length >= 2) {
      const first = seriesA[0] || 0;
      const last = seriesA[seriesA.length - 1] || 0;
      const diff = last - first;
      const pct = first === 0 ? 0 : Math.round((diff / first) * 100);
      trendText = diff > 0 ? `Improved ${Math.abs(pct)}%` : diff < 0 ? `Dropped ${Math.abs(pct)}%` : 'No change';
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-300">Select course:</label>
            <select value={selectedCourseForChart} onChange={e => setSelectedCourseForChart(e.target.value)} className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
              <option value="">All Courses</option>
              {insightCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2"><span style={{width:12,height:8,background:'#3b82f6',display:'inline-block'}}></span> Avg Quiz</div>
            <div className="flex items-center gap-2"><span style={{width:12,height:8,background:'#10b981',display:'inline-block',opacity:0.6}}></span> Progress</div>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">Trend for selected course: <span className="font-semibold">{trendText}</span></div>
          <div className="mt-2 bg-white dark:bg-gray-900 p-3 rounded">
            <TrendChart seriesA={seriesA} seriesB={seriesB} labels={labels} />
          </div>
        </div>

        {/* Debug toggle - helpful for diagnosing empty series */}
        <DebugPanel filtered={filtered} labels={labels} seriesA={seriesA} seriesB={seriesB} />

        {filtered.map((ins) => (
          <div key={ins._id} className="border border-gray-100 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Course: {ins.course?.title || ins.course}</div>
                <div className="text-lg font-semibold">Week of {new Date(ins.weekStart).toLocaleDateString()}</div>
              </div>
              <div className="text-right text-sm text-gray-500">
                Progress: <span className="font-semibold">{ins.metrics?.progressPct ?? '-'}%</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-xs text-gray-500">Assignments Delayed</div>
                <div className="text-xl font-semibold">{ins.metrics?.assignmentDelays ?? 0}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-xs text-gray-500">Avg Quiz Score</div>
                <div className="text-xl font-semibold">{ins.metrics?.avgQuizScore ?? '-' }%</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-xs text-gray-500">Attendance</div>
                <div className="text-xl font-semibold">{ins.metrics?.attendancePct >= 0 ? `${ins.metrics.attendancePct}%` : 'N/A'}</div>
              </div>
            </div>

            {ins.weaknesses && ins.weaknesses.length > 0 && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                <strong>Identified issues:</strong>
                <ul className="list-disc ml-5">
                  {ins.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {ins.suggestions && ins.suggestions.length > 0 && (
              <div className="mt-3">
                <div className="text-sm text-gray-500 mb-2">Suggestions</div>
                <div className="space-y-2">
                  {ins.suggestions.map(s => (
                    s.approved ? (
                      <div key={s._id || s.createdAt} className="p-3 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-between">
                        <div>
                          <div className="font-medium">{s.text}</div>
                          {s.resourceLink && <a className="text-sm text-blue-600 dark:text-blue-400" href={s.resourceLink} target="_blank" rel="noreferrer">Open resource</a>}
                          {s.slot && <div className="text-xs text-gray-500">Session: {new Date(s.slot).toLocaleString()}</div>}
                        </div>
                        <div className="text-xs text-green-600">Approved</div>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Debug panel component (collapsed by default)
  const DebugPanel = ({ filtered = [], labels = [], seriesA = [], seriesB = [] }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="mt-2 text-xs text-gray-500">
        <button onClick={() => setOpen(o => !o)} className="underline text-sm mb-2">{open ? 'Hide debug info' : 'Show debug info'}</button>
        {open && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-200">
            <div><strong>Insights fetched:</strong> {filtered.length} entries</div>
            <div className="mt-1"><strong>Labels:</strong> {JSON.stringify(labels)}</div>
            <div className="mt-1"><strong>AvgQuiz series:</strong> {JSON.stringify(seriesA)}</div>
            <div className="mt-1"><strong>Progress series:</strong> {JSON.stringify(seriesB)}</div>
            <details className="mt-2"><summary>Raw insights JSON</summary><pre className="mt-2 max-h-48 overflow-auto text-xs">{JSON.stringify(filtered, null, 2)}</pre></details>
          </div>
        )}
      </div>
    );
  };

  // Unique courses for filter
  const uniqueCourses = [
    ...new Set(grades.map(grade => grade.course)),
  ];

  // Sort and filter grades
  const filteredAndSortedGrades = grades
    .filter(grade => {
      const matchesCourse =
        filterCourse === "all" || grade.course === filterCourse;
      
      // Simple grade filtering logic based on letters derived from score
      // Assumed mapping: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)
      const matchesGrade = (() => {
          if (filterGrade === "all") return true;
          const g = grade.grade; // 'A', 'B', etc. from context transform
          if (filterGrade === "A") return g === 'A';
          if (filterGrade === "B") return g === 'B';
          if (filterGrade === "C") return g === 'C';
          if (filterGrade === "below-C") return ['D', 'F'].includes(g);
          return true;
      })();

      return matchesCourse && matchesGrade;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "course":
          aValue = a.course?.toLowerCase();
          bValue = b.course?.toLowerCase();
          break;
        case "score":
          aValue = parseInt(a.score.replace("%", "")) || 0;
          bValue = parseInt(b.score.replace("%", "")) || 0;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }
      if (sortOrder === "asc") return aValue > bValue ? 1 : -1;
      else return aValue < bValue ? 1 : -1;
    });

  // Stats calculation
  const calculateStats = () => {
    if (filteredAndSortedGrades.length === 0)
      return { average: 0, highest: 0, lowest: 0, totalAssignments: 0 };
    const scores = filteredAndSortedGrades.map(
      grade => parseInt(grade.score.replace("%", "")) || 0
    );
    const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    return {
      average,
      highest,
      lowest,
      totalAssignments: filteredAndSortedGrades.length,
    };
  };

  const stats = calculateStats();

  // Grade color helpers (light + dark variants)
  const getGradeColor = (grade) => {
    if (["A"].includes(grade)) return "#065f46"; // dark green
    if (["B"].includes(grade)) return "#1e3a8a"; // dark blue
    if (["C"].includes(grade)) return "#92400e"; // amber dark
    return "#7f1d1d"; // red dark
  };
  const getGradeBackground = (grade) => {
    if (["A"].includes(grade)) return "#ecfdf5";
    if (["B"].includes(grade)) return "#eff6ff";
    if (["C"].includes(grade)) return "#fffbeb";
    return "#fff1f2";
  };
  const getGradeColorDark = (grade) => {
    if (["A"].includes(grade)) return "#bbf7d0";
    if (["B"].includes(grade)) return "#bfdbfe";
    if (["C"].includes(grade)) return "#fed7aa";
    return "#fecaca";
  };
  const getGradeBackgroundDark = (grade) => {
    if (["A"].includes(grade)) return "rgba(16,185,129,0.12)"; // translucent green
    if (["B"].includes(grade)) return "rgba(59,130,246,0.08)"; // translucent blue
    if (["C"].includes(grade)) return "rgba(245,158,11,0.08)"; // translucent amber
    return "rgba(239,68,68,0.08)"; // translucent red
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-4 border-t-green-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-200">Loading grades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-1">My Grades</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">Track your academic performance and analyze your progress.</p>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex gap-2">
          <button
            onClick={() => setActiveTab('grades')}
            className={`px-4 py-2 rounded-md ${activeTab === 'grades' ? 'bg-green-100 dark:bg-green-900 font-semibold' : 'bg-transparent'}`}>
            Grades
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-md ${activeTab === 'analysis' ? 'bg-green-100 dark:bg-green-900 font-semibold' : 'bg-transparent'}`}>
            Analysis
          </button>
        </nav>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.18)' }}>
          <div className="text-2xl font-bold">{stats.average}%</div>
          <div className="text-sm opacity-90">Average Score</div>
        </div>
        <div className="p-6 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 8px 24px rgba(59,130,246,0.12)' }}>
          <div className="text-2xl font-bold">{stats.highest}%</div>
          <div className="text-sm opacity-90">Highest Score</div>
        </div>
        <div className="p-6 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 8px 24px rgba(245,158,11,0.12)' }}>
          <div className="text-2xl font-bold">{stats.lowest}%</div>
          <div className="text-sm opacity-90">Lowest Score</div>
        </div>
        <div className="p-6 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', boxShadow: '0 8px 24px rgba(139,92,246,0.12)' }}>
          <div className="text-2xl font-bold">{stats.totalAssignments}</div>
          <div className="text-sm opacity-90">Assignments Graded</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl mb-8 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">Filter & Sort</h3>
        <div className="flex gap-4 flex-wrap items-center">
          {/* Course Filter */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Filter by Course
            </label>
            <select
              value={filterCourse}
              onChange={e => setFilterCourse(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[150px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
          {/* Grade Filter */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Filter by Grade
            </label>
            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[150px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Grades</option>
              <option value="A">A (90-100)</option>
              <option value="B">B (80-89)</option>
              <option value="C">C (70-79)</option>
              <option value="below-C">Below C</option>
            </select>
          </div>
          {/* Sort By */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[150px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="date">Date</option>
              <option value="course">Course</option>
              <option value="score">Score</option>
            </select>
          </div>
          {/* Sort Order */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Order
            </label>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[120px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
          {/* Reset Button */}
          <div className="ml-auto">
            <button
              onClick={() => {
                setFilterCourse("all");
                setFilterGrade("all");
                setSortBy("date");
                setSortOrder("desc");
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm text-gray-800 dark:text-gray-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      {/* Content Area: Grades or Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
        {activeTab === 'grades' ? (
          (filteredAndSortedGrades.length > 0) ? (
            <div>
              {/* Table Header */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200">
                <div className="col-span-2 md:col-span-2">Assignment</div>
                <div className="hidden md:block">Course</div>
                <div>Grade</div>
                <div>Score</div>
                <div className="hidden md:block">Date</div>
              </div>
              {/* Table Rows */}
              {filteredAndSortedGrades.map((grade, index) => (
                <div
                  key={grade.id || index}
                  className={`grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-4 items-center transition-colors ${index < filteredAndSortedGrades.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-700`}
                >
                  <div className="col-span-2 md:col-span-2 font-medium text-gray-800 dark:text-gray-100">{grade.assignment}</div>
                  <div className="hidden md:block text-gray-600 dark:text-gray-300">{grade.course}</div>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        background: theme === 'dark' ? getGradeBackgroundDark(grade.grade) : getGradeBackground(grade.grade),
                        color: theme === 'dark' ? getGradeColorDark(grade.grade) : getGradeColor(grade.grade)
                      }}
                    >
                      {grade.grade}
                    </span>
                  </div>
                  <div className="font-semibold" style={{ color: theme === 'dark' ? getGradeColorDark(grade.grade) : getGradeColor(grade.grade) }}>{grade.score}</div>
                  <div className="hidden md:block text-gray-600 dark:text-gray-300 text-sm">{new Date(grade.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 text-gray-600 dark:text-gray-300">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">No grades found</h3>
              <p>No graded assignments match your current filters.</p>
            </div>
          )
        ) : (
          <div className="p-6">{renderAnalysis()}</div>
        )}
      </div>
    </div>
  );
}

export default Grades;
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Dashboard.css";
import { requestForToken } from "../firebase";

const CATEGORY_OPTIONS = [
  { value: "work", label: "Work", color: "#6366f1" },
  { value: "personal", label: "Personal", color: "#0ea5e9" },
  { value: "urgent", label: "Urgent", color: "#f59e42" },
  { value: "other", label: "Other", color: "#a3a3a3" },
];
const PRIORITY_OPTIONS = [
  { value: "high", label: "High", color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#f59e42" },
  { value: "low", label: "Low", color: "#22c55e" },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(null);
  const [reminderIntervals, setReminderIntervals] = useState({});
  const [stoppedTasks, setStoppedTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedSection, setSelectedSection] = useState("tasks"); // 'calendar', 'add', 'tasks'
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [priority, setPriority] = useState(PRIORITY_OPTIONS[1].value);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [theme, setTheme] = useState("dark");
  const [description, setDescription] = useState("");
  const [editTask, setEditTask] = useState(null); // task being edited
  const [editForm, setEditForm] = useState({ title: '', description: '', deadline: null, category: '', priority: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const editModalRef = useRef(null);
  const editTitleInputRef = useRef(null);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [editSubtasks, setEditSubtasks] = useState([]);
  const [editNewSubtask, setEditNewSubtask] = useState("");
  const [recurring, setRecurring] = useState('none');
  const RECURRING_OPTIONS = [
    { value: 'none', label: 'One-time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];
  const [editRecurring, setEditRecurring] = useState('none');
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', notificationPrefs: { email: true, browser: true } });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', notificationPrefs: { email: true, browser: true } });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const token = localStorage.getItem("token");

  const saveFcmToken = async (fcmToken) => {
  try {
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/user/save-fcm-token`,
      { fcmToken },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("FCM token saved successfully");
  } catch (error) {
    console.error("Failed to save FCM token", error);
  }
};


  const fetchTasks = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Fetched tasks response:", res.data);

    // Ensure tasks is always an array
    const fetchedTasks = Array.isArray(res.data) ? res.data : [];
    setTasks(fetchedTasks);
  } catch (err) {
    console.error("Failed to load tasks", err);
    setTasks([]); // fallback to empty array to prevent UI crash
  }
};




  const addTask = async (e) => {
  e.preventDefault();
  try {
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/tasks`,
      {
        title,
        deadline: deadline ? deadline.toISOString() : null,
        category,
        priority,
        description,
        subtasks,
        recurring,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setTitle("");
    setDeadline(null);
    setCategory(CATEGORY_OPTIONS[0].value);
    setPriority(PRIORITY_OPTIONS[1].value);
    setDescription("");
    setSubtasks([]);
    setNewSubtask("");
    setRecurring('none');
    fetchTasks();
    setSelectedSection("tasks");
  } catch (err) {
    alert("Failed to add task");
  }
};


  const deleteTask = async (id) => {
  try {
    await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    stopReminderLoop(id);
    fetchTasks();
  } catch (err) {
    alert("Failed to delete task");
  }
};


  const markComplete = async (id) => {
  try {
    await axios.patch(
      `${import.meta.env.VITE_API_BASE_URL}/api/tasks/${id}/complete`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    stopReminderLoop(id);
    setStoppedTasks((prev) => [...prev, id]);
    fetchTasks();
  } catch (err) {
    alert("Failed to mark as complete");
  }
};


  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const startReminderLoop = (task) => {
    if (Notification.permission !== "granted") return;
    if (reminderIntervals[task._id] || stoppedTasks.includes(task._id)) return;

    const interval = setInterval(() => {
      new Notification("⏰ Task Reminder", {
        body: `Task \"${task.title}\" is still due!`,
      });
    }, 5000);

    setReminderIntervals((prev) => ({
      ...prev,
      [task._id]: interval,
    }));
  };

  const stopReminderLoop = (taskId) => {
    if (reminderIntervals[taskId]) {
      clearInterval(reminderIntervals[taskId]);
      setReminderIntervals((prev) => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      setStoppedTasks((prev) => [...prev, taskId]);
    }
  };

  const checkDeadlinesAndStart = () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    tasks.forEach((task) => {
      if (
        !task.deadline ||
        reminderIntervals[task._id] ||
        stoppedTasks.includes(task._id) ||
        task.completed
      )
        return;

      const deadlineTime = new Date(task.deadline).getTime();
      const currentTime = Date.now();
      const timeDiff = deadlineTime - currentTime;

      if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000) {
        startReminderLoop(task);
      }
    });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    Notification.requestPermission();
    const interval = setInterval(() => {
      checkDeadlinesAndStart();
    }, 10000);
    return () => clearInterval(interval);
  }, [tasks, reminderIntervals, stoppedTasks]);

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("light", theme === "light");
  }, [theme]);

  // Progress bar
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtering
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "completed" && task.completed) ||
      (filterStatus === "pending" && !task.completed);
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.deadline &&
        new Date(task.deadline)
          .toLocaleDateString()
          .includes(searchQuery));
    const matchesCategory =
      filterCategory === "all" || task.category === filterCategory;
    const matchesPriority =
      filterPriority === "all" || task.priority === filterPriority;
    return matchesStatus && matchesSearch && matchesCategory && matchesPriority;
  });

  const tasksForDate = tasks.filter(
    (task) =>
      task.deadline &&
      new Date(task.deadline).toDateString() === calendarDate.toDateString()
  );

  // SVG graphic for navbar
  const LogoSVG = () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="30" height="30" rx="10" fill="url(#paint0_linear)"/>
      <path d="M12 18h12M18 12v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="paint0_linear" x1="3" y1="3" x2="33" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1"/>
          <stop offset="1" stopColor="#0ea5e9"/>
        </linearGradient>
      </defs>
    </svg>
  );

  // Edit logic
  const openEditModal = (task) => {
    setEditTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline ? new Date(task.deadline) : null,
      category: task.category || CATEGORY_OPTIONS[0].value,
      priority: task.priority || PRIORITY_OPTIONS[1].value,
    });
    setEditSubtasks(task.subtasks || []);
    setEditNewSubtask("");
    setEditRecurring(task.recurring || 'none');
    setEditError("");
    setTimeout(() => {
      if (editTitleInputRef.current) editTitleInputRef.current.focus();
    }, 100);
  };
  const closeEditModal = () => {
    setEditTask(null);
    setEditError("");
  };
  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'title' && value.trim() === "") setEditError("Title is required");
    else setEditError("");
  };
  const saveEdit = async (e) => {
  e.preventDefault();
  if (!editForm.title.trim()) {
    setEditError("Title is required");
    return;
  }
  setEditLoading(true);
  setEditError("");
  try {
    await axios.patch(
      `${import.meta.env.VITE_API_BASE_URL}/api/tasks/${editTask._id}`,
      {
        title: editForm.title,
        description: editForm.description,
        deadline: editForm.deadline ? editForm.deadline.toISOString() : null,
        category: editForm.category,
        priority: editForm.priority,
        subtasks: editSubtasks,
        recurring: editRecurring,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    closeEditModal();
    setShowEditSuccess(true);
    fetchTasks();
    setTimeout(() => setShowEditSuccess(false), 2000);
  } catch (err) {
    setEditError("Failed to update task");
  } finally {
    setEditLoading(false);
  }
};

  // Close modal on outside click or Esc
  useEffect(() => {
    if (!editTask) return;
    const handleKey = (e) => {
      if (e.key === "Escape") closeEditModal();
    };
    const handleClick = (e) => {
      if (editModalRef.current && !editModalRef.current.contains(e.target)) {
        closeEditModal();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [editTask]);

  // Fetch profile
  const fetchProfile = async () => {
  setProfileLoading(true);
  setProfileError("");
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/user/profile`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setProfile(res.data);
    setProfileForm({
      name: res.data.name,
      email: res.data.email,
      currentPassword: '',
      newPassword: '',
      notificationPrefs: res.data.notificationPrefs || { email: true, browser: true },
    });
  } catch (err) {
    setProfileError("Failed to load profile");
  } finally {
    setProfileLoading(false);
  }
};

  const openProfile = () => {
    setShowProfile(true);
    fetchProfile();
  };
  const closeProfile = () => {
    setShowProfile(false);
    setProfileError("");
    setProfileSuccess(false);
    setProfileForm({ name: '', email: '', currentPassword: '', newPassword: '', notificationPrefs: { email: true, browser: true } });
  };
  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleNotifPrefChange = async (type, value) => {
    setProfileForm((prev) => ({ ...prev, notificationPrefs: { ...prev.notificationPrefs, [type]: value } }));
    if (type === 'browser' && value === true) {
      const vapidKey = "BCulMNS7FrJBtkAbaBkW7ZrSr3Kl8WP2H325m2wxj9Pgvno4qNhnYz8V6pi4j3EDepiuURW4qmoYCJW1YlDF0nI";
      const token = await requestForToken(vapidKey);
      if (token) {
        saveFcmToken(token);
      }
    }
  };
  const saveProfile = async (e) => {
  e.preventDefault();
  setProfileLoading(true);
  setProfileError("");
  try {
    await axios.patch(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/user/profile`,
      {
        name: profileForm.name,
        email: profileForm.email,
        currentPassword: profileForm.currentPassword || undefined,
        newPassword: profileForm.newPassword || undefined,
        notificationPrefs: profileForm.notificationPrefs,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2000);
    fetchProfile();
  } catch (err) {
    setProfileError("Failed to update profile");
  } finally {
    setProfileLoading(false);
    setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
  }
};

  const deleteAccount = async () => {
  setProfileLoading(true);
  setProfileError("");
  try {
    await axios.delete(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/user/profile`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    localStorage.removeItem("token");
    window.location.href = "/login";
  } catch (err) {
    setProfileError("Failed to delete account");
    setProfileLoading(false);
  }
};


  return (
    <div className={`min-h-screen p-0 glass-bg ${theme}`}>
      {/* NavBar */}
      <nav className="glass-navbar flex items-center justify-between px-6 py-3 mb-8">
        <div className="flex items-center gap-3">
          <LogoSVG />
          <span className="font-bold text-xl tracking-tight">CloudTasker</span>
        </div>
        <div className="flex gap-2 sm:gap-4">
          <button
            className={`glass-nav-btn ${selectedSection === "calendar" ? "active" : ""}`}
            onClick={() => setSelectedSection("calendar")}
          >
            Calendar
          </button>
          <button
            className={`glass-nav-btn ${selectedSection === "add" ? "active" : ""}`}
            onClick={() => setSelectedSection("add")}
          >
            Add Task
          </button>
          <button
            className={`glass-nav-btn ${selectedSection === "tasks" ? "active" : ""}`}
            onClick={() => setSelectedSection("tasks")}
          >
            Tasks List
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="glass-btn px-3 py-1"
            onClick={openProfile}
            title="Profile"
          >
            Profile
          </button>
          <button
            className="glass-btn px-3 py-1"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <button
            className="glass-btn px-4 py-2 ml-2"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Only one section visible at a time */}
      <div className="w-full flex flex-col items-center">
        {selectedSection === "calendar" && (
          <div className="max-w-3xl w-full mb-8 glass-card p-6">
            <h2 className="text-lg font-semibold mb-2 text-center">📅 Calendar View</h2>
            <div className="flex justify-center">
              <div className="inline-block">
                <Calendar onChange={setCalendarDate} value={calendarDate} />
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {tasksForDate.length === 0 ? (
                <li className="text-center text-gray-300">No tasks for this date.</li>
              ) : (
                tasksForDate.map((task) => (
                  <li key={task._id} className="glass-list-item p-2 rounded shadow">
                    {task.title} {task.completed && "✅"}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {selectedSection === "add" && (
          <form
            onSubmit={addTask}
            className="glass-card p-6 mb-8 rounded shadow-md w-full max-w-xl"
          >
            <h2 className="text-lg font-semibold mb-4 text-center">➕ Add New Task</h2>
            <input
              type="text"
              placeholder="Task Title"
              className="w-full p-2 mb-3 border rounded glass-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Description (optional)"
              className="w-full p-2 mb-3 border rounded glass-input min-h-[60px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {/* Subtasks Section */}
            <div className="mb-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="w-full p-2 border rounded glass-input"
                  placeholder="Add subtask"
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newSubtask.trim()) { setSubtasks([...subtasks, { text: newSubtask, completed: false }]); setNewSubtask(""); } } }}
                />
                <button
                  type="button"
                  className="glass-btn px-3"
                  onClick={() => { if (newSubtask.trim()) { setSubtasks([...subtasks, { text: newSubtask, completed: false }]); setNewSubtask(""); } }}
                >Add</button>
              </div>
              {subtasks.length > 0 && (
                <ul className="space-y-1">
                  {subtasks.map((st, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <input type="checkbox" checked={st.completed} onChange={() => setSubtasks(subtasks.map((s, i) => i === idx ? { ...s, completed: !s.completed } : s))} />
                      <span className={st.completed ? "line-through text-gray-400" : ""}>{st.text}</span>
                      <button type="button" className="text-red-400 ml-2" onClick={() => setSubtasks(subtasks.filter((_, i) => i !== idx))}>&times;</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* End Subtasks Section */}
            <div className="flex gap-3 mb-3">
              <select
                className="w-1/2 p-2 border rounded glass-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                className="w-1/2 p-2 border rounded glass-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Recurring Dropdown */}
            <div className="mb-3">
              <select
                className="w-full p-2 border rounded glass-input"
                value={recurring}
                onChange={e => setRecurring(e.target.value)}
              >
                {RECURRING_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* End Recurring Dropdown */}
            <DatePicker
              selected={deadline}
              onChange={(date) => setDeadline(date)}
              showTimeSelect
              timeFormat="hh:mm aa"
              timeIntervals={1}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full p-2 mb-3 border rounded glass-input"
              placeholderText="Select deadline"
            />
            <button
              type="submit"
              className="w-full glass-btn text-white py-2 rounded hover:bg-blue-700"
            >
              Add Task
            </button>
          </form>
        )}

        {selectedSection === "tasks" && (
          <div className="max-w-3xl w-full">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm text-gray-400">{completedCount}/{totalCount} completed</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg,#6366f1,#0ea5e9)" }}
                ></div>
              </div>
            </div>
            {/* Filters */}
            <div className="glass-card mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
              <select
                className="border rounded p-2 w-full sm:w-auto glass-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
              <select
                className="border rounded p-2 w-full sm:w-auto glass-input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                className="border rounded p-2 w-full sm:w-auto glass-input"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search by title or date"
                className="border rounded p-2 w-full sm:w-64 glass-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {filteredTasks.length === 0 ? (
              <p className="text-center text-gray-300">No tasks found.</p>
            ) : (
              <ul className="space-y-3">
                {filteredTasks.map((task) => {
                  const isLooping = !!reminderIntervals[task._id];
                  const isStopped = stoppedTasks.includes(task._id);
                  const deadlinePassed =
                    task.deadline && new Date(task.deadline).getTime() < Date.now();
                  const dueSoon =
                    task.deadline && !task.completed && !deadlinePassed &&
                    new Date(task.deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000;
                  const categoryObj = CATEGORY_OPTIONS.find((c) => c.value === task.category);
                  const priorityObj = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
                  return (
                    <li
                      key={task._id}
                      className={`glass-list-item p-3 rounded shadow flex flex-col sm:flex-row justify-between items-start sm:items-center ${deadlinePassed ? "border-red-500 border-2" : dueSoon ? "border-yellow-400 border-2" : ""}`}
                    >
                      <div className="mb-2 sm:mb-0">
                        <div className="flex gap-2 mb-1">
                          {categoryObj && (
                            <span style={{ background: categoryObj.color, color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>{categoryObj.label}</span>
                          )}
                          {priorityObj && (
                            <span style={{ background: priorityObj.color, color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>{priorityObj.label}</span>
                          )}
                          {task.recurring && task.recurring !== 'none' && (
                            <span style={{ background: '#6366f1', color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 15, marginRight: 3 }}>🔁</span>
                              {RECURRING_OPTIONS.find(opt => opt.value === task.recurring)?.label || 'Recurring'}
                            </span>
                          )}
                        </div>
                        <h2 className="font-semibold">
                          {task.title} {task.completed && "✅"}
                        </h2>
                        {task.description && (
                          <p className="text-sm text-gray-300 mb-1 whitespace-pre-line">{task.description}</p>
                        )}
                        {/* Subtasks checklist */}
                        {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
                          <ul className="mb-1 ml-2 space-y-1">
                            {task.subtasks.map((st, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <input type="checkbox" checked={st.completed} readOnly />
                                <span className={st.completed ? "line-through text-gray-400" : ""}>{st.text}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {task.deadline && (
                          <p className="text-sm text-gray-400">
                            Due: {new Date(task.deadline).toLocaleString()}
                          </p>
                        )}
                        {deadlinePassed && !task.completed && (
                          <p className="text-red-400 text-sm">⚠️ Deadline missed</p>
                        )}
                        {dueSoon && !task.completed && !deadlinePassed && (
                          <p className="text-yellow-300 text-sm">⏰ Due soon</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!task.completed && (
                          <button
                            onClick={() => markComplete(task._id)}
                            className="glass-btn bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          >
                            ✅ Done
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(task)}
                          className="glass-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        {isLooping && (
                          <button
                            onClick={() => stopReminderLoop(task._id)}
                            className="glass-btn bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                          >
                            🛑 Stop
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="glass-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Edit Success Toast */}
      {showEditSuccess && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-lg shadow-lg animate-fade-in-out">
          Task updated!
        </div>
      )}
      {/* Edit Modal */}
      {editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300 animate-fade-in">
          <form ref={editModalRef} className="glass-card p-6 rounded-2xl shadow-lg w-full max-w-md relative animate-slide-up" onSubmit={saveEdit}>
            <button type="button" className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-200" onClick={closeEditModal}>&times;</button>
            <h2 className="text-lg font-semibold mb-4 text-center">Edit Task</h2>
            <input
              type="text"
              placeholder="Task Title"
              className="w-full p-2 mb-3 border rounded glass-input"
              value={editForm.title}
              onChange={e => handleEditChange('title', e.target.value)}
              required
              ref={editTitleInputRef}
            />
            {editError && <div className="text-red-400 text-sm mb-2">{editError}</div>}
            <textarea
              placeholder="Description (optional)"
              className="w-full p-2 mb-3 border rounded glass-input min-h-[60px]"
              value={editForm.description}
              onChange={e => handleEditChange('description', e.target.value)}
            />
            {/* Edit Subtasks Section */}
            <div className="mb-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="w-full p-2 border rounded glass-input"
                  placeholder="Add subtask"
                  value={editNewSubtask}
                  onChange={e => setEditNewSubtask(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (editNewSubtask.trim()) { setEditSubtasks([...editSubtasks, { text: editNewSubtask, completed: false }]); setEditNewSubtask(""); } } }}
                />
                <button
                  type="button"
                  className="glass-btn px-3"
                  onClick={() => { if (editNewSubtask.trim()) { setEditSubtasks([...editSubtasks, { text: editNewSubtask, completed: false }]); setEditNewSubtask(""); } }}
                >Add</button>
              </div>
              {editSubtasks.length > 0 && (
                <ul className="space-y-1">
                  {editSubtasks.map((st, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <input type="checkbox" checked={st.completed} onChange={() => setEditSubtasks(editSubtasks.map((s, i) => i === idx ? { ...s, completed: !s.completed } : s))} />
                      <span className={st.completed ? "line-through text-gray-400" : ""}>{st.text}</span>
                      <button type="button" className="text-red-400 ml-2" onClick={() => setEditSubtasks(editSubtasks.filter((_, i) => i !== idx))}>&times;</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* End Edit Subtasks Section */}
            <div className="flex gap-3 mb-3">
              <select
                className="w-1/2 p-2 border rounded glass-input"
                value={editForm.category}
                onChange={e => handleEditChange('category', e.target.value)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                className="w-1/2 p-2 border rounded glass-input"
                value={editForm.priority}
                onChange={e => handleEditChange('priority', e.target.value)}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Edit Recurring Dropdown */}
            <div className="mb-3">
              <select
                className="w-full p-2 border rounded glass-input"
                value={editRecurring}
                onChange={e => setEditRecurring(e.target.value)}
              >
                {RECURRING_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* End Edit Recurring Dropdown */}
            <DatePicker
              selected={editForm.deadline}
              onChange={date => handleEditChange('deadline', date)}
              showTimeSelect
              timeFormat="hh:mm aa"
              timeIntervals={1}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full p-2 mb-3 border rounded glass-input"
              placeholderText="Select deadline"
            />
            <button
              type="submit"
              className="w-full glass-btn text-white py-2 rounded hover:bg-blue-700 mt-2 flex items-center justify-center"
              disabled={editLoading}
            >
              {editLoading ? <span className="loader mr-2"></span> : null}
              Save Changes
            </button>
          </form>
        </div>
      )}
      {/* Profile Modal */}
      {showProfile && !showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <form className="glass-card p-6 rounded-2xl shadow-lg w-full max-w-md relative animate-slide-up" onSubmit={saveProfile}>
            <button type="button" className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-200" onClick={closeProfile}>&times;</button>
            {profileLoading ? (
              <div className="text-center text-gray-400">Loading...</div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="avatar-circle">
                    {(profile.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{profile.name}</h2>
                    <p className="text-sm text-gray-400">Joined on {new Date(profile.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full p-2 mb-3 border rounded glass-input"
                  value={profileForm.name}
                  onChange={e => handleProfileChange('name', e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-2 mb-3 border rounded glass-input"
                  value={profileForm.email}
                  onChange={e => handleProfileChange('email', e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Current Password (required for new password)"
                  className="w-full p-2 mb-3 border rounded glass-input"
                  value={profileForm.currentPassword}
                  onChange={e => handleProfileChange('currentPassword', e.target.value)}
                />
                <input
                  type="password"
                  placeholder="New Password (leave blank to keep current)"
                  className="w-full p-2 mb-3 border rounded glass-input"
                  value={profileForm.newPassword}
                  onChange={e => handleProfileChange('newPassword', e.target.value)}
                />
                {/* Notification Preferences */}
                <div className="mb-3 flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profileForm.notificationPrefs.email}
                      onChange={e => handleNotifPrefChange('email', e.target.checked)}
                    />
                    Email Reminders
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profileForm.notificationPrefs.browser}
                      onChange={e => handleNotifPrefChange('browser', e.target.checked)}
                    />
                    Browser Reminders
                  </label>
                </div>
                {/* End Notification Preferences */}
                {profileError && <div className="text-red-400 text-sm mb-2">{profileError}</div>}
                <button
                  type="submit"
                  className="w-full glass-btn text-white py-2 rounded hover:bg-blue-700 mt-2 flex items-center justify-center"
                  disabled={profileLoading}
                >
                  {profileLoading ? <span className="loader mr-2"></span> : null}
                  Save Changes
                </button>
                {profileSuccess && (
                  <div className="text-green-400 text-center mt-2">Profile updated!</div>
                )}
                <div className="mt-4 border-t border-gray-600 pt-3">
                  <button
                    type="button"
                    className="w-full bg-red-800 text-white py-2 rounded"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <div className="glass-card p-6 rounded-2xl shadow-lg w-full max-w-md relative animate-slide-up">
            <h2 className="text-lg font-bold mb-2">Are you sure?</h2>
            <p className="text-gray-300 mb-4">This will permanently delete your account and all your tasks. This action cannot be undone.</p>
            <div className="flex gap-4">
              <button
                className="w-full bg-gray-600 text-white py-2 rounded"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={profileLoading}
              >
                Cancel
              </button>
              <button
                className="w-full bg-red-800 text-white py-2 rounded flex items-center justify-center"
                onClick={deleteAccount}
                disabled={profileLoading}
              >
                {profileLoading ? <span className="loader mr-2"></span> : null}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
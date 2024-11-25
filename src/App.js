import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Search, Edit2, User, Bell, Globe, Settings, Check, Square, CalendarDays } from 'lucide-react';
import './App.css';

const App = () => {
  // Existing Todo state
  const [allTodos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [tasksVisible, setTasksVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showMainTasks, setShowMainTasks] = useState(true);
  const [showScheduledTasks, setShowScheduledTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterTaskType, setFilterTaskType] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Security Profile state
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedCountry, setSelectedCountry] = useState('us');

  // Category colors for indicators
  const categoryColors = {
    personal: '#FF69B4',
    work: '#FFD700',
    fun: '#87CEFA',
  };

  // Task type configurations
  const taskTypes = {
    urgent: { label: 'Urgent', color: '#ff4444' },
    regular: { label: 'Regular', color: '#4CAF50' },
    lowPriority: { label: 'Low Priority', color: '#9e9e9e' },
  };

  // Modified Notification Function
  const checkAndNotify = () => {
    if (!notifications) return;

    const now = new Date();
    const currentTime = now.getTime();

    allTodos.forEach(todo => {
      if (todo.completed) return; // Skip completed tasks
      
      const todoTime = new Date(todo.time).getTime();
      const timeDiff = todoTime - currentTime;
      
      if (timeDiff >= 0 && timeDiff <= 60000) {
        if ('Notification' in window) {
          if (Notification.permission !== 'granted') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                createNotification(todo);
              }
            });
          } else {
            createNotification(todo);
          }
        }
      }
    });
  };

  const createNotification = (todo) => {
    const notification = new Notification('Task Due!', {
      body: `Task "${todo.title}" is due now!`,
      icon: '/favicon.ico',
      tag: todo.id,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  useEffect(() => {
    checkAndNotify();
    const interval = setInterval(checkAndNotify, 10000);
    
    if (notifications && 'Notification' in window) {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, [allTodos, notifications]);

  // Todo functions
  const getCategoryTasks = (category) => {
    return allTodos.filter((todo) => todo.category === category);
  };

  const handleAddTodo = () => {
    if (!newTitle || !newTime || !newCategory || !newTaskType) return;

    const newTodo = {
      id: Date.now(),
      title: newTitle,
      time: newTime,
      category: newCategory.toLowerCase(),
      taskType: newTaskType,
      completed: false,
      completedAt: null
    };

    const updatedTodos = [...allTodos, newTodo];
    setTodos(updatedTodos);
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
    setNewTitle('');
    setNewTime('');
    setNewCategory('');
    setNewTaskType('');

    setActiveCategory(newCategory.toLowerCase());
    setShowMainTasks(false);
    setShowScheduledTasks(false);

    checkAndNotify();
  };

  const handleDeleteTodo = (id) => {
    const updatedTodos = allTodos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
  };

  const handleToggleComplete = (id) => {
    const updatedTodos = allTodos.map((todo) => {
      if (todo.id === id) {
        return {
          ...todo,
          completed: !todo.completed,
          completedAt: !todo.completed ? new Date().toISOString() : null
        };
      }
      return todo;
    });
    setTodos(updatedTodos);
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
  };

  const handleEditTodo = (id) => {
    const todoToEdit = allTodos.find((todo) => todo.id === id);
    setEditingTodo(todoToEdit);
    setNewTitle(todoToEdit.title);
    setNewTime(todoToEdit.time);
    setNewCategory(todoToEdit.category);
    setNewTaskType(todoToEdit.taskType);
  };

  const handleSaveEdit = () => {
    if (!newTitle || !newTime || !newCategory || !newTaskType) return;

    const updatedTodos = allTodos.map((todo) =>
      todo.id === editingTodo.id
        ? {
            ...todo,
            title: newTitle,
            time: newTime,
            category: newCategory.toLowerCase(),
            taskType: newTaskType,
          }
        : todo
    );
    setTodos(updatedTodos);
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
    setEditingTodo(null);
    setNewTitle('');
    setNewTime('');
    setNewCategory('');
    setNewTaskType('');

    checkAndNotify();
  };

  const toggleTasksVisibility = () => {
    setTasksVisible(!tasksVisible);
    setActiveCategory(null);
    setShowMainTasks(true);
    setShowScheduledTasks(false);
    setShowProfile(false);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setShowMainTasks(false);
    setShowScheduledTasks(false);
    setShowProfile(false);
  };

  const handleScheduledTasksClick = () => {
    setShowScheduledTasks(true);
    setShowMainTasks(false);
    setActiveCategory(null);
    setTasksVisible(false);
    setShowProfile(false);
  };

  const getFilteredTasks = () => {
    let filtered = [...allTodos];

    // Filter by completion status
    filtered = filtered.filter(todo => showCompleted ? todo.completed : !todo.completed);

    if (searchQuery) {
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterDate) {
      filtered = filtered.filter(todo => {
        const todoDate = new Date(todo.time).toLocaleDateString();
        const filterDateObj = new Date(filterDate).toLocaleDateString();
        return todoDate === filterDateObj;
      });
    }

    if (filterTaskType) {
      filtered = filtered.filter(todo => todo.taskType === filterTaskType);
    }

    return filtered.sort((a, b) => new Date(a.time) - new Date(b.time));
  };

  // Profile Functions remain the same...
  const handleSettingsClick = () => {
    setShowProfile(true);
    setShowMainTasks(false);
    setShowScheduledTasks(false);
    setActiveCategory(null);
    setTasksVisible(false);
  };

  const handleSaveProfileName = () => {
    setIsEditingName(false);
    localStorage.setItem('profileName', profileName);
  };

  const toggleNotifications = () => {
    const newNotificationState = !notifications;
    setNotifications(newNotificationState);
    localStorage.setItem('notifications', JSON.stringify(newNotificationState));

    if (newNotificationState && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    localStorage.setItem('language', e.target.value);
  };

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
    localStorage.setItem('country', e.target.value);
  };

  useEffect(() => {
    const savedTodos = JSON.parse(localStorage.getItem('todos')) || [];
    const savedName = localStorage.getItem('profileName') || '';
    const savedNotifications = JSON.parse(localStorage.getItem('notifications')) ?? true;
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedCountry = localStorage.getItem('country') || 'us';

    setTodos(savedTodos);
    setProfileName(savedName);
    setNotifications(savedNotifications);
    setSelectedLanguage(savedLanguage);
    setSelectedCountry(savedCountry);
  }, []);

  const displayedTasks = showScheduledTasks
    ? getFilteredTasks()
    : activeCategory
    ? getCategoryTasks(activeCategory).filter(todo => showCompleted ? todo.completed : !todo.completed)
    : allTodos.filter(todo => showCompleted ? todo.completed : !todo.completed);

  return (
    <div className="container">
      <div className="app">
        <div className="sidebar">
          <div className="menu-content">
            <div className="title-section">
              <h2 className="text-2xl font-bold mb-1">Do-it</h2>
              <div className="profile">{profileName}</div>
            </div>
            <nav className="mt-6">
              <ul>
                <li
                  className={`clickable ${showMainTasks ? 'active' : ''}`}
                  onClick={toggleTasksVisibility}
                >
                  <CalendarDays className="inline-icon" size={16} />
                  Today tasks
                </li>
                {tasksVisible && (
                  <ul className="task-list">
                    {Object.entries(categoryColors).map(([category, color]) => (
                      <li
                        key={category}
                        className={`clickable ${activeCategory === category ? 'active' : ''}`}
                        onClick={() => handleCategoryClick(category)}
                      >
                        <span
                          className="dot"
                          style={{ backgroundColor: color }}
                        ></span>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <span className="task-count">
                          ({getCategoryTasks(category).filter(todo => !todo.completed).length})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <li
                  className={`clickable ${showScheduledTasks ? 'active' : ''}`}
                  onClick={handleScheduledTasksClick}
                >
                  <Calendar className="inline-icon" size={16} />
                  Scheduled tasks
                </li>
                <li
                  className={`clickable ${showProfile ? 'active' : ''}`}
                  onClick={handleSettingsClick}
                >
                  <Settings className="inline-icon" size={16} />
                  Settings
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="main">
          {!showProfile ? (
            <div className="app-container">
              <div className="header">
                <span className="subtitle">
                  {showScheduledTasks
                    ? 'Scheduled Tasks'
                    : activeCategory
                    ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Tasks`
                    : 'Today main focus'}
                </span>
                <h1 className="title">
                  {showScheduledTasks
                    ? `${getFilteredTasks().length} scheduled tasks`
                    : activeCategory
                    ? `${getCategoryTasks(activeCategory).length} ${activeCategory} tasks`
                    : displayedTasks.length > 0
                    ? displayedTasks[0].title
                    : ''}
                </h1>
              </div>

              {showScheduledTasks && (
                <div className="filters-container">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="date-filter"
                  />
                  <select
                    value={filterTaskType}
                    onChange={(e) => setFilterTaskType(e.target.value)}
                    className="task-type-filter"
                  >
                    <option value="">All Types</option>
                    {Object.entries(taskTypes).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={`toggle-completed ${showCompleted ? 'active' : ''}`}
                  >
                    {showCompleted ? 'Show Active' : 'Show Completed'}
                  </button>
                </div>
              )}

              {!showScheduledTasks && !activeCategory && (
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="What is your next task?"
                    className="task-input"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <input
                    type="datetime-local"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    <option value="personal">Personal</option>
                    <option value="fun">Fun</option>
                    <option value="work">Work</option>
                  </select>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    className="task-type-select"
                  >
                    <option value="">Select Type</option>
                    {Object.entries(taskTypes).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {editingTodo ? (
                    <button onClick={handleSaveEdit} className="add-button">
                      Save Changes
                    </button>
                  ) : (
                    <button onClick={handleAddTodo} className="add-button">
                      Add Task
                    </button>
                  )}
                </div>
              )}

              <div className="tasks-container">
                {displayedTasks.map((todo) => (
                  <div
                    key={todo.id}
                    className={`task-item ${todo.completed ? 'completed' : ''}`}
                    style={{
                      borderLeft: `4px solid ${categoryColors[todo.category]}`,
                    }}
                  >
                    <div className="task-content">
                      <div className="task-header">
                        <div className="task-title">
                          <button
                            onClick={() => handleToggleComplete(todo.id)}
                            className="complete-button"
                          >
                            {todo.completed ? <Check size={16} /> : <Square size={16} />}
                          </button>
                          <span className={todo.completed ? 'completed-text' : ''}>
                            {todo.title}
                          </span>
                        </div>
                        <div className="task-actions">
                          <button
                            onClick={() => handleEditTodo(todo.id)}
                            className="edit-button"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="delete-button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="task-details">
                        <span className="task-time">
                          {new Date(todo.time).toLocaleString()}
                        </span>
                        <span
                          className="task-type"
                          style={{ backgroundColor: taskTypes[todo.taskType].color }}
                        >
                          {taskTypes[todo.taskType].label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="profile-container">
              <h2>Profile Settings</h2>
              <div className="profile-section">
                <div className="profile-field">
                  <label>Name</label>
                  {isEditingName ? (
                    <div className="edit-name-container">
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="name-input"
                      />
                      <button onClick={handleSaveProfileName} className="save-name-button">
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="name-display" onClick={() => setIsEditingName(true)}>
                      <User size={16} />
                      <span>{profileName || 'Click to set name'}</span>
                      <Edit2 size={16} />
                    </div>
                  )}
                </div>

                <div className="profile-field">
                  <label>Notifications</label>
                  <div className="toggle-container">
                    <Bell size={16} />
                    <button
                      onClick={toggleNotifications}
                      className={`toggle-button ${notifications ? 'active' : ''}`}
                    >
                      {notifications ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <div className="profile-field">
                  <label>Language</label>
                  <div className="select-container">
                    <Globe size={16} />
                    <select value={selectedLanguage} onChange={handleLanguageChange}>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>

                <div className="profile-field">
                  <label>Country</label>
                  <div className="select-container">
                    <Globe size={16} />
                    <select value={selectedCountry} onChange={handleCountryChange}>
                      <option value="us">United States</option>
                      <option value="uk">United Kingdom</option>
                      <option value="ca">Canada</option>
                      <option value="au">Australia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

import React, { useEffect, useState, useRef } from "react";

function AssigneeTable() {
  // State management
  const [employees, setEmployees] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState("all");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    event: "",
    status: "Pending"
  });

  // Tooltip state
  const [hoveredEmployee, setHoveredEmployee] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const rowRefs = useRef({});

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployeesWithTasks(),
        fetchEvents(),
        fetchAllTasks()
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // API calls
  const fetchEmployeesWithTasks = async () => {
    try {
      const res = await fetch("http://localhost:3000/employees/with-tasks");
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:3000/events");
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      if (data && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEvents([]);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const res = await fetch("http://localhost:3000/tasks/display");
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
      setAvailableTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
      setAvailableTasks([]);
    }
  };

  // Filter employees based on search and event filter
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase());
    
    // Filter by event - check if employee has tasks for this event
    const matchesFilter = filterEvent === "all" || 
      emp.tasks?.some(task => task.event?.name === filterEvent);
    
    return matchesSearch && matchesFilter;
  });

  // Open task assignment modal
  const openTaskModal = (employee) => {
    setCurrentEmployee(employee);
    // Pre-select tasks that the employee is already assigned to
    const assignedTaskIds = employee.tasks?.map(task => task._id) || [];
    setSelectedTasks(assignedTaskIds);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setCurrentEmployee(null);
    setSelectedTasks([]);
  };

  // Open create task modal
  const openCreateTaskModal = () => {
    setNewTask({
      title: "",
      description: "",
      event: "",
      status: "Pending"
    });
    setShowCreateTaskModal(true);
  };

  const closeCreateTaskModal = () => {
    setShowCreateTaskModal(false);
  };

  // Handle task selection
  const handleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Handle new task form changes
  const handleNewTaskChange = (field, value) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create new task
  const createNewTask = async () => {
    if (!newTask.title.trim()) {
      alert("Task title is required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/tasks/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          event: newTask.event || null,
          status: newTask.status,
          assignedTo: []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }

      alert("Task created successfully!");
      closeCreateTaskModal();
      fetchAllTasks(); // Refresh the tasks list
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // Save task assignments
  const saveTaskAssignments = async () => {
    if (!currentEmployee) return;

    try {
      setLoading(true);
      
      // Get current assigned tasks
      const currentAssignedTasks = currentEmployee.tasks?.map(task => task._id) || [];
      
      // Tasks to add (selected but not currently assigned)
      const tasksToAdd = selectedTasks.filter(taskId => 
        !currentAssignedTasks.includes(taskId)
      );
      
      // Tasks to remove (currently assigned but not selected)
      const tasksToRemove = currentAssignedTasks.filter(taskId => 
        !selectedTasks.includes(taskId)
      );

      // Add new assignments
      for (const taskId of tasksToAdd) {
        await fetch(`http://localhost:3000/tasks/${taskId}/assign-employee/${currentEmployee._id}`, {
          method: "POST",
        });
      }

      // Remove old assignments
      for (const taskId of tasksToRemove) {
        await fetch(`http://localhost:3000/tasks/${taskId}/remove-employee/${currentEmployee._id}`, {
          method: "DELETE",
        });
      }

      alert("Task assignments updated successfully!");
      closeTaskModal();
      fetchEmployeesWithTasks();
    } catch (error) {
      console.error("Error updating task assignments:", error);
      alert("Failed to update task assignments");
    } finally {
      setLoading(false);
    }
  };

  // Remove employee from all tasks
  const removeFromAllTasks = async (employeeId) => {
    if (!window.confirm("Are you sure you want to remove this employee from all tasks?")) {
      return;
    }

    try {
      setLoading(true);
      const employee = employees.find(emp => emp._id === employeeId);
      const taskIds = employee?.tasks?.map(task => task._id) || [];

      for (const taskId of taskIds) {
        await fetch(`http://localhost:3000/tasks/${taskId}/remove-employee/${employeeId}`, {
          method: "DELETE",
        });
      }

      alert("Employee removed from all tasks successfully!");
      fetchEmployeesWithTasks();
    } catch (error) {
      console.error("Error removing employee from tasks:", error);
      alert("Failed to remove employee from tasks");
    } finally {
      setLoading(false);
    }
  };

  // Tooltip handlers
  const handleMouseEnter = (employee, event) => {
    const rowElement = rowRefs.current[employee._id];
    if (!rowElement) return;

    const rect = rowElement.getBoundingClientRect();
    const tooltipWidth = 320;
    
    let left = rect.right + 10;
    let top = rect.top + window.scrollY;

    // Adjust position to avoid viewport edges
    if (left + tooltipWidth > window.innerWidth) {
      left = rect.left - tooltipWidth - 10;
    }

    if (left < 10) {
      left = 10;
    }

    if (top + 250 > window.innerHeight + window.scrollY) {
      top = window.innerHeight + window.scrollY - 250 - 10;
    }

    if (top < window.scrollY + 10) {
      top = window.scrollY + 10;
    }

    setTooltipPos({ top, left });
    setHoveredEmployee(employee);
  };

  const handleMouseLeave = () => {
    setHoveredEmployee(null);
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Task Assignment Management</h1>
              <p className="text-gray-600 mt-1">Manage which tasks are assigned to employees</p>
            </div>
            <button
              onClick={openCreateTaskModal}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <span>+</span>
              <span>Create New Task</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search employees by name, email, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Events</option>
              <option value="Unassigned">Unassigned</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev.name}>
                  {ev.name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchInitialData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>🔄</span>
              <span>{loading ? "Loading..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
              <div className="text-sm text-gray-600">Total Employees</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {employees.filter(emp => emp.assignedTaskCount > 0).length}
              </div>
              <div className="text-sm text-gray-600">Assigned to Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {employees.filter(emp => emp.assignedTaskCount === 0).length}
              </div>
              <div className="text-sm text-gray-600">No Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((emp) => (
                <EmployeeRow
                  key={emp._id}
                  employee={emp}
                  onAssignTasks={openTaskModal}
                  onRemoveFromAllTasks={removeFromAllTasks}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  ref={(el) => (rowRefs.current[emp._id] = el)}
                />
              ))}
            </tbody>
          </table>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                {search || filterEvent !== "all" 
                  ? "No matching employees found" 
                  : "No employees found"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredEmployee && (
        <div
          style={{
            position: 'absolute',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 1000,
          }}
          onMouseEnter={() => setHoveredEmployee(hoveredEmployee)}
          onMouseLeave={handleMouseLeave}
          className="bg-white border border-gray-300 rounded-lg shadow-xl w-80"
        >
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Employee Tasks</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-blue-800">
                  {hoveredEmployee.name ? hoveredEmployee.name.charAt(0).toUpperCase() : '👤'}
                </span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{hoveredEmployee.name}</div>
                <div className="text-sm text-gray-600">{hoveredEmployee.department}</div>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Assigned Tasks:</span>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {hoveredEmployee.tasks && hoveredEmployee.tasks.length > 0 ? (
                  hoveredEmployee.tasks.map((task, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded border">
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-gray-600 text-xs">{task.description}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.status === "Completed" 
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {task.status}
                        </span>
                        {task.event && (
                          <span className="text-xs text-gray-500">{task.event.name}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">No tasks assigned</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Assignment Modal */}
      {showTaskModal && currentEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Assign Tasks to {currentEmployee.name}
                  </h2>
                  <p className="text-gray-600 mt-1">Select tasks to assign to this employee</p>
                </div>
                <button
                  onClick={openCreateTaskModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <span>+</span>
                  <span>New Task</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {availableTasks.map((task) => (
                  <div key={task._id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task._id)}
                      onChange={() => handleTaskSelection(task._id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        {task.event && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {task.event.name}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.status === "Completed" 
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {availableTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No tasks available. Create some tasks first.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={closeTaskModal}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTaskAssignments}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  "Save Assignments"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Create New Task</h2>
              <p className="text-gray-600 mt-1">Add a new task that can be assigned to employees</p>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => handleNewTaskChange("title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => handleNewTaskChange("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event
                  </label>
                  <select
                    value={newTask.event}
                    onChange={(e) => handleNewTaskChange("event", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Event</option>
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) => handleNewTaskChange("status", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={closeCreateTaskModal}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={createNewTask}
                disabled={loading || !newTask.title.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Employee Row Component
const EmployeeRow = React.forwardRef(({ employee, onAssignTasks, onRemoveFromAllTasks, onMouseEnter, onMouseLeave }, ref) => {
  const assignedTasks = employee.tasks || [];
  const employeeEvents = [...new Set(assignedTasks.filter(task => task.event).map(task => task.event.name))];

  return (
    <tr
      ref={ref}
      onMouseEnter={(e) => onMouseEnter(employee, e)}
      onMouseLeave={onMouseLeave}
      className="hover:bg-gray-50 transition-colors"
    >
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-blue-800">
              {employee.name ? employee.name.charAt(0).toUpperCase() : '👤'}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
            <div className="text-sm text-gray-500">{employee.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-600">
          {employee.department ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {employee.department}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          {assignedTasks.length > 0 ? (
            <div>
              <span className="font-medium text-gray-700">{assignedTasks.length} tasks</span>
              <div className="text-xs text-gray-500 mt-1">
                {assignedTasks.slice(0, 2).map(task => task.title).join(', ')}
                {assignedTasks.length > 2 && ` +${assignedTasks.length - 2} more`}
              </div>
            </div>
          ) : (
            <span className="text-gray-400">No tasks assigned</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          {employeeEvents.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {employeeEvents.slice(0, 2).map((event, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {event}
                </span>
              ))}
              {employeeEvents.length > 2 && (
                <span className="text-xs text-gray-500">+{employeeEvents.length - 2}</span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAssignTasks(employee)}
            className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded transition-colors bg-blue-50 hover:bg-blue-100 border border-blue-200"
            title="Manage task assignments"
          >
            📝 Assign Tasks
          </button>
          {assignedTasks.length > 0 && (
            <button
              onClick={() => onRemoveFromAllTasks(employee._id)}
              className="text-red-600 hover:text-red-900 px-3 py-1 rounded transition-colors bg-red-50 hover:bg-red-100 border border-red-200"
              title="Remove from all tasks"
            >
              🗑️ Remove All
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export default AssigneeTable;
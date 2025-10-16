import React, { useEffect, useState } from "react";

function Tasks() {
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(true);

  // Load employees for login selection
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:3000/employees");
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchMyTasks = async (employeeId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/tasks/my-tasks?employeeId=${employeeId}`, {
        headers: {
          'employee-id': employeeId
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await res.json();
      setMyTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setMyTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeLogin = async (employeeId) => {
    try {
      const res = await fetch(`http://localhost:3000/employees/${employeeId}`);
      if (!res.ok) throw new Error('Employee not found');
      
      const employee = await res.json();
      setCurrentEmployee(employee);
      setShowLoginModal(false);
      fetchMyTasks(employeeId);
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Failed to login. Please try again.");
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    if (!currentEmployee) return;

    try {
      const res = await fetch(`http://localhost:3000/tasks/${taskId}/update-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'employee-id': currentEmployee._id
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update task status");
      }

      // Update local state
      setMyTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      alert("Task status updated successfully!");
    } catch (error) {
      console.error("Error updating task status:", error);
      alert(error.message || "Failed to update task status");
    }
  };

  const handleLogout = () => {
    setCurrentEmployee(null);
    setMyTasks([]);
    setShowLoginModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ['Pending', 'In Progress', 'Completed'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  // Group tasks by status for better organization
  const tasksByStatus = {
    'Pending': myTasks.filter(task => task.status === 'Pending'),
    'In Progress': myTasks.filter(task => task.status === 'In Progress'),
    'Completed': myTasks.filter(task => task.status === 'Completed')
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
                <p className="text-gray-600 mt-1">
                  {currentEmployee 
                    ? `Welcome, ${currentEmployee.name}! Manage your assigned tasks`
                    : 'Please login to view your tasks'
                  }
                </p>
              </div>
              
              {currentEmployee && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">
                        {currentEmployee.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{currentEmployee.name}</div>
                      <div className="text-gray-500">{currentEmployee.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {currentEmployee && (
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{myTasks.length}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {tasksByStatus['Pending'].length}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {tasksByStatus['In Progress'].length}
                  </div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {tasksByStatus['Completed'].length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-32">
            <div className="text-lg">Loading your tasks...</div>
          </div>
        )}

        {/* Tasks Display */}
        {currentEmployee && !loading && (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {tasksByStatus['Pending'].length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Pending Tasks ({tasksByStatus['Pending'].length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasksByStatus['Pending'].map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusUpdate={handleStatusUpdate}
                      currentEmployee={currentEmployee}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Tasks */}
            {tasksByStatus['In Progress'].length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  In Progress ({tasksByStatus['In Progress'].length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasksByStatus['In Progress'].map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusUpdate={handleStatusUpdate}
                      currentEmployee={currentEmployee}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {tasksByStatus['Completed'].length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Completed ({tasksByStatus['Completed'].length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasksByStatus['Completed'].map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusUpdate={handleStatusUpdate}
                      currentEmployee={currentEmployee}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {myTasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="text-gray-500 text-lg mb-2">No tasks assigned</div>
                <div className="text-gray-400">You don't have any tasks assigned to you yet.</div>
              </div>
            )}
          </div>
        )}

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Employee Login</h2>
                <p className="text-gray-600 mt-1">Select your account to view your tasks</p>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {employees.map((employee) => (
                    <button
                      key={employee._id}
                      onClick={() => handleEmployeeLogin(employee._id)}
                      className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {employee.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-600">{employee.email}</div>
                        <div className="text-xs text-gray-500">{employee.department} • {employee.role}</div>
                      </div>
                    </button>
                  ))}
                  
                  {employees.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No employees found. Please add employees first.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Card Component
const TaskCard = ({ task, onStatusUpdate, currentEmployee }) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (!currentEmployee) return;
    
    setUpdating(true);
    try {
      await onStatusUpdate(task._id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>
      
      <div className="space-y-2 mb-4">
        {task.event && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📅</span>
            <span>{task.event.name}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>👥</span>
          <span>
            {task.assignedTo?.length > 1 
              ? `You + ${task.assignedTo.length - 1} others`
              : 'Only you'
            }
          </span>
        </div>
      </div>

      {/* Status Update Controls */}
      <div className="border-t pt-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Update Status:
        </label>
        <div className="flex gap-2 flex-wrap">
          {['Pending', 'Completed']
            .filter(status => status !== task.status)
            .map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updating || status !== 'Completed'}
                className={`flex-1 text-xs px-3 py-2 rounded border transition-colors ${
                  updating 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-50'
                } ${
                  status === 'Completed' 
                    ? 'border-green-200 text-green-700'
                    : 'border-yellow-200 text-yellow-700'
                }`}
              >
                {updating ? '...' : `Mark as ${status}`}
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default Tasks;
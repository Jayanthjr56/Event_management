import express from 'express';
import { connectDB } from './sources/connections.js';
import Event from './models/events.js';
import tasks from './models/tasks.js';
import Employee from './models/employees.js';
import mongoose from 'mongoose';
import cors from "cors";

const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:1234",
  credentials: true,
}));

await connectDB();

// Events CRUD
app.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json({ events, count: events.length });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/events', async (req, res) => {
  try {
    const newEvent = new Event(req.body);   
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json({ events, count: events.length });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/events/:id', async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).send('Event not found');
    }
    res.status(200).json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.delete('/events/:id', async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);  
    if (!deletedEvent) {
      return res.status(404).send('Event not found');
    }
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



// Employees (Attendees) CRUD - UPDATED FOR YOUR SCHEMA
app.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/employees', async (req, res) => {
  try {
    const { name, email, department, role, phone, employeeType } = req.body;
    
    // Check if employee already exists with this email
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const newEmployee = new Employee({
      name,
      email,
      department: department || '',
      role: role || '',
      phone: phone || '',
      employeeType: employeeType || 'employee'
    });
    
    await newEmployee.save();
    res.status(201).json({ 
      message: "Employee added successfully", 
      employee: newEmployee 
    });
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put('/employees/:id', async (req, res) => {
  try {
    const { name, email, department, role, phone, employeeType } = req.body;
    
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        email, 
        department: department || '',
        role: role || '',
        phone: phone || '',
        employeeType: employeeType || 'employee'
      },
      { new: true }
    );
    
    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.status(200).json({ 
      message: "Employee updated successfully", 
      employee: updatedEmployee 
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete('/employees/:id', async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    
    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    // Also remove this employee from any tasks they're assigned to
    await tasks.updateMany(
      { assignedTo: req.params.id },
      { $pull: { assignedTo: req.params.id } }
    );
    
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get employees with their task assignments and events
app.get('/employees/with-assignments', async (req, res) => {
  try {
    const employees = await Employee.find();
    const allTasks = await tasks.find().populate('event').populate('assignedTo');
    
    const employeesWithAssignments = employees.map(employee => {
      const employeeTasks = allTasks.filter(task => 
        task.assignedTo.some(assigned => assigned._id.toString() === employee._id.toString())
      );
      
      const events = [...new Set(employeeTasks
        .filter(task => task.event)
        .map(task => task.event.name)
      )];
      
      return {
        ...employee.toObject(),
        events,
        tasksDetails: employeeTasks.map(task => ({
          title: task.title,
          description: task.description,
          status: task.status,
          eventName: task.event ? task.event.name : 'Unassigned'
        }))
      };
    });
    
    res.status(200).json(employeesWithAssignments);
  } catch (error) {
    console.error("Error fetching employees with assignments:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//  Tasks CRUD
app.get('/tasks/display', async (req, res) => {
  try {
    const allTasks = await tasks.find().populate('event').populate('assignedTo');
    res.status(200).json(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/tasks/add', async (req, res) => {
  try {
    const { title, description, status, event, assignedTo } = req.body;
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (event && event !== 'Unassigned') {
      const eventExists = await Event.findById(event);
      if (!eventExists) {
        return res.status(404).json({ message: 'Event not found' });
      }
    }

    // Validate assigned employees
    if (assignedTo && assignedTo.length > 0) {
      for (const empId of assignedTo) {
        if (!mongoose.Types.ObjectId.isValid(empId)) {
          return res.status(400).json({ message: `Invalid employee ID: ${empId}` });
        }
        const employee = await Employee.findById(empId);
        if (!employee) {
          return res.status(404).json({ message: `Employee not found: ${empId}` });
        }
      }
    }

    const newTask = new tasks({
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'Pending',
      event: event && event !== 'Unassigned' ? event : null,
      assignedTo: assignedTo || []
    });
    
    await newTask.save();
    
    const populatedTask = await tasks.findById(newTask._id)
      .populate('event')
      .populate('assignedTo');
    
    res.status(201).json({ 
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/tasks/update/:id', async (req, res) => {
  try {
    const updatedTask = await tasks.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate('event').populate('assignedTo');
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ 
      message: 'Task updated successfully', 
      task: updatedTask 
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.delete('/tasks/delete/:id', async (req, res) => {
  try {
    const deletedTask = await tasks.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/tasks/:id/update-status', async (req, res) => {
  try {
    const currentEmployee = await getCurrentEmployee(req);
    if (!currentEmployee) {
      return res.status(401).json({ message: 'Employee not authenticated' });
    }

    const { status } = req.body;
    const taskId = req.params.id;

    // Find the task and verify the employee is assigned to it
    const task = await tasks.findOne({
      _id: taskId,
      assignedTo: currentEmployee._id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not assigned to you' });
    }

    // Update only the status field
    task.status = status;
    await task.save();

    const updatedTask = await tasks.findById(taskId)
      .populate('event')
      .populate('assignedTo');

    res.status(200).json({ 
      message: 'Task status updated successfully', 
      task: updatedTask 
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

const getCurrentEmployee = async (req) => {
  // For demo purposes, we'll use a query parameter or header
  // In a real app, this would be from JWT token or session
  const employeeId = req.headers['employee-id'] || req.query.employeeId;
  if (!employeeId) return null;
  
  try {
    return await Employee.findById(employeeId);
  } catch (error) {
    return null;
  }
};

app.get('/tasks/my-tasks', async (req, res) => {
  try {
    const currentEmployee = await getCurrentEmployee(req);
    if (!currentEmployee) {
      return res.status(401).json({ message: 'Employee not authenticated' });
    }

    const myTasks = await tasks.find({ 
      assignedTo: currentEmployee._id 
    }).populate('event').populate('assignedTo');

    res.status(200).json(myTasks);
  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Assign employee to task
app.post('/tasks/:taskId/assign-employee/:employeeId', async (req, res) => {
  try {
    const { taskId, employeeId } = req.params;
    
    const task = await tasks.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Add employee to task if not already assigned
    if (!task.assignedTo.includes(employeeId)) {
      task.assignedTo.push(employeeId);
      await task.save();
    }
    
    const populatedTask = await tasks.findById(taskId)
      .populate('event')
      .populate('assignedTo');
    
    res.status(200).json({ 
      message: 'Employee assigned to task successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Error assigning employee to task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Remove employee from task
app.delete('/tasks/:taskId/remove-employee/:employeeId', async (req, res) => {
  try {
    const { taskId, employeeId } = req.params;
    
    const task = await tasks.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Remove employee from task
    task.assignedTo = task.assignedTo.filter(id => id.toString() !== employeeId);
    await task.save();
    
    const populatedTask = await tasks.findById(taskId)
      .populate('event')
      .populate('assignedTo');
    
    res.status(200).json({ 
      message: 'Employee removed from task successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Error removing employee from task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get employees with their task assignments
app.get('/employees/with-tasks', async (req, res) => {
  try {
    const employees = await Employee.find();
    const allTasks = await tasks.find().populate('event').populate('assignedTo');
    
    const employeesWithTasks = employees.map(employee => {
      const employeeTasks = allTasks.filter(task => 
        task.assignedTo?.some(assigned => assigned._id.toString() === employee._id.toString())
      );
      
      return {
        ...employee.toObject(),
        tasks: employeeTasks,
        assignedTaskCount: employeeTasks.length
      };
    });
    
    res.status(200).json(employeesWithTasks);
  } catch (error) {
    console.error("Error fetching employees with tasks:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get('/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Dashboard stats
app.get('/dashboard/stats', async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalTasks = await tasks.countDocuments();
    
    // Count employees with at least one task
    const tasksWithAssignments = await tasks.find({ assignedTo: { $exists: true, $ne: [] } });
    const assignedEmployeeIds = new Set();
    tasksWithAssignments.forEach(task => {
      task.assignedTo.forEach(empId => assignedEmployeeIds.add(empId.toString()));
    });
    const assignedEmployees = assignedEmployeeIds.size;
    
    res.status(200).json({
      totalEmployees,
      totalEvents,
      totalTasks,
      assignedEmployees,
      unassignedEmployees: totalEmployees - assignedEmployees
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'events'
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employees'
  }]
}, { timestamps: true });

export default mongoose.model('task_assigneds', taskSchema);

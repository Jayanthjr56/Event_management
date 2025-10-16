import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,  
    lowercase: true,
  },
  department: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  employeeType: {
    type: String,
    default: 'employee',
  }
}, { timestamps: true });

export default mongoose.model('employees', employeeSchema);

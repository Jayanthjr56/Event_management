import mongoose from 'mongoose';


async function connectDB() {
    try {
        await mongoose.connect("mongodb+srv://jayanthjr56_db_user:Jayanth%40121830@webknot-backend.u409c1m.mongodb.net/Event-management-system");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

export { connectDB };
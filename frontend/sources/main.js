import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Events from "./events.js";
import AttendeeTable from "./assignee.js";
import Tasks from "./task.js";

function App() {
  const [currentSection, setCurrentSection] = useState("events");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-gray-100 p-4 space-y-4 text-lg">
        <nav className="space-y-4">
          <div>
            <button
              onClick={() => setCurrentSection("events")}
              className={`w-full text-left ${
                currentSection === "events" ? "font-bold text-blue-600" : ""
              }`}
            >
               Events
            </button>
          </div>
          <div>
            <button
              onClick={() => setCurrentSection("attendees")}
              className={`w-full text-left ${
                currentSection === "attendees" ? "font-bold text-blue-600" : ""
              }`}
            >
               Attendees
            </button>
          </div>
          <div>
            <button
              onClick={() => setCurrentSection("tasks")}
              className={`w-full text-left ${
                currentSection === "tasks" ? "font-bold text-blue-600" : ""
              }`}
            >
              Tasks
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 bg-white p-4 sm:p-6">
        {currentSection === "events" && <Events />}
        {currentSection === "attendees" && (
          <section id="attendees">
            <h2 className="text-2xl font-bold mb-4">Attendees</h2>
            <AttendeeTable />
          </section>
        )}
        {currentSection === "tasks" && (
          <section id="tasks" className="text-gray-500">
            <h2 className="text-2xl font-bold mb-4">Tasks</h2>
            <Tasks />
          </section>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementsByClassName("root")[0]).render(<App />);

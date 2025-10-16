import React, { useEffect, useState } from "react";
import EventCard from "./eventcard.js";

export default function Events() {
  const [allEvents, setAllEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    date: "",
    startTime: "",
    endTime: "",
    maxAttendees: ""
  });

  const eventsPerPage = 6;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/events");
      const data = await res.json();
      if (Array.isArray(data.events)) {
        setAllEvents(data.events);
      } else {
        console.error("Expected 'events' array in response", data);
        setAllEvents([]);
      }
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/events/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event");

      const data = await res.json();
      const event = data.event;

      setFormData({
        name: event.name,
        description: event.description,
        location: event.location,
        date: event.date.split("T")[0],
        startTime: event.startTime,
        endTime: event.endTime,
        maxAttendees: event.maxAttendees
      });
      setEditingEventId(id);
      setShowModal(true);
    } catch (err) {
      console.log("Error fetching event for editing:", err);
    }
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setLoading(true);

    const method = editingEventId ? "PUT" : "POST";
    const url = editingEventId
      ? `http://localhost:3000/events/${editingEventId}`
      : "http://localhost:3000/events";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedEvent = await res.json();

        setAllEvents((prevEvents) => {
          if (editingEventId) {
            return prevEvents.map((event) =>
              event._id === editingEventId ? updatedEvent : event
            );
          } else {
            const newEvents = [...prevEvents, updatedEvent];
            setCurrentPage(Math.ceil(newEvents.length / eventsPerPage));
            return newEvents;
          }
        });

        setShowModal(false);
        setFormData({
          name: "",
          description: "",
          location: "",
          date: "",
          startTime: "",
          endTime: "",
          maxAttendees: ""
        });
        setEditingEventId(null);
      } else {
        console.error("Failed to submit event");
        alert("Failed to save event. Please try again.");
      }
    } catch (error) {
      console.log("Error:", error);
      alert("An error occurred while saving the event.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
      const res = await fetch(`http://localhost:3000/events/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete event");
      }

      setAllEvents((prevEvents) => prevEvents.filter((event) => event._id !== id));

      const newTotalPages = Math.ceil((allEvents.length - 1) / eventsPerPage);
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages || 1);
      }
      
      alert("Event deleted successfully!");
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event. Please try again.");
    }
  };

  // Pagination
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = allEvents.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allEvents.length / eventsPerPage) || 1;

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      date: "",
      startTime: "",
      endTime: "",
      maxAttendees: ""
    });
    setEditingEventId(null);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Events Management</h1>
                <p className="text-gray-600 mt-1">Create and manage your events</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <span>+</span>
                <span>Add New Event</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{allEvents.length}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {allEvents.filter(event => new Date(event.date) >= new Date()).length}
                </div>
                <div className="text-sm text-gray-600">Upcoming Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {allEvents.filter(event => new Date(event.date) < new Date()).length}
                </div>
                <div className="text-sm text-gray-600">Past Events</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && allEvents.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading events...</div>
          </div>
        ) : (
          <>
            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentEvents.map((event) => (
                <EventCard
                  key={event._id ?? event.id}
                  id={event._id}
                  icon="🏙️"
                  name={event.name}
                  location={event.location}
                  date={new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  time={`${event.startTime} - ${event.endTime}`}
                  description={event.description}
                  maxAttendees={event.maxAttendees}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteEvent}
                />
              ))}
            </div>

            {/* Empty State */}
            {allEvents.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="text-gray-500 text-lg mb-2">No events found</div>
                <div className="text-gray-400 mb-4">Get started by creating your first event</div>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  + Create First Event
                </button>
              </div>
            )}

            {/* Pagination */}
            {allEvents.length > 0 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <span>←</span>
                  <span>Previous</span>
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingEventId ? "Edit Event" : "Create New Event"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {editingEventId ? "Update the event details" : "Fill in the details for your new event"}
                </p>
              </div>
              
              <form onSubmit={handleSubmitEvent} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter event name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Enter event location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    placeholder="Describe your event..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Attendees *
                  </label>
                  <input
                    type="number"
                    name="maxAttendees"
                    placeholder="Enter maximum number of attendees"
                    value={formData.maxAttendees}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </form>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmitEvent}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingEventId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingEventId ? "Update Event" : "Create Event"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
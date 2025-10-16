export default function EventCard({ icon, name, location, date, description, id, onEdit, onDelete }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-lg transition bg-white">
      <div className="text-3xl">{icon}</div>
      <div className="font-bold text-xl mt-2">{name}</div>
      <div className="text-sm text-gray-500">📍 {location}</div>
      <div className="text-sm text-gray-500">📅 {date}</div>
      <p className="mt-2 text-gray-700">{description}</p>
      <div className="mt-4 space-x-2">
        <button
            onClick={() => onEdit(id)}
            className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded transition-colors bg-blue-50 hover:bg-blue-100 border border-blue-200"
            title="Manage task assignments"
          >
            📝 Edit Task
          </button>
        <button
              onClick={() => onDelete(id) }
              className="text-red-600 hover:text-red-900 px-3 py-1 rounded transition-colors bg-red-50 hover:bg-red-100 border border-red-200"
              title="Remove from all tasks"
            >
              🗑️ Delete Task
            </button>
      </div>
    </div>
  );
}

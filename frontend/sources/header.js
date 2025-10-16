import React from "react";
import ReactDOM from "react-dom/client";


function App() {
  const [isMobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="text-xl sm:text-2xl font-bold text-gray-800">
            Event Management System
          </div>
        </div>
      </div>
    </div>

          
  );
}

ReactDOM.createRoot(document.querySelector("header")).render(<App />);
"use client";

import { useState } from "react";
import { useServices } from "@/context/ServicesContext";

export default function ManageServices() {
  const { services, addService, removeService } = useServices();
  const [newService, setNewService] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    if (services.includes(trimmed)) {
      setError("This service already exists.");
      return;
    }
    addService(trimmed);
    setNewService("");
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Services</h1>
        <p className="text-gray-500 mt-1">
          Add or remove services. They will appear in the newsletter generation selector.
        </p>
      </div>

      {/* Add new service */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add New Service</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newService}
            onChange={(e) => { setNewService(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Botox Treatment"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={handleAdd}
            disabled={!newService.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* Services list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Current Services
          <span className="ml-2 text-xs font-normal text-gray-400">({services.length})</span>
        </h2>
        <div className="flex flex-col gap-2">
          {services.map((service) => (
            <div
              key={service}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-sm text-gray-800">{service}</span>
              </div>
              <button
                onClick={() => removeService(service)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Remove service"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

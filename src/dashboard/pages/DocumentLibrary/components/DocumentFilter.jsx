import { useState, useRef, useEffect, act } from "react";
import PropTypes from "prop-types";

const DocumentFilters = ({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  dateRange,
  setDateRange,
  documentTypes = [],
  documentStatuses = [],
  activeTab
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ from: "", to: "" });
  const [selectingFrom, setSelectingFrom] = useState(true);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatDateToYMD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (dateString) => {
    if (selectingFrom || !tempDateRange.from) {
      setTempDateRange({ from: dateString, to: "" });
      setSelectingFrom(false);
    } else {
      if (new Date(dateString) < new Date(tempDateRange.from)) {
        setTempDateRange({ from: dateString, to: tempDateRange.from });
      } else {
        setTempDateRange({ ...tempDateRange, to: dateString });
      }
      setSelectingFrom(true);
    }
  };

  const applyDateRange = () => {
    setDateRange(tempDateRange);
    setShowCalendar(false);
  };

  const clearDateRange = () => {
    setDateRange({ from: "", to: "" });
    setTempDateRange({ from: "", to: "" });
    setSelectingFrom(true);
    setShowCalendar(false);
  };

  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from + "T00:00:00");
      const toDate = new Date(dateRange.to + "T00:00:00");
      const fromFormatted = fromDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const toFormatted = toDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${fromFormatted} - ${toFormatted}`;
    } else if (dateRange.from) {
      const fromDate = new Date(dateRange.from + "T00:00:00");
      return `From ${fromDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    } else if (dateRange.to) {
      const toDate = new Date(dateRange.to + "T00:00:00");
      return `Until ${toDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
    return "Select date range";
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        date: date,
        dateString: formatDateToYMD(date),
        day: day,
      });
    }

    return days;
  };

  const isDateInRange = (dateString) => {
    if (!tempDateRange.from || !dateString) return false;
    if (!tempDateRange.to) return dateString === tempDateRange.from;

    return dateString >= tempDateRange.from && dateString <= tempDateRange.to;
  };

  const isDateSelected = (dateString) => {
    if (!dateString) return false;
    return dateString === tempDateRange.from || dateString === tempDateRange.to;
  };

  const isToday = (dateString) => {
    const today = new Date();
    return dateString === formatDateToYMD(today);
  };

  useEffect(() => {
    if (showCalendar) {
      setTempDateRange(dateRange);
    }
  }, [showCalendar, dateRange]);

  const CalendarModal = () => (
    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[100]">
      <div className="p-3">
        {/* Calendar Header  */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            {selectingFrom ? "Start date" : "End date"}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-400 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {generateCalendarDays().map((dayData, index) => (
            <button
              key={index}
              type="button"
              onClick={() => dayData && handleDateClick(dayData.dateString)}
              disabled={!dayData}
              className={`
                h-6 w-6 text-xs rounded flex items-center justify-center transition-colors
                ${!dayData ? "invisible" : ""}
                ${
                  dayData && isDateSelected(dayData.dateString)
                    ? "bg-blue-600 text-white font-medium shadow-sm"
                    : dayData && isDateInRange(dayData.dateString)
                    ? "bg-blue-100 text-blue-800 font-medium"
                    : dayData && isToday(dayData.dateString)
                    ? "bg-gray-100 text-blue-600 font-medium border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              {dayData ? dayData.day : ""}
            </button>
          ))}
        </div>

        {/* Calendar Footer  */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={clearDateRange}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear
          </button>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyDateRange}
              className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 relative z-10">
      <div className="p-3 sm:p-4">
        {/* Mobile */}
        <div className="flex flex-col space-y-3 sm:hidden">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
              placeholder="Search..."
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type and Status filters  */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            
            <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
          >
            {documentStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() +
                  status.slice(1).replace("-", " ")}
              </option>
            ))}
          </select>
            
            
          </div>

          {/* Date Range Picker */}
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors"
            >
              <span
                className={
                  dateRange.from || dateRange.to
                    ? "text-gray-900"
                    : "text-gray-500"
                }
              >
                {formatDateRange()}
              </span>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* Calendar Modal */}
            {showCalendar && <CalendarModal />}
          </div>
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          {/* Search */}
          <div className="w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
                placeholder="Search..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="w-48">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          {activeTab === "all" && (
            <div className="w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
              >
                {documentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Picker */}
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center justify-between w-64 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors"
            >
              <span
                className={
                  dateRange.from || dateRange.to
                    ? "text-gray-900"
                    : "text-gray-500"
                }
              >
                {formatDateRange()}
              </span>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* Calendar Modal */}
            {showCalendar && <CalendarModal />}
          </div>
        </div>
      </div>
    </div>
  );
};

DocumentFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  selectedType: PropTypes.string.isRequired,
  setSelectedType: PropTypes.func.isRequired,
  selectedStatus: PropTypes.string.isRequired,
  setSelectedStatus: PropTypes.func.isRequired,
  dateRange: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string,
  }),
  setDateRange: PropTypes.func.isRequired,
  documentTypes: PropTypes.arrayOf(PropTypes.string),
  documentStatuses: PropTypes.arrayOf(PropTypes.string),
};

export default DocumentFilters;

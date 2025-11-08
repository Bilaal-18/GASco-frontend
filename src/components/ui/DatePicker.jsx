import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

const CustomDatePicker = ({
  selected,
  onChange,
  minDate,
  maxDate,
  placeholderText = "Select date",
  showTimeSelect = false,
  showMonthYearPicker = false,
  showYearPicker = false,
  dateFormat = "MMMM d, yyyy",
  className = "",
  required = false,
  label = "",
  ...props
}) => {
  // Convert selected to Date object if it's a string or already a Date
  const selectedDate = selected 
    ? (selected instanceof Date ? selected : new Date(selected))
    : null;

  // Convert minDate and maxDate to Date objects if they're strings
  const minDateObj = minDate 
    ? (minDate instanceof Date ? minDate : new Date(minDate))
    : undefined;
  const maxDateObj = maxDate 
    ? (maxDate instanceof Date ? maxDate : new Date(maxDate))
    : undefined;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          {label}
        </label>
      )}
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={onChange}
          minDate={minDateObj}
          maxDate={maxDateObj}
          placeholderText={placeholderText}
          showTimeSelect={showTimeSelect}
          showMonthYearPicker={showMonthYearPicker}
          showYearPicker={showYearPicker}
          dateFormat={showMonthYearPicker ? "MMMM yyyy" : showYearPicker ? "yyyy" : dateFormat}
          required={required}
          className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          wrapperClassName="w-full"
          calendarClassName="shadow-lg border border-gray-200 rounded-lg"
          popperClassName="z-50"
          {...props}
        />
      </div>
    </div>
  );
};

export default CustomDatePicker;

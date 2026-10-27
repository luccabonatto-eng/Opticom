import { useState } from 'react';

const FormField = ({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  validator = null,
  onBlur = null,
}) => {
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState(error || '');

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (touched && validator) {
      const result = validator(newValue);
      setFieldError(result.error);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (validator) {
      const result = validator(value);
      setFieldError(result.error);
    }
    if (onBlur) onBlur();
  };

  const showError = touched && fieldError;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
          showError
            ? 'border-red-300 focus:ring-red-500 bg-red-50'
            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {showError && <p className="text-red-500 text-xs mt-1">{fieldError}</p>}
    </div>
  );
};

export { FormField };

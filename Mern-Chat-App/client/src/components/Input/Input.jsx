import React from "react";

const Input = ({
  label = "",
  name = "",
  type = "",
  className = "",
  inputClassName = "",
  placeholder = "",
  value = "",
  onChange = "",
  isRequired = true,
}) => {
  return (
    <>
      <div className={` ${className}`}>
        <label
          htmlFor={name}
          className="block-mb-2 text-sm font-medium text-gray-500"
        >
          {label}
        </label>
        <input
          className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${inputClassName}`}
          placeholder={placeholder}
          required={isRequired}
          type={type}
          id={name}
          value={value}
          onChange={onChange}
        />
      </div>
    </>
  );
};
export default Input;

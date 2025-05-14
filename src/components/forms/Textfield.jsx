import React from "react";

const Textfield = ({
    label, 
    type = "text", 
    name, 
    value, 
    onChange, 
    error,
    maxLength,
    placeholder,
    required = false,
    pattern,
    onBlur,
})=> {
    return(
        <div className="mb-4">
            <label htmlFor={name} className="block text-gray-700 font-medium mb-2">
                {label}{required && <span className="text-red-500">*</span>}
            </label>
            <input 
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                maxLength={maxLength}
                placeholder={placeholder}
                required={required}
                className={`w-full px-3 py-2 border ${
                    error ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {error && (
                <div className="mt-1 text-sm text-red-500 bg-red-50 p-2 rounded-md">
                    {error}
                </div>
            )}
        </div>
    )
}

export default Textfield;
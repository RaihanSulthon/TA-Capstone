import React from "react";

const Textfield = ({
    label, 
    type = "text", 
    name, 
    value, 
    onChange, 
    error})=> 
    
    {
    return(
        <div className="mb-4">
            <label htmlFor={name} className="block text-gray-700 font-medium mb-2">
                {label}
            </label>
            <input 
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full px-3 py-2 border ${
                    error ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {
            error && 
            <p className="text-red-500 text-sm mt-1">{error}</p>
            }
        </div>
    )
}

export default Textfield;
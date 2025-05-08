import React, {useEffect} from "react";

const Toast = ({message, type ="error", onClose, duration = 5000}) => {
    useEffect(() => {
        if(message){
            const timer = setTimeout(() => {
                if(onClose) onClose();
            }, duration);

            return() => clearTimeout(timer);
        }
    }, [message, onClose, duration]);

    if(!message) return null;

    const bgColor =
    type === "success" ? "bg-green-100 border-green-500 text-green-700":
    type === "warning" ? "bg-yellow-100 border-yellow-500 text-yellow-700" :
    "bg-red-100 border-red-500 text-red-700";

    return(
        <div className={`fixed top-4 right-4 z-50 p-3 rounded-md shadow-md border-1-4 %{bgColor} max-w-md`}>
            <div className="flex justify-between">
                <div className="flex">
                    {type === "success" && (
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                            clipRule="evenodd"
                            />
                        </svg>
                    )}
                    {type === "error" && (
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" 
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                            clipRule="evenodd"
                            />
                        </svg>
                    )}
                    {type === "warning" && (
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" 
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                            clipRule="evenodd" />
                        </svg>
                    )}
                    <span>{message}</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 ml-2">
                    {type === "warning" && (
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" 
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                            clipRule="evenodd"
                            />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Toast
import { useState, useRef, useCallback } from 'react';
import { processAttachment, formatFileSize } from '../services/feedbackService';

const FileUpload = ({ 
  onFilesChange, 
  maxFiles = 3, 
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  disabled = false,
  className = ""
}) => {
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled]);

  // Handle file input change
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  // Process selected files
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    setError("");
    setUploading(true);

    try {
      // Check if adding these files would exceed max limit
      if (attachments.length + files.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        setUploading(false);
        return;
      }

      const processedFiles = [];
      
      for (const file of files) {
        // Validate file
        if (!allowedTypes.includes(file.type)) {
          setError(`File type ${file.type} is not supported`);
          continue;
        }
        
        if (file.size > maxSize) {
          setError(`File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`);
          continue;
        }

        // Process the file
        const result = await processAttachment(file);
        if (result.success) {
          processedFiles.push(result.data);
        } else {
          setError(result.error);
        }
      }

      if (processedFiles.length > 0) {
        const newAttachments = [...attachments, ...processedFiles];
        setAttachments(newAttachments);
        onFilesChange(newAttachments);
      }
    } catch (error) {
      console.error("Error processing files:", error);
      setError("Failed to process files");
    } finally {
      setUploading(false);
    }
  };

  // Remove attachment
  const removeAttachment = (attachmentId) => {
    const newAttachments = attachments.filter(att => att.id !== attachmentId);
    setAttachments(newAttachments);
    onFilesChange(newAttachments);
  };

  // Clear all attachments
  const clearAll = () => {
    setAttachments([]);
    onFilesChange([]);
    setError("");
  };

  // Get file type icon
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (type === 'application/pdf') {
      return (
        <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (type.includes('word') || type.includes('document')) {
      return (
        <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    } else if (type.includes('excel') || type.includes('spreadsheet')) {
      return (
        <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  // Preview component for images
  const ImagePreview = ({ attachment }) => (
    <div className="relative">
      <img 
        src={attachment.base64} 
        alt={attachment.name}
        className="w-full h-32 object-cover rounded-md"
      />
      <button
        onClick={() => removeAttachment(attachment.id)}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  // File item component
  const FileItem = ({ attachment }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md border">
      {getFileIcon(attachment.type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {attachment.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <button
        onClick={() => removeAttachment(attachment.id)}
        className="text-red-500 hover:text-red-700 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm text-gray-600">Processing files...</p>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports: Images, PDF, Word, Excel, Text files
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-900">
              Attached Files ({attachments.length}/{maxFiles})
            </h4>
            <button
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          {/* Images Grid */}
          {attachments.filter(att => att.type.startsWith('image/')).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Images</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {attachments
                  .filter(att => att.type.startsWith('image/'))
                  .map(attachment => (
                    <ImagePreview key={attachment.id} attachment={attachment} />
                  ))
                }
              </div>
            </div>
          )}
          
          {/* Other Files List */}
          {attachments.filter(att => !att.type.startsWith('image/')).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Documents</p>
              <div className="space-y-2">
                {attachments
                  .filter(att => !att.type.startsWith('image/'))
                  .map(attachment => (
                    <FileItem key={attachment.id} attachment={attachment} />
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
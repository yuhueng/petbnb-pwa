/**
 * File validation utilities for message attachments
 */

// Maximum file size: 10 MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

// Allowed file types
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain', // .txt
];

export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// File type labels for user-friendly messages
export const FILE_TYPE_LABELS = {
  'image/png': 'PNG Image',
  'image/jpeg': 'JPEG Image',
  'image/jpg': 'JPG Image',
  'image/gif': 'GIF Image',
  'image/webp': 'WEBP Image',
  'application/pdf': 'PDF Document',
  'application/msword': 'Word Document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
  'text/plain': 'Text File',
};

/**
 * Check if a file type is an image
 * @param {string} fileType - MIME type of the file
 * @returns {boolean}
 */
export const isImageFile = (fileType) => {
  return ALLOWED_IMAGE_TYPES.includes(fileType);
};

/**
 * Check if a file type is a document
 * @param {string} fileType - MIME type of the file
 * @returns {boolean}
 */
export const isDocumentFile = (fileType) => {
  return ALLOWED_DOCUMENT_TYPES.includes(fileType);
};

/**
 * Validate file size
 * @param {number} fileSize - Size of file in bytes
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateFileSize = (fileSize) => {
  if (fileSize > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
    };
  }
  return { isValid: true, error: null };
};

/**
 * Validate file type
 * @param {string} fileType - MIME type of the file
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateFileType = (fileType) => {
  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return {
      isValid: false,
      error: 'File type not supported. Please upload an image or document (PDF, DOC, TXT).',
    };
  }
  return { isValid: true, error: null };
};

/**
 * Validate a file before upload
 * @param {File} file - File object to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  // Check file size
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Check file type
  const typeValidation = validateFileType(file.type);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  return { isValid: true, error: null };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string} File extension (e.g., "pdf")
 */
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Generate a safe filename for storage
 * @param {string} originalFilename
 * @returns {string} Safe filename with timestamp
 */
export const generateSafeFilename = (originalFilename) => {
  const timestamp = Date.now();
  const extension = getFileExtension(originalFilename);
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');

  // Remove special characters and spaces
  const safeName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50); // Limit length

  return `${timestamp}_${safeName}.${extension}`;
};

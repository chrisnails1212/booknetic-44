// Utility functions for file handling and conversion

export interface SerializableFile {
  name: string;
  type: string;
  size: number;
  data: string; // base64 data
  uploadDate: string;
}

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix to get just the base64 data
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
};

export const convertFileObjectToSerializable = async (fileObj: any): Promise<SerializableFile | null> => {
  if (!fileObj || !fileObj.file || !(fileObj.file instanceof File)) {
    return null;
  }

  try {
    const base64Data = await convertFileToBase64(fileObj.file);
    return {
      name: fileObj.name || fileObj.file.name,
      type: fileObj.type || fileObj.file.type,
      size: fileObj.size || fileObj.file.size,
      data: base64Data,
      uploadDate: fileObj.uploadDate || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error converting file to serializable format:', error);
    return null;
  }
};

export const convertCustomFieldsForSaving = async (customFieldValues: Record<string, any>): Promise<Record<string, any>> => {
  const convertedFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(customFieldValues)) {
    if (value && typeof value === 'object' && value.file && value.file instanceof File) {
      // This is a file object that needs conversion
      const serializable = await convertFileObjectToSerializable(value);
      convertedFields[key] = serializable;
    } else {
      // Keep non-file values as is
      convertedFields[key] = value;
    }
  }

  return convertedFields;
};

export const createBlobFromBase64 = (base64Data: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

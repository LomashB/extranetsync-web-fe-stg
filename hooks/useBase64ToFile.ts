// Helper function to convert base64 to File object
export const base64ToFile = (base64String: string, fileName: string): File => {
    // Split the base64 string to get actual base64 data
    const [header, data] = base64String.split(',');
    
    // Get file type from header or default to jpeg
    const fileType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    
    // Convert base64 to blob
    const byteCharacters = atob(data);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    const blob = new Blob(byteArrays, { type: fileType });
    return new File([blob], fileName, { type: fileType });
  };
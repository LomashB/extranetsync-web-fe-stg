import axios from "axios";

export async function getBase64FromImageUrl(imageUrl : string) {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return `data:${response.headers['content-type']};base64,${base64}`;
    } catch (error) {
      console.error('Error fetching or converting image:', error);
    }
  }
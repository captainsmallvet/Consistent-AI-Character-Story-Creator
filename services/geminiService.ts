
import { GoogleGenAI } from "@google/genai";
import { Character } from '../types';

/**
 * ฟังก์ชันช่วยในการดึง API Key ล่าสุด
 */
const getApiKey = () => {
  return (window as any).process?.env?.API_KEY || "";
};

/**
 * ฟังก์ชันสำหรับประมวลผลข้อความ (Text Reasoning Tasks)
 */
export const processTextTask = async (
  text: string, 
  task: 'idea' | 'polish' | 'translate' | 'caption', 
  model: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("ไม่พบ API Key กรุณากรอก API Key ที่ส่วนบนสุดของแอป");

  const ai = new GoogleGenAI({ apiKey });
  
  let systemInstruction = "";
  let prompt = "";

  switch(task) {
    case 'idea':
      systemInstruction = "คุณคือผู้ช่วยนักเขียนบทมืออาชีพ หน้าที่ของคุณคือการคิดไอเดียฉากใหม่ๆ";
      prompt = `ช่วยคิดไอเดียฉาก 3 ฉากที่น่าสนใจ โดยใช้บริบทเดิมคือ: "${text}" โดยแต่ละฉากให้แยกบรรทัดกัน และเน้นความต่อเนื่องของตัวละคร`;
      break;
    case 'polish':
      systemInstruction = "คุณคือผู้เชี่ยวชาญด้านการเขียน prompt สำหรับ AI Image Generator";
      prompt = `ช่วยขัดเกลาและขยายความ (Polish) คำสั่งต่อไปนี้ให้มีความละเอียด สวยงาม และได้ผลลัพธ์คุณภาพสูง: "${text}"`;
      break;
    case 'translate':
      systemInstruction = "คุณคือวิศวกรภาษา (Prompt Engineer) ที่เชี่ยวชาญการแปลคำสั่งเป็นภาษาอังกฤษสำหรับ AI สร้างภาพ";
      prompt = `แปลข้อความต่อไปนี้เป็นภาษาอังกฤษที่เหมาะสมที่สุดสำหรับ AI Image Generator: "${text}"`;
      break;
    case 'caption':
      systemInstruction = "คุณคือผู้เชี่ยวชาญด้านการเล่าเรื่องและเขียนแคปชั่นโซเชียลมีเดีย";
      prompt = `เขียนแคปชั่นสั้นๆ ที่น่าประทับใจสำหรับภาพที่มีคำบรรยายดังนี้: "${text}"`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { 
        systemInstruction,
        temperature: 0.8,
      }
    });
    return response.text || "";
  } catch (error) {
    console.error(`Text task (${task}) failed:`, error);
    throw error;
  }
};

export const generateStoryImage = async (
    prompt: string, 
    characters: Character[], 
    aspectRatio: string, 
    imageStyle: string,
    model: string = 'gemini-2.5-flash-image'
): Promise<string> => {
    
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const characterNames = characters.map(c => c.name).join(' and ');
    
    let styleDirective = '';
    if (imageStyle === 'Match Reference') {
      styleDirective = 'The overall artistic style (e.g., cartoon, anime, realistic) must perfectly match the reference images provided.';
    } else if (imageStyle === 'Black & White (Laser Printer)') {
      styleDirective = 'The artistic style must be a high-contrast, clean black and white line art, specifically optimized for printing on a monochrome laser printer. Use solid blacks and whites and avoid shades of gray. Maintain character identity but convert them into this line-art style.';
    } else {
      styleDirective = `The overall artistic style must be **${imageStyle}**. **CRITICAL INSTRUCTION:** You must translate the character's appearance from the reference images into this **${imageStyle}** style. Do not simply copy the art style of the reference images if it differs from ${imageStyle}. Keep the facial features and identity recognizable, but rendered in ${imageStyle}.`;
    }

    const fullPrompt = `
**Objective:** Create a high-resolution 4K image based on the description and references below.

**1. TARGET ARTISTIC STYLE (HIGHEST PRIORITY):**
${styleDirective}

**2. SCENE DESCRIPTION:**
${prompt}

**3. CHARACTERS:**
*   **Characters Involved:** ${characterNames}
*   **Identity & Consistency:** Use the provided reference images to strictly maintain the facial features, identity, hairstyle, and outfit of the characters.
*   **Style Adaptation:** **Apply the Target Artistic Style defined in Section 1 to these characters.** For example, if the style is 'Pixel Art', the characters must be rendered as Pixel Art, even if the reference image is a photograph.

**4. BACKGROUND:**
*   Ensure the background matches the scene description and the Target Artistic Style seamlessly.

**5. TECHNICAL:**
*   **Aspect Ratio:** ${aspectRatio}

**Final Check:** Ensure the result looks like a cohesive piece of art in the requested **${imageStyle}** style, featuring the specific characters described.
`.trim();

    try {
        if (model.includes('imagen')) {
            const imagenPrompt = `
            Scene: ${prompt}. 
            Characters: ${characterNames}.
            Style: ${imageStyle === 'Match Reference' ? 'High quality, detailed' : imageStyle}.
            Aspect Ratio: ${aspectRatio}.
            `.trim();

            const response = await ai.models.generateImages({
                model,
                prompt: imagenPrompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: aspectRatio as any,
                    outputMimeType: 'image/jpeg',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                 const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                 return `data:image/jpeg;base64,${base64ImageBytes}`;
            } else {
                throw new Error("ไม่ได้รับข้อมูลรูปภาพจาก Imagen API");
            }

        } else {
            const parts: any[] = [{ text: fullPrompt }];

            for (const character of characters) {
                if (character.referenceFrames.length > 0) {
                    for (const frame of character.referenceFrames) {
                        parts.push({
                            inlineData: {
                                data: frame.data,
                                mimeType: frame.mimeType,
                            },
                        });
                    }
                }
            }

            const response = await ai.models.generateContent({
                model,
                contents: { parts },
                config: {
                    imageConfig: {
                        aspectRatio: aspectRatio as any,
                        ...(model === 'gemini-3-pro-image-preview' ? { imageSize: '1K' } : {})
                    },
                },
            });
            
            const candidate = response.candidates?.[0];
            const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

            if (imagePart && imagePart.inlineData) {
                const base64ImageBytes = imagePart.inlineData.data;
                return `data:${imagePart.inlineData.mimeType};base64,${base64ImageBytes}`;
            } else {
                if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                     throw new Error(`การสร้างภาพหยุดลงด้วยสาเหตุ: ${candidate.finishReason}`);
                }
                throw new Error("ไม่พบข้อมูลรูปภาพในการตอบกลับจาก API");
            }
        }

    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("เกิดข้อผิดพลาดในการเรียกใช้ Gemini API");
    }
};

export const expandImage = async (imageDataUrl: string, newAspectRatio: string, originalPrompt: string): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-image';

    const [header, base64Data] = imageDataUrl.split(',');
    if (!header || !base64Data) {
        throw new Error("รูปแบบข้อมูลรูปภาพไม่ถูกต้อง");
    }
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

    const fullPrompt = `
**Objective:** You are an expert image editor AI. Your task is to expand the given image to a new aspect ratio of **${newAspectRatio}**.
1. Seamless Expansion: Fill new areas while continuing existing style.
2. Preserve Original: Do not alter original pixels.
3. Aspect Ratio: Strict ${newAspectRatio}.
`.trim();

    const parts = [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: fullPrompt },
    ];

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { imageConfig: { aspectRatio: newAspectRatio as any } },
        });
        
        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

        if (imagePart && imagePart.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        throw new Error("ไม่พบข้อมูลรูปภาพจากการขยายภาพ");
    } catch (error) {
        throw error;
    }
};

const getClosestAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    const supported = ["16:9", "9:16", "1:1", "4:3", "3:4"];
    let bestMatch = "1:1";
    let minDiff = Number.MAX_VALUE;
    for (const s of supported) {
        const [sw, sh] = s.split(':').map(Number);
        const sRatio = sw / sh;
        const diff = Math.abs(ratio - sRatio);
        if (diff < minDiff) { minDiff = diff; bestMatch = s; }
    }
    return bestMatch;
};

export const addFrameToImage = async (imageDataUrl: string): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-image';
    const [header, base64Data] = imageDataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

    const aspectRatio = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(getClosestAspectRatio(img.width, img.height));
        img.onerror = () => resolve('1:1'); 
        img.src = imageDataUrl;
    });

    const fullPrompt = "Draw a thin red border frame around the very outer edge of the image. Preserve inner content perfectly.";
    const parts = [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: fullPrompt },
    ];

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { imageConfig: { aspectRatio: aspectRatio as any } },
        });
        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
        if (imagePart && imagePart.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        throw new Error("ไม่พบข้อมูลรูปภาพหลังจากตีกรอบ");
    } catch (error) {
        throw error;
    }
};

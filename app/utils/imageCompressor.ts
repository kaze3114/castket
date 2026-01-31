// app/utils/imageCompressor.ts

import imageCompression from "browser-image-compression";

// アバター用などの圧縮設定
const defaultOptions = { 
  maxSizeMB: 0.5, 
  maxWidthOrHeight: 500, 
  useWebWorker: true 
};

// ギャラリー用などの圧縮設定
const galleryOptions = { 
  maxSizeMB: 1, 
  maxWidthOrHeight: 1280, 
  useWebWorker: true 
};

export const compressImage = async (file: File, type: "avatar" | "gallery" = "avatar") => {
  const options = type === "gallery" ? galleryOptions : defaultOptions;
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Compression error:", error);
    throw error;
  }
};
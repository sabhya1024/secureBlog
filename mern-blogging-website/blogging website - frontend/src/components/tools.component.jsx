import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import Paragraph from "@editorjs/paragraph";
import Header from "@editorjs/header";
import Image from "@editorjs/image";
import InlineCode from "@editorjs/inline-code";
import Raw from "@editorjs/raw";
import Checklist from "@editorjs/checklist";
import axios from "axios";

import api from "../common/api";

const UploadImageByUrl = async (e) => {
  try {
    if (!e || typeof e !== "string") {
      throw new Error("Invalid URL");
    }

    const parsed = new URL(e);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Only HTTP and HTTPS URLs are permitted");
    }

    const res = await api.post("/upload/upload-by-url", { url: parsed.href });
    return {
      success: 1,
      file: { url: res.data.secure_url },
    };
  } catch (error) {
    console.error("Proxy upload failed", error.message || error);
    return {
      success: 0,
      file: { url: "" },
    };
  }
};

const UploadImageByFile = async (e) => {
  try {
    // 1. Ask backend for the secure Cloudinary signature using configured api client
    const signatureRes = await api.get("/upload/get-upload-signature");
    const signatureData = signatureRes.data;

    const formData = new FormData();
    formData.append("file", e);
    formData.append("signature", signatureData.signature);
    formData.append("timestamp", signatureData.timestamp);
    formData.append("api_key", signatureData.api_key);
    formData.append("upload_preset", signatureData.upload_preset);

    // 2. Post the image directly to Cloudinary
    const cloudinaryRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
    );
    // success
    return {
      success: 1,
      file: { url: cloudinaryRes.data.secure_url },
    };
  } catch (error) {
    console.error("Local file upload failed:", error.message || error);
    return {
      success: 0,
      file: { url: "" },
    };
  }
};

export const tools = {
  embed: Embed,
  list: {
    class: List,
    inlineToolbar: true,
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
  },
  marker: Marker,
  paragraph: Paragraph,
  header: {
    class: Header,
    config: {
      placeholder: "Enter a heading",
      levels: [1, 2, 3, 4, 5, 6],
      defaultLevel: 3,
    },
  },
  image: {
    class: Image,
    config: {
      uploader: {
        uploadByUrl: UploadImageByUrl,
        uploadByFile: UploadImageByFile,
      },
    },
  },
  inlineCode: InlineCode,
  raw: Raw,
  checklist: Checklist,
};

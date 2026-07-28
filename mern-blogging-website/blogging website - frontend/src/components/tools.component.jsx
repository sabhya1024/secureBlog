import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import Paragraph from "@editorjs/paragraph";
import Header from "@editorjs/header"
import Image from "@editorjs/image"
import InlineCode from "@editorjs/inline-code"
import Raw from "@editorjs/raw"
import Checklist from "@editorjs/checklist"

import axios from "axios";
import { lookInSession } from "../common/session";


const UploadImageByUrl = async (e) => {
    try {
        // Grab your access token. (Adjust this based on where you save it on login!)
        // e.g., let userInSession = JSON.parse(sessionStorage.getItem("user"));
        let userInSession = lookInSession("user")
        let token = userInSession ? userInSession.accessToken : null;


        const res = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/upload/upload-by-url`,
            { url: e },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return {
            success: 1,
            file: { url: res.data.secure_url }
        };
    } catch (error) {
        console.error("Proxy upload failed", error);
        return {
            success: 0,
            file: { url: "" }
        };
    }
}

const UploadImageByFile = async (e) => {
    try {
        // 1. Get the access token from session storage
        let userInSession = lookInSession("user");
        let token = userInSession ? userInSession.accessToken : null;

        // 2. Ask your backend for the secure Cloudinary signature
        const signatureRes = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/upload/get-upload-signature`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-Content-Type-Options": "nosniff",
                },
            }
        );
        const signatureData = signatureRes.data;

        const formData = new FormData();
        formData.append("file", e);
        formData.append("signature", signatureData.signature);
        formData.append("timestamp", signatureData.timestamp);
        formData.append("api_key", signatureData.api_key);
        formData.append("upload_preset", signatureData.upload_preset);

        // 4. Post the image directly to Cloudinary
        const cloudinaryRes = await axios.post(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
            formData
        );
        // success
        return {
            success: 1,
            file: { url: cloudinaryRes.data.secure_url }
        };
    } catch (error) {
        console.error("Local file upload failed:", error);
        //editorjs failed
        return {
            success: 0,
            file: { url: "" }
        };
    }
}

export const tools = {
    embed: Embed,
    list: {
        class: List,
        inlineToolbar: true,
    },
    quote:
    {
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
        }
    },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: UploadImageByUrl,
                uploadByFile: UploadImageByFile,

            }
        }
    },
    inlineCode: InlineCode,
    raw: Raw,
    checklist: Checklist,

}
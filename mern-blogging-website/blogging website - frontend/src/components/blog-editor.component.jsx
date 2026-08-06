import { Link, useNavigate, useParams } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import { useState, useContext, useRef, useEffect } from "react";
import defaultBanner from "../imgs/blog banner.png";
import { UserContext } from "../App";
import { EditorContext } from "../pages/editor.pages";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";

const BlogEditor = () => {
  let {
    blog,
    blog: { title, banner, content, des, tags },
    setBlog,
    textEditor,
    setTextEditor,
    editorState,
    setEditorState,
  } = useContext(EditorContext);

  let navigate = useNavigate();

  useEffect(() => {
    if (!textEditor.isReady) {
      setTextEditor(
        new EditorJS({
          holder: "textEditor",
          data: Array.isArray(content) ? content[0] : content,
          tools: tools,
          placeholder: "Let's begin writing! ",
        }),
      );
    }
  }, []);

  //check if user is loggedin
  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  let { blog_id } = useParams();

  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      const validMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB Limit

      if (!validMimeTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPEG or PNG).");
        e.target.value = "";
        return;
      }

      if (file.size > maxSizeInBytes) {
        console.warn(
          `[Security Audit] File size too large: ${file.size} bytes`,
        );
        toast.error("File is too large. Max limit is 5MB.");
        return;
      }

      setIsUploading(true);
      let loadingToast = toast.loading("Uploading...");

      try {
        const formData = new FormData();
        formData.append("file", file); // Appending file for busboy

        // Send directly to our secure backend proxy
        const uploadRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/upload/image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        toast.dismiss(loadingToast);
        toast.success("Uploaded 👍");
        setBlog({
          ...blog,
          banner: uploadRes.data.secure_url,
        });
      } catch (error) {
        console.error("[Security Audit] Proxy Upload failed:", {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });

        const userFriendlyMessage =
          error.response?.status === 401
            ? "Session expired. Please log in again."
            : error.response?.data?.error ||
              "An error occurred during upload. Please try again.";

        toast.dismiss(loadingToast);
        toast.error(userFriendlyMessage);
      } finally {
        setIsUploading(false);
        e.target.value = null;
      }
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode == 13) {
      e.preventDefault();
    }
  };
  const handleTitleChange = (e) => {
    // console.log(e);
    let input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";

    setBlog({
      ...blog,
      title: input.value,
    });
  };

  const handlePublishEvent = async () => {
    if (!banner.length) {
      return toast.error("Upload a blog banner to publish your blog ");
    }
    if (!title.length) {
      return toast.error("Write a blog title to publish your blog ");
    }

    if (textEditor.isReady) {
      try {
        const data = await textEditor.save();
        if (data.blocks.length) {
          setBlog({
            ...blog,
            content: data,
          });
          setEditorState("publish");
        } else {
          toast.error("Write a blog content to publish your blog ");
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSaveDraft = async (e) => {
    if (e.target.classList.contains("disable")) return;
    let loadingToast = toast.loading("Saving Draft...");
    e.target.classList.add("disable");
    try {
      let draftContent = content;
      if (textEditor.isReady) {
        draftContent = await textEditor.save();
      }
      let blogObj = {
        title,
        banner,
        content: draftContent,
        description: des,
        tags,
        draft: true,
      };
      await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/blog/create-blog",
        { ...blogObj, id: blog_id },
        { headers: { Authorization: `Bearer ${access_token}` } },
      );
      e.target.classList.remove("disable");
      toast.dismiss(loadingToast);
      toast.success("Draft Saved");
      setTimeout(() => navigate("/"), 500);
    } catch (err) {
      e.target.classList.remove("disable");
      toast.dismiss(loadingToast);
      return toast.error(err.response?.data?.error || "Failed to save draft");
    }
  };

  return (
    <>
      <Toaster />
      <nav className="navbar">
        <Link to="/" className="flex-none flex items-center justify-center">
          <img src={logo} className="h-10 w-auto" alt="CheckHack Logo" />
        </Link>

        <p className="max-md:hidden text-black line-clamp-1 w-full ">
          {title?.length ? title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>

          <button className="btn-dark py-2 " onClick={handlePublishEvent}>
            Publish
          </button>
        </div>
      </nav>

      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            {/* Added relative and overflow-hidden for a cleaner look */}
            <div className="relative aspect-video bg-white border-4 border-grey hover:opacity-80 flex items-center justify-center overflow-hidden">
              <label htmlFor="uploadBanner">
                <img
                  src={banner || defaultBanner}
                  className="z-20 w-full h-full object-cover"
                  alt="Blog Banner"
                  onError={(e) => {
                    e.target.src = defaultBanner;
                  }} // Fallback if URL fails
                />

                {/* Pro Tip: Show a loading text so the user knows it's working */}
                {isUploading && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70">
                    <p className="text-black font-bold">Uploading...</p>
                  </div>
                )}

                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <textarea
              defaultValue={title}
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none
               resize-none mt-10 leading-tight placeholder:opacity-40"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}></textarea>

            <hr className="w-full opacity-10 my-5" />

            <div
              id="textEditor"
              className="font-gelasio text-2xl leading-7"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};
export default BlogEditor;

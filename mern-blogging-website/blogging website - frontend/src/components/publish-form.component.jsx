import AnimationWrapper from "../common/page-animation";
import { toast, Toaster } from "react-hot-toast"
import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import axios from "axios";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";
const PublishForm = () => {

  let { setEditorState, blog, setBlog, blog: { banner, title, tags, des, content } } = useContext(EditorContext);
  let { userAuth: { accessToken } } = useContext(UserContext);
  let navigate = useNavigate();
  const handleCloseEvent = () => {
    setEditorState("editor")
  }

  const handleKeyDown = (e) => {
    const tagLimit = 5;

    if (e.keyCode == 13 || e.keyCode == 188) {
      e.preventDefault();
      let tag = e.target.value;

      if (tags.length < tagLimit) {
        if (!tags.includes(tag) && tag.length) {
          setBlog({ ...blog, tags: [...tags, tag] });
        }
      } else {
        toast.error(`You can add max ${tagLimit} Tags`);
      }
      e.target.value = "";
    }
  }

  const handlePublish = (e) => {
    if (e.target.classList.contains("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("You must provide a title");
    }
    if (!des.length || des.length > 200) {
      return toast.error("Description must be between 1 and 200 characters");
    }
    if (!tags.length) {
      return toast.error("You must provide at least one tag");
    }

    let loadingToast = toast.loading("Publishing...");
    e.target.classList.add("disable");

    let blogObj = {
      title,
      banner,
      description: des,
      content,
      tags,
      draft: false
    };

    axios.post(import.meta.env.VITE_BACKEND_URL + "/blog/create-blog", blogObj, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    })
      .then(() => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);
        toast.success("Blog Published Successfully!");
        setTimeout(() => {
          navigate("/");
        }, 500);
      })
      .catch((err) => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);
        return toast.error(err.response?.data?.error || "Failed to publish");
      });
  }

  return (
    <>
      <AnimationWrapper>
        <section className="mt-10 max-w-[900px] center">
          <Toaster />
          <button className="w-12 h-12 absolute right-[5vw] z-20 top-[5%] 
            lg:top-[10%] p-2 "
            onClick={handleCloseEvent}>
            <i className="fi fi-br-cross"></i>
          </button>

          <div>
            <p className="text-dark-grey mb-1">Preview</p>

            <div>
              <img src={banner} />
            </div>

            <div>
              {tags.map((tag, i) => (
                <Tag tag={tag} tagIndex={i} key={i} />
              ))}


            </div>
            <p className="mt-1 mb-4 text-dark-grey text-right">{tagLimit - tags.length} tags left</p>

            <button className="btn-dark px-8 mt-4 w-full" onClick={handlePublish}>Publish</button>
          </div>
        </section>
      </AnimationWrapper>
    </>
  )
};
export default PublishForm;

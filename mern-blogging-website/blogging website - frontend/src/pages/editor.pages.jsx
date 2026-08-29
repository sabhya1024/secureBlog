import { useContext, useEffect, useState, createContext } from "react";
import { UserContext } from "../App";
import { Navigate, useParams } from "react-router-dom";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import Loader from "../components/loader.component";
import api from "../common/api";

const blogStructure = () => ({
  title: "",
  banner: "",
  content: [],
  tags: [],
  des: "",
  author: { personal_info: {} },
});

export const EditorContext = createContext({});

const Editor = () => {
  let { blog_id } = useParams();
  const [blog, setBlog] = useState(blogStructure());
  const [editorState, setEditorState] = useState("editor");
  const [textEditor, setTextEditor] = useState({ isReady: false });
  const [loading, setLoading] = useState(true);

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  useEffect(() => {
    if (!blog_id) {
      return setLoading(false);
    }
    const fetchBlogToEdit = async () => {
      try {
        const {
          data: { blog },
        } = await api.post(
          import.meta.env.VITE_BACKEND_URL + "/blog/get-blog",
          { blog_id, draft: true, mode: "edit" },
        );
        setBlog(blog);
      } catch (err) {
        setBlog(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogToEdit();
  }, []);

  return (
    <EditorContext.Provider
      value={{
        blog,
        setBlog,
        editorState,
        setEditorState,
        textEditor,
        setTextEditor,
      }}>
      {access_token === null ? (
        <Navigate to={"/signin"} />
      ) : loading ? (
        <Loader />
      ) : editorState === "editor" ? (
        <BlogEditor />
      ) : (
        <PublishForm />
      )}
    </EditorContext.Provider>
  );
};

export default Editor;

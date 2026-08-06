import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const BlogInteraction = () => {
  let {
    blog,
    blog: {
      _id,
      title,
      blog_id,
      activity: { total_likes, total_comments },
      author: {
        personal_info: { username: author_username },
      },
    },
    setBlog,
    isLikedByUser,
    setLikedByUser,
  } = useContext(BlogContext);

  let {
    userAuth: { username, access_token },
  } = useContext(UserContext);

  useEffect(() => {
    if (access_token) {
      const checkLike = async () => {
        try {
          const {
            data: { result },
          } = await axios.post(
            import.meta.env.VITE_BACKEND_URL + "/blog/is-liked-by-user",
            { _id },
            { headers: { Authorization: `Bearer ${access_token}` } },
          );
          setLikedByUser(Boolean(result));
        } catch (err) {
          console.error(err.message);
        }
      };
      checkLike();
    }
  }, [_id, access_token]);

  const handleLike = async () => {
    if (access_token) {
      const newLikedState = !isLikedByUser;
      setLikedByUser(newLikedState);

      const newTotalLikes = newLikedState ? total_likes + 1 : total_likes - 1;
      setBlog({
        ...blog,
        activity: { ...blog.activity, total_likes: newTotalLikes },
      });

      try {
        const data = await axios.post(
          import.meta.env.VITE_BACKEND_URL + "/blog/like-blog",
          { _id, likedByUser: isLikedByUser },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );
      } catch (err) {
        console.error(err.message);
      }
    } else {
      // not logged in
      toast.error("please login to like this blog");
    }
  };

  return (
    <>
      <Toaster />
      <hr className="border-grey my-2" />

      <div className="flex gap-6 justify-between">
        <div className="flex gap-3 items-center">
          <button
            className={
              "w-10 h-10 rounded-full flex items-center justify-center bg-grey/80 hover:bg-grey/50 " +
              (isLikedByUser ? "bg-red/20 text-red" : "bg-grey/80 ")
            }
            onClick={handleLike}>
            <i
              className={
                "fi " + (isLikedByUser ? "fi-sr-heart" : "fi-rr-heart")
              }></i>
          </button>
          <p className="text-xl text-dark-grey">{total_likes || 0}</p>

          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80 hover:bg-grey/50">
            <i className="fi fi-rr-comment-dots"></i>
          </button>
          <p className="text-xl text-dark-grey">{total_comments || 0}</p>
        </div>

        <div className="flex gap-6 items-center">
          {username === author_username ? (
            <Link
              to={`/editor/${blog_id}`}
              className="underline hover:text-purple">
              Edit
            </Link>
          ) : (
            ""
          )}
        </div>
      </div>

      <hr className="border-grey my-2" />
    </>
  );
};

export default BlogInteraction;

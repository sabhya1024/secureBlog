import { useContext, useState } from "react";
import { UserContext } from "../App";
import { BlogContext } from "../pages/blog.page";
import { toast, Toaster } from "react-hot-toast";
import api from "../common/api";

const CommentField = ({
  action,
  index = undefined,
  replyingTo = undefined,
  setReplying,
}) => {
  const [comment, setComment] = useState("");

  let {
    blog,
    blog: {
      _id,
      author,
      comments,
      comments: { results: commentsArr = [] } = {},
      activity,
      activity: { total_comments = 0, total_parent_comments = 0 } = {},
    },
    setBlog,
    setTotalParentCommentsLoaded,
  } = useContext(BlogContext);

  let blog_author = author?._id;

  let { userAuth: { access_token, username, fullname, profile_img } = {} } =
    useContext(UserContext);

  const handleComment = async () => {
    if (!access_token) {
      return toast.error("Please login to leave a comment");
    }

    if (!comment.trim().length) {
      return toast.error("Write something to leave a comment");
    }

    try {
      const { data } = await api.post(
        import.meta.env.VITE_BACKEND_URL + "/blog/add-comment",
        {
          _id,
          blog_author,
          comment,
          replying_to: replyingTo,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      setComment("");

      data.commented_by = {
        personal_info: { username, profile_img, fullname },
      };

      let newCommentArr = [...(commentsArr || [])];

      if (replyingTo) {
        newCommentArr[index].children.push(data._id);

        data.childrenLevel = (newCommentArr[index].childrenLevel || 0) + 1;
        data.parentIndex = index;

        newCommentArr[index].isReplyLoaded = true;

        newCommentArr.splice(index + 1, 0, data);

        if (setReplying) {
          setReplying(false);
        }

        setBlog({
          ...blog,
          comments: { ...comments, results: newCommentArr },
          activity: {
            ...activity,
            total_comments: total_comments + 1,
          },
        });
      } else {
        data.childrenLevel = 0;
        newCommentArr = [data, ...newCommentArr];

        setBlog({
          ...blog,
          comments: { ...comments, results: newCommentArr },
          activity: {
            ...activity,
            total_comments: total_comments + 1,
            total_parent_comments: total_parent_comments + 1,
          },
        });

        if (setTotalParentCommentsLoaded) {
          setTotalParentCommentsLoaded((prev) => prev + 1);
        }
      }

      toast.success(replyingTo ? "Reply posted" : "Comment added");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to post comment");
    }
  };

  return (
    <>
      <Toaster />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Leave a comment..."
        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"></textarea>

      <button className="btn-dark mt-5 px-10" onClick={handleComment}>
        {action}
      </button>
    </>
  );
};

export default CommentField;

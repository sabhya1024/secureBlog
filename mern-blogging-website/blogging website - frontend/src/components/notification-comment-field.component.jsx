import { useState, useContext } from "react";
import { UserContext } from "../App";
import toast, { Toaster } from "react-hot-toast";
import api from "../common/api";

const NotificationCommentField = ({
  _id,
  blog_author,
  index = 0,
  replyingTo = undefined,
  setReplying,
  notification_id,
  notificationData,
}) => {
  let [comment, setComment] = useState("");

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  let {
    notifications,
    notifications: { results },
    setNotifications,
  } = notificationData;

  const handleComment = async () => {
    if (!comment.length) {
      return toast.error("Write something to leave a reply...");
    }

    try {
      const { data } = await api.post(
        import.meta.env.VITE_BACKEND_URL + "/blog/add-comment",
        {
          _id,
          blog_author,
          comment,
          replying_to: replyingTo,
          notification_id,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (setReplying) {
        setReplying(false);
      }

      results[index].reply = { comment, _id: data._id };
      setNotifications({ ...notifications, results });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Toaster />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Leave a reply..."
        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
      ></textarea>
      <button className="btn-dark mt-5 px-10" onClick={handleComment}>
        Reply
      </button>
    </>
  );
};

export default NotificationCommentField;

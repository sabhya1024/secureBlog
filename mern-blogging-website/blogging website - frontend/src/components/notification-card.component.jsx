import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { getDay } from "../common/date";
import NotificationCommentField from "./notification-comment-field.component";
import { UserContext } from "../App";
import api from "../common/api";

const NotificationCard = ({ data, index, notificationState }) => {
  let [isReplying, setIsReplying] = useState(false);

  let {
    seen,
    type,
    createdAt,
    comment,
    replied_on_comment,
    user,
    blog,
    _id: notification_id,
    reply,
  } = data;

  let { fullname = "Deleted User", username = "unknown", profile_img = "https://api.dicebear.com/6.x/bottts/svg?seed=Unknown" } = user?.personal_info || {};
  let { _id: blog_id, blog_id: id, title = "Deleted Blog" } = blog || {};

  let {
    userAuth: {
      access_token,
      user: { profile_img: author_profile_img } = {},
      profile_img: fallback_profile_img,
    },
  } = useContext(UserContext);

  let user_profile_img = author_profile_img || fallback_profile_img;

  let {
    notifications,
    notifications: { results, totalDocs, deletedDocCount },
    setNotifications,
  } = notificationState;

  const handleReplyClick = () => {
    setIsReplying((preVal) => !preVal);
  };

  const handleDelete = async (comment_id, type, target) => {
    target.setAttribute("disabled", true);

    try {
      await api.post(
        import.meta.env.VITE_BACKEND_URL + "/blog/delete-comment",
        { _id: comment_id },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (type === "comment") {
        results.splice(index, 1);
      } else {
        delete results[index].reply;
      }

      target.removeAttribute("disabled");
      setNotifications({
        ...notifications,
        results,
        totalDocs: totalDocs - 1,
        deletedDocCount: (deletedDocCount || 0) + 1,
      });
    } catch (err) {
      console.log(err);
      target.removeAttribute("disabled");
    }
  };

  return (
    <div
      className={
        "p-6 border-b border-grey border-l-black " +
        (!seen ? "border-l-2" : "")
      }
    >
      <div className="flex gap-5 mb-3">
        <img src={profile_img} className="w-14 h-14 flex-none rounded-full" />
        <div className="w-full">
          <h1 className="font-medium text-xl text-dark-grey">
            <span className="lg:inline-block hidden capitalize">
              {fullname}
            </span>
            <Link
              to={`/user/${username}`}
              className="mx-1 text-black underline"
            >
              @{username}
            </Link>
            <span className="font-normal">
              {type === "like"
                ? "liked your blog"
                : type === "comment"
                ? "commented on"
                : "replied on"}
            </span>
          </h1>

          {type === "reply" ? (
            <div className="p-4 mt-4 rounded-md bg-grey">
              <p>{replied_on_comment?.comment}</p>
            </div>
          ) : (
            <Link
              to={`/blog/${id}`}
              className="font-medium text-dark-grey hover:underline line-clamp-1"
            >{`"${title}"`}</Link>
          )}
        </div>
      </div>

      {type !== "like" ? (
        <p className="ml-14 font-gelasio text-xl my-5 pl-5 font-normal">
          {comment?.comment}
        </p>
      ) : (
        ""
      )}

      <div className="ml-14 pl-5 mt-3 text-dark-grey flex gap-8 font-normal">
        <p>{getDay(createdAt)}</p>

        {type !== "like" ? (
          <>
            <button
              className="underline hover:text-black"
              onClick={handleReplyClick}
            >
              Reply
            </button>
            <button
              className="underline hover:text-black"
              onClick={(e) => handleDelete(comment?._id, "comment", e.target)}
            >
              Delete
            </button>
          </>
        ) : (
          ""
        )}
      </div>

      {isReplying ? (
        <div className="mt-8">
          <NotificationCommentField
            _id={blog_id}
            blog_author={user?._id}
            index={index}
            replyingTo={comment?._id}
            setReplying={setIsReplying}
            notification_id={notification_id}
            notificationData={notificationState}
          />
        </div>
      ) : (
        ""
      )}

      {reply ? (
        <div className="ml-20 p-5 bg-grey mt-5 rounded-md">
          <div className="flex gap-3 mb-3">
            <img src={user_profile_img} className="w-8 h-8 rounded-full" />
            <div>
              <h1 className="font-medium text-xl text-dark-grey">
                <Link
                  to={`/user/${username}`}
                  className="mx-1 text-black underline"
                >
                  @{username}
                </Link>
                <span className="font-normal">replied to</span>
                <Link
                  to={`/user/${username}`}
                  className="mx-1 text-black underline"
                >
                  @{username}
                </Link>
              </h1>
            </div>
          </div>
          <p className="ml-11 font-gelasio text-xl my-2 font-normal">
            {reply.comment}
          </p>
          <button
            className="underline hover:text-black ml-11 mt-2 font-normal"
            onClick={(e) => handleDelete(reply._id, "reply", e.target)}
          >
            Delete
          </button>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default NotificationCard;

import { useContext, useState } from "react";
import { getDay } from "../common/date";
import { UserContext } from "../App";
import { toast } from "react-hot-toast";
import CommentField from "./comment-field.component";
import { BlogContext } from "../pages/blog.page";
import api from "../common/api";

const CommentCard = ({ index, leftVal, commentData }) => {
  let {
    _id,
    commented_by,
    commentedAt,
    comment,
    children = [],
  } = commentData || {};

  let {
    profile_img = "https://api.dicebear.com/6.x/bottts/svg?seed=Unknown",
    fullname = "Deleted User",
    username: commented_by_username = "unknown",
  } = commented_by?.personal_info || {};

  const [isReplying, setReplying] = useState(false);

  let {
    blog,
    blog: {
      comments,
      comments: { results: commentsArr = [] } = {},
      activity,
      activity: { total_parent_comments = 0 } = {},
      author,
    } = {},
    setBlog,
    setTotalParentCommentsLoaded,
  } = useContext(BlogContext);

  let { userAuth: { access_token, username } = {} } = useContext(UserContext);

  let blog_author = author?.personal_info?.username || "";

  const getParentIndex = () => {
    let startingPoint = index - 1;

    try {
      while (
        commentsArr[startingPoint]?.childrenLevel >= commentData.childrenLevel
      ) {
        startingPoint--;
      }
    } catch {
      startingPoint = undefined;
    }

    return startingPoint;
  };

  const removeComments = (startingPoint, isDelete = false) => {
    if (commentsArr[startingPoint]) {
      while (
        commentsArr[startingPoint]?.childrenLevel > commentData.childrenLevel
      ) {
        commentsArr.splice(startingPoint, 1);
        if (!commentsArr[startingPoint]) {
          break;
        }
      }
    }

    if (isDelete) {
      let parentIndex = getParentIndex();

      if (parentIndex !== undefined && commentsArr[parentIndex]) {
        commentsArr[parentIndex].children = commentsArr[
          parentIndex
        ].children.filter((child) => child !== _id);

        if (!commentsArr[parentIndex].children.length) {
          commentsArr[parentIndex].isReplyLoaded = false;
        }
      }

      commentsArr.splice(index, 1);
    }

    if (commentData.childrenLevel === 0 && isDelete) {
      if (setTotalParentCommentsLoaded) {
        setTotalParentCommentsLoaded((prev) => prev - 1);
      }
    }

    setBlog({
      ...blog,
      comments: { ...comments, results: [...commentsArr] },
      activity: {
        ...activity,
        total_parent_comments:
          total_parent_comments -
          (commentData.childrenLevel === 0 && isDelete ? 1 : 0),
      },
    });
  };

  const hideReplies = () => {
    commentData.isReplyLoaded = false;
    removeComments(index + 1);
  };

  const loadReplies = async ({ skip = 0, currentIndex = index }) => {
    if (commentData.children.length) {
      hideReplies();

      try {
        const {
          data: { replies },
        } = await api.post(
          import.meta.env.VITE_BACKEND_URL + "/blog/get-replies",
          { _id: commentsArr[currentIndex]._id, skip },
        );

        commentsArr[currentIndex].isReplyLoaded = true;

        for (let i = 0; i < replies.length; i++) {
          replies[i].childrenLevel = commentsArr[currentIndex].childrenLevel + 1;
          commentsArr.splice(currentIndex + 1 + i + skip, 0, replies[i]);
        }

        setBlog({
          ...blog,
          comments: { ...comments, results: [...commentsArr] },
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const deleteComment = async (e) => {
    e.target.setAttribute("disabled", true);

    try {
      await api.post(
        import.meta.env.VITE_BACKEND_URL + "/blog/delete-comment",
        { _id },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      e.target.removeAttribute("disabled");
      removeComments(index + 1, true);
      toast.success("Comment deleted");
    } catch (err) {
      console.error(err);
      e.target.removeAttribute("disabled");
      toast.error(err.response?.data?.error || "Failed to delete comment");
    }
  };

  const handleReplyClick = () => {
    if (!access_token) {
      return toast.error("Please login to reply to this comment");
    }
    setReplying((prev) => !prev);
  };

  const LoadMoreRepliesButton = () => {
    let parentIndex = getParentIndex();

    let button = <button
              onClick={() =>
                loadReplies({
                  skip: index - parentIndex,
                  currentIndex: parentIndex,
                })
              }
              className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2">
              {" "}
              Load More Replies{" "}
            </button>

    if (commentsArr[index + 1]) {
      if (
        commentsArr[index + 1].childrenLevel < commentsArr[index].childrenLevel
      ) {
        if ((index - parentIndex) < commentsArr[parentIndex].children.length) {
          return  button;
        }
      }
    } else {
      if (parentIndex) {
         if (index - parentIndex < commentsArr[parentIndex].children.length) {
           return button;
         }
        
      }
    }
  };
  return (
    <div className="w-full" style={{ paddingLeft: `${leftVal * 10}px` }}>
      <div className="my-5 p-6 rounded-md border border-grey">
        <div className="flex gap-3 items-center mb-8">
          <img
            src={profile_img}
            className="w-6 h-6 rounded-full object-cover"
          />
          <p className="line-clamp-1">
            {fullname} @{commented_by_username}
          </p>
          <p className="min-w-fit text-dark-grey text-sm">
            {getDay(commentedAt)}
          </p>
        </div>

        <p className="font-gelasio text-xl ml-3">{comment}</p>

        <div className="flex gap-5 items-center mt-5">
          {commentData.isReplyLoaded ? (
            <button
              className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
              onClick={hideReplies}>
              <i className="fi fi-rs-comment-dots"></i> Hide Reply
            </button>
          ) : (
            <button
              className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
              onClick={() => loadReplies({ skip: 0 })}>
              <i className="fi fi-rs-comment-dots"></i> {children.length} Reply
            </button>
          )}

          <button className="underline" onClick={handleReplyClick}>
            Reply
          </button>

          {username === commented_by_username || username === blog_author ? (
            <button
              className="p-2 px-3 rounded-md border border-grey ml-auto hover:bg-red/30 hover:text-red flex items-center"
              onClick={deleteComment}>
              <i className="fi fi-rr-trash pointer-events-none"></i>
            </button>
          ) : (
            ""
          )}
        </div>

        {isReplying ? (
          <div className="mt-8">
            <CommentField
              action="reply"
              index={index}
              replyingTo={_id}
              setReplying={setReplying}
            />
          </div>
        ) : (
          ""
        )}
      </div>

      <LoadMoreRepliesButton />
    </div>
  );
};

export default CommentCard;

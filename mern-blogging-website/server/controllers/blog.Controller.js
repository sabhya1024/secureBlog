import Blog from "../models/Blog.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Comment from "../models/Comment.js";

export const createBlog = async (req, res) => {
  let authorId = req.user;
  let { title, content, banner, tags, description, draft, id } = req.body;

  draft = Boolean(draft);

  if (!title || typeof title !== "string") {
    console.warn(
      `[${new Date().toISOString()}] [WARN] User ${authorId} failed blog validation: Invalid title`,
    );
    return res.status(403).json({ error: "You must provide a valid title" });
  }

  if (!draft) {
    if (
      !content?.blocks?.length ||
      !banner ||
      !tags?.length ||
      !description?.length
    ) {
      console.warn(
        `[${new Date().toISOString()}] [WARN] User ${authorId} failed blog validation: Missing fields for publish`,
      );
      return res
        .status(403)
        .json({ error: "All fields are required to publish." });
    }

    if (description.length > 200) {
      console.warn(
        `[${new Date().toISOString()}] [WARN] User ${authorId} failed blog validation: Description too long`,
      );
      return res
        .status(403)
        .json({ error: "Description must be less than 200 characters." });
    }

    if (tags.length > 10) {
      console.warn(
        `[${new Date().toISOString()}] [WARN] User ${authorId} failed blog validation: Too many tags`,
      );
      return res.status(403).json({ error: "Tags limit is 10." });
    }
  }

  tags = Array.isArray(tags)
    ? tags.map((tag) => String(tag).toLowerCase())
    : [];

  let blog_id =
    id ||
    title
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .toLowerCase() +
      "-" +
      Date.now();

  try {
    if (id) {
      await Blog.findOneAndUpdate(
        { blog_id },
        {
          title,
          des: description,
          banner,
          content,
          tags,
          draft: Boolean(draft),
        },
      );
      return res.status(200).json({ id: blog_id });
    } else {
      let blog = new Blog({
        title,
        content,
        banner,
        tags,
        des: description,
        author: authorId,
        blog_id,
        draft: Boolean(draft),
      });
      await blog.save();

      let incremental = draft ? 0 : 1;
      await User.findOneAndUpdate(
        { _id: authorId },
        {
          $inc: { "account_info.total_posts": incremental },
          $push: { blogs: blog._id },
        },
      );
      return res.status(200).json({ id: blog.blog_id });
    }
  } catch (err) {
    console.error(
      `User ${authorId} failed to create/update blog: ${err.message}`,
    );
    return res
      .status(500)
      .json({ error: "Internal server error while saving blog" });
  }
};

export const searchBlogsByCategory = async (req, res) => {
  try {
    let { tag, page = 1, eliminate_blog, limit } = req.body;
    let maxLimit = limit ? limit : 5;
    let findQuery = { tags: tag, draft: false };
    if (eliminate_blog) {
      findQuery.blog_id = { $ne: eliminate_blog };
    }
    const blogs = await Blog.find(findQuery)
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id",
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);
    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const searchBlogsByCategoryCount = async (req, res) => {
  try {
    let { tag } = req.body;
    const count = await Blog.countDocuments({ tags: tag, draft: false });
    return res.status(200).json({ totalDocs: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const latestBlogs = async (req, res) => {
  let { page = 1 } = req.body;
  let maxLimit = 5;

  try {
    const blogs = await Blog.find({ draft: false })
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id",
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPopularCategories = async (req, res) => {
  try {
    const popularTags = await Blog.aggregate([
      { $match: { draft: false } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Map the aggregation result to just an array of tag strings
    const categories = popularTags.map((tag) => tag._id);

    return res.status(200).json({ categories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getFilteredBlogs = async (req, res) => {
  try {
    let { query, filterBy, page = 1 } = req.body;
    let maxLimit = 5;
    let findQuery = { draft: false };
    let sortQuery = { publishedAt: -1 };
    if (query) {
      if (filterBy === "most relevant") {
        findQuery.$text = { $search: query };
        sortQuery = { score: { $meta: "textScore" } };
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        findQuery.$or = [
          { title: new RegExp(escaped, "i") },
          { tags: new RegExp(escaped, "i") },
        ];
      }
    }
    if (filterBy === "oldest") {
      sortQuery = { publishedAt: 1 };
    } else if (filterBy === "most liked") {
      sortQuery = { "activity.total_likes": -1 };
    } else if (filterBy === "latest") {
      sortQuery = { publishedAt: -1 };
    }
    let mongoQuery = Blog.find(findQuery)
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id",
      )
      .select("blog_id title des banner activity tags publishedAt -_id");
    if (sortQuery.score) {
      mongoQuery = mongoQuery.select({ score: { $meta: "textScore" } });
    }
    const blogs = await mongoQuery
      .sort(sortQuery)
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);
    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getFilteredBlogsCount = async (req, res) => {
  let { query, filterBy } = req.body;
  let findQuery = { draft: false };

  if (query) {
    if (filterBy === "most relevant") {
      findQuery.$text = { $search: query };
    } else {
      findQuery.$or = [
        { title: new RegExp(query, "i") },
        { tags: new RegExp(query, "i") },
      ];
    }
  }

  try {
    const count = await Blog.countDocuments(findQuery);
    return res.status(200).json({ totalDocs: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const countLatestBlogs = async (req, res) => {
  try {
    let count = await Blog.countDocuments({ draft: false });
    return res.status(200).json({ totalDocs: count });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error });
  }
};

export const searchBlogs = async (req, res) => {
  try {
    let { tag, query, author, page, limit, eliminate_blog } = req.body;
    let findQuery = { draft: false };

    if (tag) {
      findQuery = { tags: tag, draft: false };
    } else if (query) {
      findQuery = { draft: false, title: new RegExp(query, "i") };
    } else if (author) {
      findQuery = { author, draft: false };
    }

    if (eliminate_blog) {
      findQuery.blog_id = { $ne: eliminate_blog };
    }

    let maxLimit = limit ? limit : 5;

    const blogs = await Blog.find(findQuery)
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id",
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);
    return res.status(200).json({ blogs });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [ERROR] searchBlogs failed: ${error.message}`,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const searchBlogsCount = async (req, res) => {
  let { tag, query, author } = req.body;
  let findQuery;

  if (tag) {
    findQuery = { tags: tag, draft: false };
  } else if (query) {
    findQuery = { draft: false, title: new RegExp(query, "i") };
  } else if (author) {
    findQuery = { author, draft: false };
  }

  try {
    const count = await Blog.countDocuments(findQuery);
    return res.status(200).json({ totalDocs: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getBlog = async (req, res) => {
  let { blog_id, draft, mode } = req.body;

  let incrementVal = mode !== "edit" ? 1 : 0;

  try {
    const blog = await Blog.findOneAndUpdate(
      { blog_id: blog_id },
      { $inc: { "activity.total_reads": incrementVal } },
      { new: true },
    ).populate(
      "author",
      "personal_info.fullname personal_info.username personal_info.profile_img",
    );

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (blog.draft && !draft) {
      return res.status(403).json({ error: "You cannot access draft blog" });
    }

    if (blog.author?.personal_info?.username) {
      await User.findOneAndUpdate(
        { "personal_info.username": blog.author.personal_info.username },
        { $inc: { "account_info.total_reads": incrementVal } },
      );
    }
    return res.status(200).json({ blog });
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
};

export const likeBlog = async (req, res) => {
  let user_id = req.user;
  let { _id, likedByUser } = req.body;

  let incrementVal = !likedByUser ? 1 : -1;

  try {
    const blog = await Blog.findOneAndUpdate(
      { _id },
      { $inc: { "activity.total_likes": incrementVal } },
      { new: true },
    );

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (!likedByUser) {
      let likeCompleted = new Notification({
        type: "like",
        blog: _id,
        notification_for: blog.author,
        user: user_id,
      });

      await likeCompleted.save();
      return res.status(200).json({ liked_by_user: true });
    } else {
      await Notification.findOneAndDelete({
        user: user_id,
        blog: _id,
        type: "like",
      });
      return res.status(200).json({ liked_by_user: false });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const isLikedByUser = async (req, res) => {
  try {
    let user_id = req.user;

    let { _id } = req.body;

    const result = await Notification.exists({
      user: user_id,
      type: "like",
      blog: _id,
    });
    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const addComment = async (req, res) => {
  const user_id = req.user;
  const { _id, comment, blog_author, replying_to, notification_id } = req.body;

  if (!comment || !comment.trim().length) {
    return res
      .status(403)
      .json({ error: "Write something to leave a comment" });
  }

  try {
    const commentObj = {
      blog_id: _id,
      blog_author,
      comment: comment.trim(),
      commented_by: user_id,
    };

    if (replying_to) {
      commentObj.parent = replying_to;
      commentObj.isReply = true;
    }

    const newComment = await new Comment(commentObj).save();

    await Blog.findOneAndUpdate(
      { _id },
      {
        $push: { comments: newComment._id },
        $inc: {
          "activity.total_comments": 1,
          "activity.total_parent_comments": replying_to ? 0 : 1,
        },
      },
    );

    let notificationObj = {
      type: replying_to ? "reply" : "comment",
      blog: _id,
      notification_for: blog_author,
      user: user_id,
      comment: newComment._id,
    };

    if (replying_to) {
      notificationObj.replied_on_comment = replying_to;

      const replyingToCommentDoc = await Comment.findOneAndUpdate(
        { _id: replying_to },
        { $push: { children: newComment._id } },
      );

      if (replyingToCommentDoc) {
        notificationObj.notification_for = replyingToCommentDoc.commented_by;
      }
    }

    await new Notification(notificationObj).save();

    if (notification_id) {
      await Notification.findOneAndUpdate(
        { _id: notification_id },
        { reply: newComment._id },
      );
    }

    const populatedComment = await Comment.findById(newComment._id).populate(
      "commented_by",
      "personal_info.fullname personal_info.username personal_info.profile_img",
    );

    return res.status(200).json(populatedComment);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getBlogComments = async (req, res) => {
  const { blog_id, skip = 0 } = req.body;
  const maxLimit = 5;

  try {
    const comments = await Comment.find({ blog_id, isReply: false })
      .populate(
        "commented_by",
        "personal_info.fullname personal_info.username personal_info.profile_img",
      )
      .skip(skip)
      .limit(maxLimit)
      .sort({ commentedAt: -1 });

    return res.status(200).json({ comments });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getReplies = async (req, res) => {
  const { _id, skip = 0 } = req.body;
  const maxLimit = 5;

  try {
    const doc = await Comment.findOne({ _id })
      .populate({
        path: "children",
        options: {
          limit: maxLimit,
          skip: skip,
          sort: { commentedAt: 1 },
        },
        populate: {
          path: "commented_by",
          select:
            "personal_info.profile_img personal_info.fullname personal_info.username",
        },
      })
      .select("children");

    return res.status(200).json({ replies: doc ? doc.children : [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteCommentsRecursive = async (_id) => {
  const comment = await Comment.findOne({ _id });

  if (comment) {
    if (comment.children && comment.children.length) {
      for (const childId of comment.children) {
        await deleteCommentsRecursive(childId);
      }
    }

    await Notification.findOneAndDelete({ comment: _id });
    await Notification.findOneAndUpdate(
      { reply: _id },
      { $unset: { reply: 1 } },
    );

    await Blog.findOneAndUpdate(
      { _id: comment.blog_id },
      {
        $pull: { comments: _id },
        $inc: {
          "activity.total_comments": -1,
          "activity.total_parent_comments": comment.parent ? 0 : -1,
        },
      },
    );

    if (comment.parent) {
      await Comment.findOneAndUpdate(
        { _id: comment.parent },
        { $pull: { children: _id } },
      );
    }

    await Comment.findOneAndDelete({ _id });
  }
};

export const deleteComment = async (req, res) => {
  const user_id = req.user;
  const { _id } = req.body;

  try {
    const comment = await Comment.findById(_id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (
      user_id === comment.commented_by.toString() ||
      user_id === comment.blog_author.toString()
    ) {
      await deleteCommentsRecursive(_id);
      return res.status(200).json({ status: "done" });
    } else {
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this comment" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteBlog = async (req, res) => {
  let user_id = req.user;
  let { blog_id } = req.body;

  try {
    const deletedBlog = await Blog.findOneAndDelete({ blog_id });
    if (!deletedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    await Notification.deleteMany({ blog: deletedBlog._id });
    await Comment.deleteMany({ blog_id: deletedBlog._id });

    await User.findOneAndUpdate(
      { _id: user_id },
      { 
        $pull: { blogs: deletedBlog._id }, 
        $inc: { "account_info.total_posts": -1 }
      }
    );

    return res.status(200).json({ status: "done" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

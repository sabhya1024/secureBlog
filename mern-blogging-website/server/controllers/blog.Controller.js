import Blog from "../models/Blog.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Comment from "../models/Comment.js";
import { escapeRegex } from "../utils/escapeRegex.js";

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
      const updatedBlog = await Blog.findOneAndUpdate(
        { blog_id, author: authorId },
        {
          title,
          des: description,
          banner,
          content,
          tags,
          draft: Boolean(draft),
        },
        { new: true },
      );

      if (!updatedBlog) {
        console.warn(
          `[${new Date().toISOString()}] [SECURITY] User ${authorId} attempted to edit blog ${blog_id} they do not own`,
        );
        return res
          .status(403)
          .json({ error: "You do not have permission to edit this blog" });
      }

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
    if (!tag || typeof tag !== "string") {
      return res.status(200).json({ blogs: [] });
    }
    let maxLimit = limit ? Number(limit) : 5;
    let findQuery = { tags: tag, draft: false };
    if (eliminate_blog && typeof eliminate_blog === "string") {
      findQuery.blog_id = { $ne: eliminate_blog };
    }
    const blogs = await Blog.find(findQuery)
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id",
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip((Math.max(1, Number(page)) - 1) * maxLimit)
      .limit(maxLimit);
    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: "Failed to search blogs by category" });
  }
};

export const searchBlogsByCategoryCount = async (req, res) => {
  try {
    let { tag } = req.body;
    if (!tag || typeof tag !== "string") {
      return res.status(200).json({ totalDocs: 0 });
    }
    const count = await Blog.countDocuments({ tags: tag, draft: false });
    return res.status(200).json({ totalDocs: count });
  } catch (err) {
    return res.status(500).json({ error: "Failed to count blogs by category" });
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

  if (query && typeof query === "string") {
    if (filterBy === "most relevant") {
      findQuery.$text = { $search: query };
    } else {
      const sanitized = escapeRegex(query);
      findQuery.$or = [
        { title: new RegExp(sanitized, "i") },
        { tags: new RegExp(sanitized, "i") },
      ];
    }
  }

  try {
    const count = await Blog.countDocuments(findQuery);
    return res.status(200).json({ totalDocs: count });
  } catch (err) {
    return res.status(500).json({ error: "Failed to count filtered blogs" });
  }
};

export const countLatestBlogs = async (req, res) => {
  try {
    let count = await Blog.countDocuments({ draft: false });
    return res.status(200).json({ totalDocs: count });
  } catch (error) {
    console.error("countLatestBlogs Error:", error.message || error);
    return res.status(500).json({ error: "Failed to count latest blogs" });
  }
};

export const searchBlogs = async (req, res) => {
  try {
    let { tag, query, author, page, limit, eliminate_blog } = req.body;
    let findQuery = { draft: false };

    if (tag && typeof tag === "string") {
      findQuery = { tags: tag, draft: false };
    } else if (query && typeof query === "string") {
      findQuery = { draft: false, title: new RegExp(escapeRegex(query), "i") };
    } else if (author && typeof author === "string") {
      findQuery = { author, draft: false };
    }

    if (eliminate_blog && typeof eliminate_blog === "string") {
      findQuery.blog_id = { $ne: eliminate_blog };
    }

    let maxLimit = limit ? Number(limit) : 5;

    const blogs = await Blog.find(findQuery)
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id",
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip((Math.max(1, Number(page || 1)) - 1) * maxLimit)
      .limit(maxLimit);
    return res.status(200).json({ blogs });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [ERROR] searchBlogs failed: ${error.message || error}`,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const searchBlogsCount = async (req, res) => {
  let { tag, query, author } = req.body;
  let findQuery = { draft: false };

  if (tag && typeof tag === "string") {
    findQuery = { tags: tag, draft: false };
  } else if (query && typeof query === "string") {
    findQuery = { draft: false, title: new RegExp(escapeRegex(query), "i") };
  } else if (author && typeof author === "string") {
    findQuery = { author, draft: false };
  }

  try {
    const count = await Blog.countDocuments(findQuery);
    return res.status(200).json({ totalDocs: count });
  } catch (err) {
    return res.status(500).json({ error: "Failed to count search blogs" });
  }
};

export const getBlog = async (req, res) => {
  let { blog_id, mode } = req.body;

  if (!blog_id || typeof blog_id !== "string") {
    return res.status(400).json({ error: "Invalid blog ID" });
  }

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

    // If blog is a draft, only the author can view it
    if (blog.draft) {
      // Check for auth token
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(403).json({ error: "You cannot access draft blog" });
      }

      // Verify the token and check ownership
      const jwt = await import("jsonwebtoken");
      try {
        const decoded = jwt.default.verify(token, process.env.ACCESS_TOKEN_SECRET, {
          algorithms: ["HS256"],
        });
        if (decoded.id !== blog.author._id.toString()) {
          return res.status(403).json({ error: "You cannot access draft blog" });
        }
      } catch {
        return res.status(403).json({ error: "You cannot access draft blog" });
      }
    }

    if (blog.author?.personal_info?.username) {
      await User.findOneAndUpdate(
        { "personal_info.username": blog.author.personal_info.username },
        { $inc: { "account_info.total_reads": incrementVal } },
      );
    }
    return res.status(200).json({ blog });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load blog" });
  }
};

export const likeBlog = async (req, res) => {
  let user_id = req.user;
  let { _id } = req.body;

  if (!_id || typeof _id !== "string") {
    return res.status(400).json({ error: "Invalid blog ID" });
  }

  try {
    const existingLike = await Notification.findOne({
      type: "like",
      blog: _id,
      user: user_id,
    });

    if (!existingLike) {
      const blog = await Blog.findOneAndUpdate(
        { _id },
        { $inc: { "activity.total_likes": 1 } },
        { new: true },
      );

      if (!blog) {
        return res.status(404).json({ error: "Blog not found" });
      }

      await new Notification({
        type: "like",
        blog: _id,
        notification_for: blog.author,
        user: user_id,
      }).save();

      return res.status(200).json({ liked_by_user: true });
    } else {
      await Blog.findOneAndUpdate(
        { _id },
        { $inc: { "activity.total_likes": -1 } },
      );
      await Notification.findOneAndDelete({ _id: existingLike._id });
      return res.status(200).json({ liked_by_user: false });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to update like status" });
  }
};

export const isLikedByUser = async (req, res) => {
  try {
    let user_id = req.user;
    let { _id } = req.body;

    if (!_id || typeof _id !== "string") {
      return res.status(400).json({ error: "Invalid blog ID" });
    }

    const result = await Notification.exists({
      user: user_id,
      type: "like",
      blog: _id,
    });
    return res.status(200).json({ result: Boolean(result) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to check like status" });
  }
};

export const addComment = async (req, res) => {
  const user_id = req.user;
  const { _id, comment, replying_to, notification_id } = req.body;

  if (!comment || typeof comment !== "string" || !comment.trim().length) {
    return res
      .status(403)
      .json({ error: "Write something to leave a comment" });
  }

  if (!_id || typeof _id !== "string") {
    return res.status(400).json({ error: "Invalid blog ID" });
  }

  try {
    const blog = await Blog.findById(_id).select("author");
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    const authenticBlogAuthor = blog.author;

    const commentObj = {
      blog_id: _id,
      blog_author: authenticBlogAuthor,
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
      notification_for: authenticBlogAuthor,
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
    return res.status(500).json({ error: "Failed to add comment" });
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

  if (!_id || typeof _id !== "string") {
    return res.status(400).json({ error: "Invalid comment ID" });
  }

  try {
    const comment = await Comment.findById(_id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const requestingUser = await User.findById(user_id).select("role");
    const isAdmin = requestingUser && (requestingUser.role === "admin" || requestingUser.role === "superadmin");
    const isCommentAuthor = user_id === comment.commented_by.toString();
    const isBlogAuthor = user_id === comment.blog_author.toString();

    if (isCommentAuthor || isBlogAuthor || isAdmin) {
      await deleteCommentsRecursive(_id);
      return res.status(200).json({ status: "done" });
    } else {
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this comment" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete comment" });
  }
};

export const deleteBlog = async (req, res) => {
  let user_id = req.user;
  let { blog_id } = req.body;

  if (!blog_id || typeof blog_id !== "string") {
    return res.status(400).json({ error: "Invalid blog ID" });
  }

  try {
    // Find the blog
    const blog = await Blog.findOne({ blog_id });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if requester is author OR admin/superadmin
    const requestingUser = await User.findById(user_id).select("role");
    const isAdmin = requestingUser && (requestingUser.role === "admin" || requestingUser.role === "superadmin");
    const isAuthor = blog.author.toString() === user_id;

    if (!isAuthor && !isAdmin) {
      console.warn(
        `[${new Date().toISOString()}] [SECURITY] User ${user_id} attempted to delete blog ${blog_id} owned by ${blog.author}`,
      );
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this blog" });
    }

    // Authorized (Author or Admin/Superadmin) — proceed with deletion
    await Blog.findOneAndDelete({ _id: blog._id });

    await Notification.deleteMany({ blog: blog._id });
    await Comment.deleteMany({ blog_id: blog._id });

    // Decrement posts from the original blog author's account (not the admin's)
    await User.findOneAndUpdate(
      { _id: blog.author },
      { 
        $pull: { blogs: blog._id }, 
        $inc: { "account_info.total_posts": -1 }
      }
    );

    return res.status(200).json({ status: "done" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete blog" });
  }
};

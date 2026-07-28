import Blog from "../models/Blog.js";
import User from "../models/User.js";

export const createBlog = async (req, res) => {
  let authorId = req.user;
  let { title, content, banner, tags, description, draft } = req.body;

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
  let blogId =
    title
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .toLowerCase() +
    "-" +
    Date.now();

  let blog = new Blog({
    title,
    content,
    banner,
    tags,
    des: description,
    author: authorId,
    blog_id: blogId,
    draft: Boolean(draft),
  });

  try {
    await blog.save();

    let incremental = draft ? 0 : 1;
    await User.findOneAndUpdate(
      {
        _id: authorId,
      },
      {
        $inc: { "account_info.total_posts": incremental },
        $push: { blogs: blog._id },
      },
    );

    console.info(
      `[${new Date().toISOString()}] [INFO] User ${authorId} successfully created blog ${blogId} (draft: ${draft})`,
    );
    return res.status(200).json({ id: blog.blog_id });
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [ERROR] User ${authorId} failed to create blog: ${err.message}`,
    );
    return res
      .status(500)
      .json({ error: "Internal server error while creating blog" });
  }
};

export const latestBlogs = async (req, res) => {
  let maxLimit = 5;
  Blog.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id",
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs: blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
};

export const searchBlogsByCategory = async (req, res) => {
  let { tag, page } = req.body;
  let maxLimit = 5;

  Blog.find({ tags: tag, draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id",
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
};

export const searchBlogsByCategoryCount = async (req, res) => {
  let { tag } = req.body;
  Blog.countDocuments({ tags: tag, draft: false })
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
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
  let { query, filterBy, page } = req.body;
  let maxLimit = 5;

  let findQuery = { draft: false };
  let sortQuery = { publishedAt: -1 }; // Default to latest

  // 1. If there's a search query, use $text search or Regex
  if (query) {
    if (filterBy === "most relevant") {
      findQuery.$text = { $search: query };
      sortQuery = { score: { $meta: "textScore" } };
    } else {
      findQuery.$or = [
        { title: new RegExp(query, "i") },
        { tags: new RegExp(query, "i") },
      ];
    }
  }

  // 2. Handle specific sort filters
  if (filterBy === "oldest") {
    sortQuery = { publishedAt: 1 };
  } else if (filterBy === "most liked") {
    sortQuery = { "activity.total_likes": -1 };
  } else if (filterBy === "latest") {
    sortQuery = { publishedAt: -1 };
  }

  // 3. Execute query
  let mongoQuery = Blog.find(findQuery)
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id",
    )
    .select("blog_id title des banner activity tags publishedAt -_id");

  if (sortQuery.score) {
    mongoQuery = mongoQuery.select({ score: { $meta: "textScore" } });
  }

  mongoQuery
    .sort(sortQuery)
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
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

  Blog.countDocuments(findQuery)
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
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
    let { tag, query,author, page } = req.body;
    let findQuery;

    if (tag) {
      findQuery = { tags: tag, draft: false };
    } else if (query) {
      findQuery = { draft: false, title: new RegExp(query, "i") };
    }
    else if (author) {
      findQuery = {author, draft:false}
    }
  } catch (error) {
    console.log("Internnal server error");
  }
};

export const getBlog = async (req, res) => {
  let { blog_id} = req.body;

}
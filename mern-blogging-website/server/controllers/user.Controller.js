import User from "../models/User.js";
import Blog from "../models/Blog.js";
import Notification from "../models/Notification.js";
import Comment from "../models/Comment.js";

export const searchUsers = async (req, res) => {
  try {
    let { query } = req.body;
    const escapedQuery = (query || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find({
      "personal_info.username": new RegExp(escapedQuery, "i"),
    })
      .limit(50)
      .select(
        "personal_info.fullname personal_info.username personal_info.profile_img -_id",
      );
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    let { username } = req.body;
    const user = await User.findOne({
      "personal_info.username": username,
    }).select("-personal_info.password -google_auth -updatedAt -blogs");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  let { username = "", bio = "", social_links = {} } = req.body;
  let bioLimit = 250;

  if (username.length < 3) {
    return res
      .status(403)
      .json({ error: "Username should be at least 3 letters long" });
  }

  if (bio.length > bioLimit) {
    return res
      .status(403)
      .json({ error: `Bio should not be more than ${bioLimit} characters` });
  }

  let socialLinksArr = Object.keys(social_links);
  try {
    for (let i = 0; i < socialLinksArr.length; i++) {
      let platform = socialLinksArr[i];
      let link = social_links[platform];

      if (link.length) {
        let parsed = new URL(link);

        // Block malicious protocols (like javascript: or data:)
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error();
        }

        // Strict domain whitelisting
        const allowedDomains = {
          youtube: ["youtube.com", "youtu.be"],
          instagram: ["instagram.com"],
          facebook: ["facebook.com"],
          github: ["github.com"],
          website: [], // Allow any standard domain for personal website
        };

        let domains = allowedDomains[platform];
        if (domains && domains.length > 0) {
          let isValidDomain = domains.some((domain) =>
            parsed.hostname.endsWith(domain),
          );
          if (!isValidDomain) {
            return res.status(403).json({
              error: `${link} is not a valid link for ${platform}. It must match the platform domain.`,
            });
          }
        }
      }
    }
  } catch (err) {
    return res.status(403).json({
      error:
        "You must provide full, valid social links with http(s) included. Invalid protocols (like javascript:) are blocked.",
    });
  }

  let updateObj = {
    "personal_info.username": username,
    "personal_info.bio": bio,
    social_links,
  };

  try {
    await User.findOneAndUpdate({ _id: req.user }, updateObj, {
      runValidators: true,
    });
    return res.status(200).json({ username });
  } catch (err) {
    if (err.code == 11000) {
      return res.status(409).json({ error: "Username is already taken" });
    }
    return res.status(500).json({ error: err.message });
  }
};

export const updateProfileImg = async (req, res) => {
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
    await User.findOneAndUpdate(
      { _id: req.user },
      { "personal_info.profile_img": url },
    );
    return res.status(200).json({ profile_img: url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const newNotification = async (req, res) => {
  const user_id = req.user;

  try {
    const result = await Notification.exists({
      notification_for: user_id,
      seen: false,
      user: { $ne: user_id },
    });

    if (result) {
      return res.status(200).json({ new_notification_available: true });
    } else {
      return res.status(200).json({ new_notification_available: false });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ error: err.message });
  }
};

export const notifications = async (req, res) => {
  const user_id = req.user;
  let { page, filter, deletedDocCount } = req.body;

  let maxLimit = 10;
  let findQuery = { notification_for: user_id, user: { $ne: user_id } };

  let skipDocs = (page - 1) * maxLimit;

  if (filter !== "all") {
    findQuery.type = filter;
  }

  if (deletedDocCount) {
    skipDocs -= deletedDocCount;
  }

  try {
    const notifications = await Notification.find(findQuery)
      .skip(skipDocs)
      .limit(maxLimit)
      .populate("blog", "title blog_id")
      .populate(
        "user",
        "personal_info.fullname personal_info.username personal_info.profile_img",
      )
      .populate("comment", "comment")
      .populate("replied_on_comment", "comment")
      .populate("reply", "comment")
      .sort({ createdAt: -1 })
      .select("createdAt type seen reply");

    await Notification.updateMany(findQuery, { seen: true })
      .skip(skipDocs)
      .limit(maxLimit);
    console.log("notification seen");

    return res.status(200).json({ notifications });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ error: err.message });
  }
};

export const allNotificationsCount = async (req, res) => {
  const user_id = req.user;
  let { filter } = req.body;

  let findQuery = { notification_for: user_id, user: { $ne: user_id } };

  if (filter !== "all") {
    findQuery.type = filter;
  }

  try {
    const count = await Notification.countDocuments(findQuery);
    return res.status(200).json({ totalDocs: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const userWrittenBlogs = async (req, res) => {
  let user_id = req.user;
  let { page, draft, query, deletedDocCount } = req.body;

  let maxLimit = 5;

  let skipDocs = (page - 1) * maxLimit;

  if (deletedDocCount) {
    skipDocs -= deletedDocCount;
  }

  let isDraft = draft === true || draft === "true";
  let findQuery = { author: user_id, draft: isDraft };
  if (query) {
    findQuery.title = new RegExp(query, "i");
  }

  try {
    const blogs = await Blog.find(findQuery)
      .skip(skipDocs)
      .limit(maxLimit)
      .sort({ publishedAt: -1 })
      .select("title banner publishedAt blog_id activity des draft -_id");

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export const userWrittenBlogsCount = async (req, res) => {
  let user_id = req.user;
  let { draft, query } = req.body;

  let isDraft = draft === true || draft === "true";
  let findQuery = { author: user_id, draft: isDraft };
  if (query) {
    findQuery.title = new RegExp(query, "i");
  }
  
  try {
    const count = await Blog.countDocuments(findQuery);

    return res.status(200).json({ totalDocs: count})
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

}

export const deleteAccount = async (req, res) => {
  let user_id = req.user;

  try {
    const userBlogs = await Blog.find({ author: user_id }).select("_id");
    const userBlogIds = userBlogs.map((b) => b._id);

    await Comment.deleteMany({ blog_id: { $in: userBlogIds } });

    await Notification.deleteMany({ blog: { $in: userBlogIds } });

    await Blog.deleteMany({ author: user_id });

    const userComments = await Comment.find({ commented_by: user_id }).select("_id blog_id parent");
    for (let comment of userComments) {
      await Blog.findOneAndUpdate(
        { _id: comment.blog_id },
        {
          $pull: { comments: comment._id },
          $inc: {
            "activity.total_comments": -1,
            "activity.total_parent_comments": comment.parent ? 0 : -1,
          },
        }
      );
      if (comment.parent) {
        await Comment.findOneAndUpdate(
          { _id: comment.parent },
          { $pull: { children: comment._id } }
        );
      }
    }
    await Comment.deleteMany({ commented_by: user_id });

    await Notification.deleteMany({
      $or: [{ user: user_id }, { notification_for: user_id }],
    });

    await User.findByIdAndDelete(user_id);

    return res.status(200).json({ status: "success" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


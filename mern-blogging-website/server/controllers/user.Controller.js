import User from "../models/User.js";

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
  }
  catch (error) {
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


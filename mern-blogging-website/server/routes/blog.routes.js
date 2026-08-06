import express from "express";
import {
  createBlog,
  searchBlogsByCategory,
  searchBlogsByCategoryCount,
  latestBlogs,
  getPopularCategories,
  getFilteredBlogs,
  getFilteredBlogsCount,
  getBlog,
  searchBlogs,
  searchBlogsCount,
  likeBlog,
  isLikedByUser
} from "../controllers/blog.Controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = express.Router();

router.post("/create-blog", verifyJWT, createBlog);
router.post("/search-blogs", searchBlogs);
router.post("/search-blog-by-category", searchBlogsByCategory);
router.post("/search-blogs-count", searchBlogsCount);
router.post("/filter-blogs", getFilteredBlogs);
router.post("/filter-blogs-count", getFilteredBlogsCount);

router.post("/latest-blogs", latestBlogs);
router.get("/categories", getPopularCategories);
router.post("/get-blog", getBlog);
router.post("/is-liked-by-user", verifyJWT, isLikedByUser);

router.post("/like-blog", verifyJWT, likeBlog);
export default router;

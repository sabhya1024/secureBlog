import express from "express";
import { 
  createBlog, 
  searchBlogsByCategory, 
  searchBlogsByCategoryCount,
  latestBlogs, 
  getPopularCategories, 
  getFilteredBlogs,
  getFilteredBlogsCount,
  getBlog
} from "../controllers/blog.Controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = express.Router();

router.post("/create-blog", verifyJWT, createBlog);
router.post("/search-blogs", searchBlogsByCategory);
router.post("/search-blogs-count", searchBlogsByCategoryCount);
router.post("/filter-blogs", getFilteredBlogs);
router.post("/filter-blogs-count", getFilteredBlogsCount);

router.post("/latest-blogs", latestBlogs);
router.get("/categories", getPopularCategories);
router.post("/get-blog", getBlog)
export default router;

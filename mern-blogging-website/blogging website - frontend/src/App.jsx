import { createContext, useEffect, useState } from "react";
import Navbar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import { Routes, Route } from "react-router-dom";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages";
import SearchPage from "./pages/search.page";
import HomePage from "./pages/home.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import Notifications from "./pages/notifications.page";
import ManageBlogs from "./pages/manage-blogs.page";

import SideNav from "./components/sidenavbar.component";
import ChangePassword from "./pages/change-password.page";
import EditProfile from "./pages/edit-profile.page";
import api from "./common/api";

export const UserContext = createContext({});

const App = () => {
  const [userAuth, setUserAuth] = useState({});

  let access_token = userAuth?.access_token;

  useEffect(() => {
    let userInSession = lookInSession("user");

    userInSession
      ? setUserAuth(userInSession)
      : setUserAuth({ access_token: null });
  }, []);

  useEffect(() => {
    if (access_token) {
      const fetchNewNotification = async () => {
        try {
          const { data } = await api.get(
            import.meta.env.VITE_BACKEND_URL + "/user/new-notification",
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            }
          );
          setUserAuth((prev) => ({ ...prev, ...data }));
        } catch (err) {
          console.log(err);
        }
      };

      fetchNewNotification();
    }
  }, [access_token]);

  useEffect(() => {
    // Register callbacks so the axios interceptor can update React state
    api._onTokenRefreshed = (newToken) => {
      setUserAuth((prev) => ({ ...prev, access_token: newToken }));
    };
    api._onForceLogout = () => {
      setUserAuth({ access_token: null });
    };

    return () => {
      api._onTokenRefreshed = null;
      api._onForceLogout = null;
    };
  }, []);

  return (
    <UserContext.Provider value={{ userAuth, setUserAuth }}>
      <Routes>
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor/:blog_id" element={<Editor />} />
        <Route path="/" element={<Navbar />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<SideNav />}>
            <Route path="blogs" element={<ManageBlogs />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route path="settings" element={<SideNav />}>
            <Route path="edit-profile" element={< EditProfile/> } />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
          <Route path="signin" element={<UserAuthForm type="signin" />}></Route>
          <Route path="signup" element={<UserAuthForm type="signup" />}></Route>
          <Route path="search/:query" element={<SearchPage />} />
          <Route path="user/:id" element={<ProfilePage />} />
          <Route path="blog/:blog_id" element={<BlogPage />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </UserContext.Provider>
  );
};

export default App;


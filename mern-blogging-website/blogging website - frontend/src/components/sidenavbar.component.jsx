import { useContext, useState, useRef, useEffect } from "react";
import { Outlet, Navigate, NavLink, useLocation } from "react-router-dom";
import { UserContext } from "../App";

const SideNav = () => {
  let { userAuth } = useContext(UserContext);
  let { access_token, new_notification_available } = userAuth || {};


  let location = useLocation();
  let page = location.pathname.split("/")[2] || location.pathname.split("/")[1];

  let [pageState, setPageState] = useState(page.replace("-", " "));
  let [showSideNav, setShowSideNav] = useState(false);

  let activeTabLineRef = useRef();
  let sideBarTabRef = useRef();
  let pageStateTabRef = useRef();

  const changePageState = (e) => {
    let { offsetWidth, offsetLeft } = e.target;

    if (activeTabLineRef.current) {
      activeTabLineRef.current.style.width = offsetWidth + "px";
      activeTabLineRef.current.style.left = offsetLeft + "px";
    }

    if (e.target === sideBarTabRef.current) {
      setShowSideNav(true);
    } else {
      setShowSideNav(false);
    }
  };

  useEffect(() => {
    setShowSideNav(false);
    if (pageStateTabRef.current) {
      pageStateTabRef.current.click();
    }
  }, [pageState]);

  useEffect(() => {
    let p = location.pathname.split("/")[2] || location.pathname.split("/")[1];
    setPageState(p.replace("-", " "));
  }, [location.pathname]);

  return access_token === null ? (
    <Navigate to="/signin" />
  ) : (
    <>
      <section className="relative flex gap-10 py-0 m-0 max-md:flex-col">
                  <div className="sticky top-[80px] z-30">
                      
          <div className="md:hidden bg-white py-1 border-b border-grey flex flex-nowrap overflow-x-auto relative">
            <button
              ref={pageStateTabRef}
              className="p-4 capitalize"
              onClick={changePageState}
            >
              {pageState}
            </button>
            <button
              ref={sideBarTabRef}
              className="p-4 capitalize"
              onClick={changePageState}
            >
              Sidebar
            </button>
            <hr
              ref={activeTabLineRef}
              className="absolute bottom-0 duration-300 border-dark-grey border-b-2"
            />
          </div>

          <div
            className={
              "min-w-[200px] h-[calc(100vh-80px)] md:sticky top-24 overflow-y-auto p-6 md:pr-0 md:border-r border-grey absolute max-md:top-[64px] bg-white max-md:w-[calc(100%+80px)] max-md:-ml-16 max-md:px-16 duration-500 " +
              (!showSideNav
                ? "max-md:opacity-0 max-md:pointer-events-none"
                : "opacity-100 pointer-events-auto")
            }
          >
            <h1 className="text-xl text-dark-grey mb-3">Dashboard</h1>
            <hr className="border-grey -ml-6 mb-8 mr-6" />

            <NavLink
              to="/dashboard/blogs"
              onClick={(e) => setPageState(e.target.innerText)}
              className="sidebar-link"
            >
              <i className="fi fi-rr-document"></i>
              Blogs
            </NavLink>

            <NavLink
              to="/dashboard/notifications"
              onClick={(e) => setPageState(e.target.innerText)}
              className="sidebar-link"
            >
              <div className="relative">
                <i className="fi fi-rr-bell"></i>
                {new_notification_available ? (
                  <span className="bg-red w-2 h-2 rounded-full absolute z-10 top-0 right-0"></span>
                ) : (
                  ""
                )}
              </div>
              Notifications
            </NavLink>

            <NavLink
              to="/editor"
              onClick={(e) => setPageState(e.target.innerText)}
              className="sidebar-link"
            >
              <i className="fi fi-rr-file-edit"></i>
              Write
            </NavLink>

            <h1 className="text-xl text-dark-grey mt-20 mb-3">Settings</h1>
            <hr className="border-grey -ml-6 mb-8 mr-6" />

            <NavLink
              to="/settings/edit-profile"
              onClick={(e) => setPageState(e.target.innerText)}
              className="sidebar-link"
            >
              <i className="fi fi-rr-user"></i>
              Edit Profile
            </NavLink>

            <NavLink
              to="/settings/change-password"
              onClick={(e) => setPageState(e.target.innerText)}
              className="sidebar-link"
            >
              <i className="fi fi-rr-lock"></i>
              Change Password
            </NavLink>
          </div>
        </div>

        <div className="max-md:-mt-8 mt-5 w-full">
          <Outlet />
        </div>
      </section>
    </>
  );
};

export default SideNav;

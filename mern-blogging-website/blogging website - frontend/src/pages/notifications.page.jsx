import { useState, useContext, useEffect } from "react";
import api from "../common/api";
import { UserContext } from "../App";
import { filterPaginationData } from "../common/filter-pagination-data";
import Loader from "../components/loader.component";
import NoDataMessage from "../components/nodata.component";
import AnimationWrapper from "../common/page-animation";
import NotificationCard from "../components/notification-card.component";
import LoadMoreDataBtn from "../components/load-more.component";

const Notifications = () => {
  let {
    userAuth,
    userAuth: { access_token, new_notification_available },
    setUserAuth,
  } = useContext(UserContext);

  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState(null);

  let filters = ["all", "like", "comment", "reply"];

  const fetchNotifications = async ({ page, deletedDocCount = 0 }) => {
    try {
      const {
        data: { notifications: data },
      } = await api.post(
        import.meta.env.VITE_BACKEND_URL + "/user/notifications",
        { page, filter, deletedDocCount },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      if (new_notification_available) {
        setUserAuth((prev) => ({ ...prev, new_notification_available: false }));
      }

      let formatedData = await filterPaginationData({
        state: notifications,
        data,
        page,
        countRoute: "/user/all-notifications-count",
        data_to_send: { filter },
        user: access_token,
      });

      setNotifications(formatedData);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (access_token) {
      fetchNotifications({ page: 1 });
    }
  }, [access_token, filter]);

  const handleFilter = (filterName) => {
    if (filter === filterName) return;
    setFilter(filterName);
    setNotifications(null);
  };

  return (
    <AnimationWrapper>
      <h1 className="max-md:hidden text-2xl font-medium">
        Recent Notifications
      </h1>

      <div className="my-8 flex gap-6 border-b border-grey pb-4 overflow-x-auto">
        {filters.map((filterName, i) => {
          return (
            <button
              key={i}
              className={
                "py-2 px-5 rounded-full capitalize " +
                (filter === filterName ? "bg-black text-white" : "bg-grey")
              }
              onClick={() => handleFilter(filterName)}>
              {filterName}
            </button>
          );
        })}
      </div>

      {notifications === null ? (
        <Loader />
      ) : (
        <>
          {notifications.results.length ? (
            notifications.results.map((notification, i) => {
              return (
                <AnimationWrapper key={i} transition={{ delay: i * 0.08 }}>
                  <NotificationCard
                    data={notification}
                    index={i}
                    notificationState={{ notifications, setNotifications }}
                  />
                </AnimationWrapper>
              );
            })
          ) : (
            <NoDataMessage message="Nothing available" />
          )}

          <LoadMoreDataBtn
            state={notifications}
            fetchDataFun={fetchNotifications}
            additionalParam={{ deletedDocCount: notifications.deletedDocCount }}
          />
        </>
      )}
    </AnimationWrapper>
  );
};

export default Notifications;

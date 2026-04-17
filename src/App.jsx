import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { apiClient } from "./services/tmdb";
import { setBannerData, setImageURL } from "./store/movieSlice";

import AppRoutes from "./Routes/AppRoutes";
import ToastContainer from './components/UI/ToastContainer';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        const [{ data: trendingData }, { data: configData }] =
          await Promise.all([
            apiClient.get("/trending/all/week", { signal: controller.signal }),
            apiClient.get("/configuration", { signal: controller.signal }),
          ]);

        // Trending
        if (trendingData && Array.isArray(trendingData.results)) {
          const validResults = trendingData.results
            .filter((item) => item && item.id && (item.title || item.name))
            .slice(0, 20);
          dispatch(setBannerData(validResults));
        } else {
          dispatch(setBannerData([]));
        }

        // Configuration
        if (configData?.images?.secure_base_url) {
          const imageUrl = `${configData.images.secure_base_url}original`;
          dispatch(setImageURL(imageUrl));
        } else {
          dispatch(setImageURL("https://image.tmdb.org/t/p/original"));
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          // aborted - ignore
          return;
        }
        console.error("Error fetching app initial data:", err);
        dispatch(setBannerData([]));
        dispatch(setImageURL("https://image.tmdb.org/t/p/original"));
      }
    };

    run();

    return () => controller.abort();
  }, [dispatch]);

  return (
    <>
      <AppRoutes />
      <ToastContainer />
    </>
  );
}

export default App;

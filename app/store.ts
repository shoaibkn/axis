import { configureStore } from "@reduxjs/toolkit";
import breadCrumbReducer from "../features/breadcrumb/breadcrumbSlice";

export default configureStore({
  reducer: {
    breadcrumbs: breadCrumbReducer,
  },
});

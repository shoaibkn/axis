import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [{ title: "Dashboard", path: "/dashboard" }],
};

export const breadcrumbSlice = createSlice({
  name: "breadcrumb",
  initialState,
  reducers: {
    updatePaths: (state, action) => {
      state.items = action.payload;
    },
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.path !== action.payload);
    },
  },
});

export const { updatePaths } = breadcrumbSlice.actions;

export default breadcrumbSlice.reducer;

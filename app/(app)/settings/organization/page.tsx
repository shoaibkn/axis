"use client";

import { updatePaths } from "@/features/breadcrumb/breadcrumbSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function OrganizationPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      updatePaths([
        { title: "Settings", path: "/settings" },
        { title: "Organization", path: "/settings/organization" },
      ]),
    );
  }, [dispatch]);

  return (
    <div>
      <h1>Organization Settings</h1>
      {/* Add organization settings content here */}
    </div>
  );
}

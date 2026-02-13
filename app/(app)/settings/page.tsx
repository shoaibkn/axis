"use client";
import { updatePaths } from "@/features/breadcrumb/breadcrumbSlice";
import Link from "next/link";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function SettingsPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(updatePaths([{ title: "Settings", path: "/settings" }]));
  }, [dispatch]);

  return (
    <div>
      <h1>Settings</h1>
      <Link href="/settings/organization">Organization</Link>
    </div>
  );
}

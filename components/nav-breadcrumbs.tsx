"use client";
import { useSelector } from "react-redux";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Fragment, useEffect } from "react";
import Link from "next/link";

export default function NavBreadcrumbs() {
  const breads = useSelector((state) => state.breadcrumbs).items;

  useEffect(() => {
    console.log(breads);
  }, [breads]);
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breads.map((bread: { title: string; path: string }, index: number) => (
          <Fragment key={index}>
            {index === breads.length - 1 ? (
              <BreadcrumbItem>
                <BreadcrumbPage>{bread.title}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <Link href={bread.path}>{bread.title}</Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

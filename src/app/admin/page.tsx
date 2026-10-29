import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal — UFK Tools",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRootPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/dashboard");
  } else {
    redirect("/admin/login");
  }
}

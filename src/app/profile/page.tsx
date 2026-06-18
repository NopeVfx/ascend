import { ProfileSettings } from "@/components/profile/ProfileSettings";

export const metadata = {
  title: "Profile — Ascend",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-6">
        <h1 className="text-3xl font-black uppercase-wide md:text-4xl">Profile</h1>
        <p className="mt-2 text-sm text-muted">
          Manage your identity, appearance, security, and friends.
        </p>
      </header>
      <ProfileSettings />
    </div>
  );
}

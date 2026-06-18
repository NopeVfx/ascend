import { MeetingRoom } from "@/components/meeting/MeetingRoom";

export const metadata = {
  title: "Meeting Room — Ascend",
};

export default function MeetingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-6">
        <h1 className="text-3xl font-black uppercase-wide md:text-4xl">
          Meeting Room
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Get paired with a random peer for live advice. Skip with{" "}
          <span className="text-foreground">Next</span>, leave with{" "}
          <span className="text-foreground">Stop</span>. Be respectful.
        </p>
      </header>
      <MeetingRoom />
    </div>
  );
}

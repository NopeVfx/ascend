"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { initialsFromName } from "@/lib/utils";
import type { Friendship } from "@/lib/types";

interface PersonRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface RequestView {
  friendshipId: string;
  person: PersonRow;
}

async function loadPeople(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, PersonRow>> {
  const map = new Map<string, PersonRow>();
  if (!ids.length) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", ids);
  (data as PersonRow[] | null)?.forEach((p) => map.set(p.id, p));
  return map;
}

export function Friends({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const [incoming, setIncoming] = useState<RequestView[]>([]);
  const [friends, setFriends] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data: pendingRaw } = await supabase
        .from("friendships")
        .select("*")
        .eq("addressee_id", userId)
        .eq("status", "pending");
      const pending = (pendingRaw as Friendship[] | null) ?? [];

      const { data: acceptedRaw } = await supabase
        .from("friendships")
        .select("*")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq("status", "accepted");
      const accepted = (acceptedRaw as Friendship[] | null) ?? [];

      const ids = new Set<string>();
      pending.forEach((f) => ids.add(f.requester_id));
      accepted.forEach((f) =>
        ids.add(f.requester_id === userId ? f.addressee_id : f.requester_id),
      );
      const people = await loadPeople(supabase, [...ids]);
      if (cancelled) return;

      setIncoming(
        pending.map((f) => ({
          friendshipId: f.id,
          person: people.get(f.requester_id) ?? {
            id: f.requester_id,
            username: null,
            avatar_url: null,
          },
        })),
      );
      setFriends(
        accepted.map((f) => {
          const otherId =
            f.requester_id === userId ? f.addressee_id : f.requester_id;
          return (
            people.get(otherId) ?? {
              id: otherId,
              username: null,
              avatar_url: null,
            }
          );
        }),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, version]);

  async function respond(id: string, status: "accepted" | "declined") {
    await supabase.from("friendships").update({ status }).eq("id", id);
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold uppercase-wide text-muted">
          Friend requests
        </h3>
        {loading ? (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        ) : incoming.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No pending requests.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {incoming.map((r) => (
              <li
                key={r.friendshipId}
                className="flex items-center justify-between rounded-2xl border-2 border-border p-3 glow-border"
              >
                <span className="flex items-center gap-3 text-sm font-bold">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-surface-2 text-xs">
                    {initialsFromName(r.person.username)}
                  </span>
                  {r.person.username ?? "Anonymous"}
                </span>
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    variant="lime"
                    onClick={() => respond(r.friendshipId, "accepted")}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => respond(r.friendshipId, "declined")}
                  >
                    <X size={14} />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase-wide text-muted">
          Friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No friends yet — add people from the Meeting Room.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-2xl border-2 border-border px-4 py-3 text-sm font-bold glow-border"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-border bg-surface-2 text-xs">
                  {initialsFromName(f.username)}
                </span>
                {f.username ?? "Anonymous"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/admin";
import { connectRealtime } from "../api/realtime";
import { useAuth } from "../auth/AuthContext";
import type { AsyncOperation } from "../types/api";

function formatOperationData(data: Record<string, unknown>) {
  const entries = Object.entries(data);
  if (!entries.length) return "-";
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(", ");
}

export function AdminOperationsPage() {
  const { user } = useAuth();
  const [operations, setOperations] = useState<AsyncOperation[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [seconds, setSeconds] = useState(10);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const sortedOperations = useMemo(
    () =>
      [...operations].sort((a, b) => {
        const aDate = a.completed_at || a.created_at;
        const bDate = b.completed_at || b.created_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      }),
    [operations],
  );

  const upsertOperation = (operation: AsyncOperation) => {
    setOperations((current) => {
      const exists = current.some((item) => item.id === operation.id);
      return exists ? current.map((item) => (item.id === operation.id ? operation : item)) : [operation, ...current];
    });
  };

  const load = async () => {
    try {
      const data = await adminApi.asyncOperations();
      setOperations(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load operations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.is_staff) {
      setLoading(false);
      return;
    }
    void load();
  }, [user?.is_staff]);

  useEffect(() => {
    if (!user?.is_staff) {
      return;
    }
    const socket = connectRealtime("/ws/admin/async-operations/");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "snapshot" }));
    };
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as
          | { type: "async_operations_snapshot"; operations: AsyncOperation[] }
          | { type: "async_operation_completed"; operation: AsyncOperation };
        if (payload.type === "async_operations_snapshot") {
          setOperations(payload.operations);
        }
        if (payload.type === "async_operation_completed") {
          upsertOperation(payload.operation);
        }
      } catch {
        // Ignore malformed messages
      }
    };
    return () => {
      socket.close();
    };
  }, [user?.is_staff]);

  const startEmail = async (group: "staff" | "non_staff") => {
    setSubmitting(true);
    setNotice("");
    try {
      const operation = await adminApi.sendGroupEmail({ group, subject, message });
      upsertOperation(operation);
      setNotice("Email operation queued.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue email operation");
    } finally {
      setSubmitting(false);
    }
  };

  const startLongOP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    try {
      const operation = await adminApi.runForumLongOP({ seconds });
      upsertOperation(operation);
      setNotice("Long operation queued.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue operation");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user?.is_staff) {
    return <p className="text-red-600">Admin access required.</p>;
  }

  if (loading) {
    return <p>Loading operations...</p>;
  }

  return (
    <div className="space-y-5">

      <section className="grid gap-4 md:grid-cols-2">
        <form className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Email notifications</h2>
          <label className="block text-sm font-medium text-slate-700">
            Subject
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Message
            <textarea
              className="mt-1 min-h-28 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="button" disabled={submitting} onClick={() => void startEmail("non_staff")}>
              Send to users
            </button>
            <button className="btn btn-warn" type="button" disabled={submitting} onClick={() => void startEmail("staff")}>
              Send to staff
            </button>
          </div>
        </form>

        <form className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow-sm" onSubmit={startLongOP}>
          <h2 className="text-lg font-semibold">Forum operation</h2>
          <label className="block text-sm font-medium text-slate-700">
            Duration, seconds
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              max={120}
              min={1}
              type="number"
              value={seconds}
              onChange={(event) => setSeconds(Number(event.target.value))}
            />
          </label>
          <button className="btn btn-primary" disabled={submitting} type="submit">
            Run operation
          </button>
        </form>
      </section>

      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3">OP name</th>
              <th className="px-4 py-3">OP info</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Date/finish time</th>
            </tr>
          </thead>
          <tbody>
            {sortedOperations.length ? (
              sortedOperations.map((operation) => (
                <tr key={operation.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 font-medium">{operation.name}</td>
                  <td className="px-4 py-3 text-slate-700">{formatOperationData(operation.data)}</td>
                  <td className="px-4 py-3 text-slate-700">{operation.result || operation.status}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {operation.completed_at ? new Date(operation.completed_at).toLocaleString() : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-slate-600" colSpan={4}>
                  No operations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

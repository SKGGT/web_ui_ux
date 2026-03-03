import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    gender: "male",
    birth_date: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsRegistering(true);
    try {
      await register({
        ...form,
        gender: form.gender as "male" | "female" | "prefer_not_to_say",
      });
      navigate("/discussions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Register</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <input className="w-full rounded border border-slate-300 px-3 py-2" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
        <select className="w-full rounded border border-slate-300 px-3 py-2" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
        <input className="w-full rounded border border-slate-300 px-3 py-2" type="date" value={form.birth_date} onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))} required />
        <input className="w-full rounded border border-slate-300 px-3 py-2" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={8} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="btn btn-primary w-full" type="submit" disabled={isRegistering}>
          {isRegistering ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating account...
            </>
          ) : (
            "Register"
          )}
        </button>
      </form>
    </section>
  );
}

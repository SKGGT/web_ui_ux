import type { UserProfile } from "../types/api";

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  prefer_not_to_say: "Prefer not to say",
};

export function ProfileCard({ profile }: { profile: UserProfile }) {
  return (
    <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{profile.name}</h1>
      <dl className="mt-4 space-y-2 text-sm text-slate-700">
        <div><dt className="font-medium">Email</dt><dd>{profile.email ?? "Hidden"}</dd></div>
        <div><dt className="font-medium">Gender</dt><dd>{profile.gender ? GENDER_LABELS[profile.gender] || profile.gender : "Hidden"}</dd></div>
        <div><dt className="font-medium">Date of Birth</dt><dd>{profile.birth_date ?? "Hidden"}</dd></div>
        <div><dt className="font-medium">Joined</dt><dd>{new Date(profile.date_joined).toLocaleString()}</dd></div>
      </dl>
    </section>
  );
}

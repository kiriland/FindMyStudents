export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-blue-900">
          Find My Students
        </h1>

        <p className="mt-3 text-lg text-gray-600">
          Connect with Baruch students for tutoring, study groups,
          and skill sharing.
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Find a Study Partner
          </h2>

          <input
            type="text"
            placeholder="Search by course or skill..."
            className="mt-4 w-full rounded-lg border border-gray-300 p-3"
          />

          <button
            type="button"
            className="mt-4 rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white"
          >
            Search Students
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getJobs } from "../api/jobs";

export default function JobList({ refresh }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getJobs()
      .then(setJobs)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  if (loading) return <div className="text-center">Loading jobs...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;
  if (!jobs.length) return <div className="text-center">No jobs found.</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <table className="w-full border rounded shadow bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Created At</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id} className="border-t">
              <td className="p-2 font-mono text-xs">{job.id}</td>
              <td className="p-2">{job.status}</td>
              <td className="p-2">{job.createdAt?.replace("T", " ").slice(0, 19)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

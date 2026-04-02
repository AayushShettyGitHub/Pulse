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
    <div className="max-w-4xl mx-auto mt-8">
      <table className="w-full border rounded shadow bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Created At</th>
            <th className="p-2 text-left">Result</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id} className="border-t">
              <td className="p-2 font-mono text-xs">{job.id}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-sm ${job.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : job.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {job.status}
                </span>
              </td>
              <td className="p-2 text-sm">{job.createdAt?.replace("T", " ").slice(0, 19)}</td>
              <td className="p-2 text-sm text-gray-700 max-w-xs truncate" title={job.result || "N/A"}>
                {job.result || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState } from "react";
import JobForm from "../components/JobForm";
import JobList from "../components/JobList";

export default function Home() {
  const [refresh, setRefresh] = useState(0);
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">Job Service Dashboard</h1>
      <JobForm onJobCreated={() => setRefresh(r => r + 1)} />
      <JobList refresh={refresh} />
    </div>
  );
}

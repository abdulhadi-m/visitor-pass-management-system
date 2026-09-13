import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { BASE_URL } from "../config";

const AuditLogs = () => {
  const { user } = useAuthContext();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchLogs = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/logs/all`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const json = await response.json();
        if (response.ok && isMounted) {
          // De-duplicate any duplicate log entries by unique _id
          const uniqueLogsMap = new Map();
          if (Array.isArray(json)) {
            json.forEach((log) => {
              if (log && log._id && !uniqueLogsMap.has(log._id)) {
                uniqueLogsMap.set(log._id, log);
              }
            });
          }
          setLogs(Array.from(uniqueLogsMap.values()));
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching logs:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user) {
      fetchLogs();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user]);

  const exportToCSV = () => {
    let csvContent =
      "data:text/csv;charset=utf-8,Visitor Name,Visitor Email,Host Name,Guard Name,Check In,Check Out,Status\n";

    logs.forEach((log) => {
      const visitor = log.passId?.appointmentId?.visitorId;
      const host = log.passId?.appointmentId?.hostId;
      const guard = log.guardId;
      const isCheckedOut = Boolean(log.checkOut);

      const vName = visitor?.name ? `"${visitor.name}"` : "Unknown";
      const vEmail = visitor?.email ? `"${visitor.email}"` : "Unknown";
      const hName = host?.name ? `"${host.name}"` : "N/A";
      const gName = guard?.name ? `"${guard.name}"` : "Security";

      const checkIn = log.checkIn
        ? `"${new Date(log.checkIn).toLocaleString("en-GB")}"`
        : "—";
      const checkOut = log.checkOut
        ? `"${new Date(log.checkOut).toLocaleString("en-GB")}"`
        : "On Premises";
      const status = isCheckedOut ? "Checked Out" : "Checked In";

      csvContent += `${vName},${vEmail},${hName},${gName},${checkIn},${checkOut},${status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VPMS_Audit_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Audit Logs
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track visitor check-ins, check-outs, and security activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          {logs && (
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full">
              {logs.length} Total Logs
            </span>
          )}
          {logs && logs.length > 0 && (
            <button
              onClick={exportToCSV}
              className="inline-flex items-center justify-center text-white bg-emerald-600 hover:bg-emerald-700 font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Download Logs
            </button>
          )}
        </div>
      </div>

      {loading && (
        <p className="text-center py-8 text-gray-500 text-sm">
          Loading logs...
        </p>
      )}

      {!loading && logs.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 max-w-lg mx-auto">
          <p className="text-base font-semibold text-gray-800">No logs found</p>
          <p className="text-sm text-gray-500 mt-1">
            No visitor check-ins have been recorded yet.
          </p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Visitor</th>
                  <th className="px-6 py-3.5">Host</th>
                  <th className="px-6 py-3.5">Guard</th>
                  <th className="px-6 py-3.5">Check In</th>
                  <th className="px-6 py-3.5">Check Out</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => {
                  const visitor = log.passId?.appointmentId?.visitorId;
                  const host = log.passId?.appointmentId?.hostId;
                  const guard = log.guardId;
                  const isCheckedOut = Boolean(log.checkOut);

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <div>{visitor?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-400 font-normal">
                          {visitor?.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {host?.name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {host?.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {guard?.name || "Security"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.checkIn
                          ? new Date(log.checkIn).toLocaleString("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.checkOut ? (
                          new Date(log.checkOut).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        ) : (
                          <span className="text-amber-600 font-medium text-xs">
                            On Premises
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            isCheckedOut
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isCheckedOut ? "Checked Out" : "Checked In"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;

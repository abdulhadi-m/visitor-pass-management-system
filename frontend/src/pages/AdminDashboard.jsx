import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../hooks/useAuthContext";
import { useGeneratePass } from "../hooks/useGeneratePass";

const AdminDashboard = () => {
  const { user } = useAuthContext();
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const { generatePass } = useGeneratePass();

  useEffect(() => {
    const fetchAppointment = async () => {
      const response = await fetch(
        "https://visitor-pass-management-system-nq1z.onrender.com/api/appointments/pending",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );
      const json = await response.json();
      if (response.ok) {
        setPendingAppointment(json);
      }
    };
    if (user) {
      fetchAppointment();
    }
  }, [user]);

  const handleStatusUpdate = async (id, newStatus) => {
    setProcessingId(id);
    try {
      const response = await fetch(
        `https://visitor-pass-management-system-nq1z.onrender.com/api/appointments/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      
      if (response.ok) {
        // Optimistic UI update: instantly remove the card from the UI
        setPendingAppointment((prevAppointment) => {
          return prevAppointment ? prevAppointment.filter((appointment) => appointment._id !== id) : [];
        });

        if (newStatus === "Approved") {
          toast.success(
            "Pass Approved & PDF Emailed! (Note: Twilio SMS delivery is currently restricted by TRAI/DLT carrier regulations for US trial numbers).",
            { duration: 6000 }
          );
          // Trigger heavy PDF generation & email sending asynchronously in the background
          generatePass(id).catch((err) => {
            console.error("Background pass generation failed:", err);
          });
        } else {
          toast.success("Appointment rejected.");
        }
      } else {
        const json = await response.json();
        toast.error(json.error || "Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Network error while updating appointment");
    } finally {
      setProcessingId(null); 
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-gray-200 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Admin Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage pending visitor appointment requests
          </p>
        </div>
        {pendingAppointment && (
          <span className="self-start sm:self-auto text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full">
            {pendingAppointment.length} Pending{" "}
            {pendingAppointment.length === 1 ? "Request" : "Requests"}
          </span>
        )}
      </div>

      {pendingAppointment && pendingAppointment.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 max-w-lg mx-auto mt-8">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            ✓
          </div>
          <p className="text-base font-semibold text-gray-800">
            All caught up!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            There are no pending appointment requests requiring review right
            now.
          </p>
        </div>
      )}

      <div className="w-210 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingAppointment &&
          pendingAppointment.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    Pending Approval
                  </span>
                  <span className=" text-xs font-mono text-gray-400">
                    #{appointment._id.slice(-6)}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <img 
                      src={appointment.visitorId?.photo_url ? `http://localhost:5000${appointment.visitorId.photo_url}` : 'https://dummyimage.com/150x150'} 
                      alt="Visitor" 
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                    />
                    <div>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
                        Visitor Name
                      </span>
                      <p className="text-base font-bold text-gray-900">
                        {appointment.visitorId?.name || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
                      Purpose
                    </span>
                    <p className="text-sm text-gray-700">
                      {appointment.visitorId?.purpose || "Not specified"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                      Requested Time
                    </span>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(appointment.dateTime).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => handleStatusUpdate(appointment._id, "Approved")}
                  disabled={processingId === appointment._id}
                  className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer text-center ${
                    processingId === appointment._id 
                    ? 'bg-blue-300 text-white cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {processingId === appointment._id ? 'Approving...' : 'Approve'}
                </button>

                <button
                  onClick={() => handleStatusUpdate(appointment._id, "Rejected")}
                  disabled={processingId === appointment._id}
                  className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
import React, { useEffect, useState } from "react";

import toast from "react-hot-toast";

import { useAuthContext } from "../hooks/useAuthContext";
import { usePassContext } from "../hooks/usePassContext";
import VisitorForm from "../components/VisitorForm";
import AppointmentForm from "../components/AppointmentForm";

const Home = () => {
  const { passes, dispatch } = usePassContext();
  const { user } = useAuthContext();
  const [activeVisitorId, setActiveVisitorId] = useState(null);
  const [checkedInPasses, setCheckedInPasses] = useState([]);

  const handleCheckIn = async (passId) => {
    const response = await fetch(
      "https://visitor-pass-management-system-nq1z.onrender.com/api/logs/check-in",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ passId }),
      },
    );

    if (response.ok) {
      setCheckedInPasses((prev) => [...prev, passId]);
      dispatch({
        type: "UPDATE_PASS",
        payload: { _id: passId, status: "Checked In" },
      });
      toast.success("Visitor successfully checked in!");
    } else {
      const json = await response.json();
      toast.error(`Error: ${json.error}`);
    }
  };

  const handleCheckOut = async (passId) => {
    const response = await fetch(
      "https://visitor-pass-management-system-nq1z.onrender.com/api/logs/check-out",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ passId }),
      },
    );

    if (response.ok) {
      dispatch({ type: "DELETE_PASS", payload: { _id: passId } });
      toast.success("Visitor successfully checked out!");
    } else {
      const json = await response.json();
      toast.error(`Error: ${json.error}`);
    }
  };

  useEffect(() => {
    const fetchPasses = async () => {
      const response = await fetch(
        "https://visitor-pass-management-system-nq1z.onrender.com/api/passes",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );
      const json = await response.json();
      if (response.ok) {
        dispatch({ type: "SET_PASSES", payload: json });
      }
    };
    if (user) {
      fetchPasses();
    }
  }, [user, dispatch]);

  const handleOpenPDF = (pdfDataUrl) => {
    const base64Data = pdfDataUrl.split(",")[1];

    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 w-full">
      {/* Top Welcome / Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Visitor Pass Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor active visitor passes, register new visitors, and schedule
            appointments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl text-center min-w-27.5">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Passes
            </span>
            <span className="text-xl font-bold text-blue-600">
              {passes ? passes.length : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Active Passes Section */}
        <div className="flex-1 w-full lg:w-2/3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Active Visitor Passes
            </h2>
            {passes && passes.length > 0 && (
              <span className="text-xs font-medium text-slate-500">
                Showing {passes.length}{" "}
                {passes.length === 1 ? "pass" : "passes"}
              </span>
            )}
          </div>

          {passes && passes.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                🎫
              </div>
              <p className="text-base font-semibold text-slate-800">
                No active visitor passes
              </p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Register a visitor on the right to schedule their appointment
                and generate their digital pass.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {passes &&
              passes.map((pass) => (
                <div
                  key={pass._id}
                  className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 border border-slate-200/80 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Approved
                      </span>
                      <span
                        className="text-xs font-mono text-slate-400 truncate max-w-60"
                        title={pass.appointmentId}
                      >
                        Ref: {pass.appointmentId}
                      </span>
                    </div>

                    <div className="flex items-center justify-center p-3 bg-slate-50/90 rounded-xl border border-slate-100 mb-4">
                      <img
                        src={pass.qrCode}
                        alt="Visitor QR Code"
                        className="w-32 h-32 object-contain "
                      />
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 mb-5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-slate-500 font-medium">
                          Valid Until:
                        </span>
                        <span className="font-semibold text-slate-800 text-right">
                          {new Date(pass.validUntil).toLocaleString("en-GB", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm pt-1 border-t border-slate-200/50">
                        <span className="text-slate-500 font-medium">
                          Issued On:
                        </span>
                        <span className="text-slate-700 font-medium">
                          {new Date(pass.createdAt).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenPDF(pass.pdfUrl)}
                    className="w-full inline-flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 font-medium text-sm py-2.5 px-4 rounded-xl shadow-xs transition-colors text-center cursor-pointer"
                  >
                    View Pass PDF
                  </button>

                  {/* Check-In / Check-Out Buttons */}
                  <div className="flex gap-3.5 mt-4">
                    <button
                      onClick={() => handleCheckIn(pass._id)}
                      disabled={pass.status === "Checked In"}
                      className={`flex-1 font-semibold text-sm py-2 px-3 rounded-lg border transition-colors ${
                        pass.status === "Checked In"
                          ? "bg-white text-emerald-500 border-emerald-100 cursor-not-allowed"
                          : "bg-white hover:bg-emerald-200 text-emerald-700 border-emerald-200 cursor-pointer"
                      }`}
                    >
                      {pass.status === "Checked In" ? "Checked In" : "Check In"}
                    </button>

                    <button
                      onClick={() => handleCheckOut(pass._id)}
                      className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-sm py-2 px-3 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                    >
                      Check Out
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Action / Form Section */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 sticky top-24 border-t-4 border-t-blue-600">
            {!activeVisitorId ? (
              <VisitorForm onSuccess={(id) => setActiveVisitorId(id)} />
            ) : (
              <AppointmentForm
                visitorId={activeVisitorId}
                onComplete={() => setActiveVisitorId(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

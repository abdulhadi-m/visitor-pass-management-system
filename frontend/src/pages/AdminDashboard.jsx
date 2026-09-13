import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { QrReader } from "react-qr-reader";
import { useAuthContext } from "../hooks/useAuthContext";
import { usePassContext } from "../hooks/usePassContext";
import { useGeneratePass } from "../hooks/useGeneratePass";

const AdminDashboard = () => {
  const { user } = useAuthContext();
  const { passes, dispatch } = usePassContext();
  const { generatePass } = useGeneratePass();

  const userRole = user?.role?.toLowerCase();
  const isSecurity = userRole?.includes("security");
  const canApprove = Boolean(
    user &&
    !isSecurity &&
    (userRole === "admin" || userRole === "host" || userRole === "employee"),
  );

  const [activeTab, setActiveTab] = useState(canApprove ? "pending" : "active");
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingPasses, setLoadingPasses] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [processingLogId, setProcessingLogId] = useState(null);

  // QR Scanner States
  const [showScanner, setShowScanner] = useState(false);
  const isScanningRef = useRef(false);

  // Fetch Pending Requests (Admin/Host only)
  const fetchPending = async () => {
    if (!user || !canApprove) return;
    setLoadingPending(true);
    try {
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
        setPendingAppointments(json);
      }
    } catch (err) {
      console.error("Error fetching pending appointments:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  // Fetch Active / Approved Passes
  const fetchPasses = async () => {
    if (!user) return;
    setLoadingPasses(true);
    try {
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
    } catch (err) {
      console.error("Error fetching passes:", err);
    } finally {
      setLoadingPasses(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (!canApprove) {
        setActiveTab("active");
      }
      if (canApprove) {
        fetchPending();
      }
      fetchPasses();
    }
  }, [user, canApprove]);

  // Clean up camera stream
  const stopCameraTracks = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (!showScanner) {
      stopCameraTracks();
      const timer = setTimeout(stopCameraTracks, 150);
      return () => clearTimeout(timer);
    }
  }, [showScanner]);

  const openScanner = () => {
    isScanningRef.current = false;
    setShowScanner(true);
  };

  const closeScanner = () => {
    stopCameraTracks();
    setShowScanner(false);
    // Keep isScanningRef.current = true so trailing video frames during unmount cannot trigger duplicate check-ins
    isScanningRef.current = true;
  };

  // Status Update & Pass Generation Trigger
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
        // Optimistically remove from pending list
        setPendingAppointments((prev) =>
          prev.filter((appointment) => appointment._id !== id),
        );

        if (newStatus === "Approved") {
          toast.success(
            "Pass Approved & PDF Emailed! (Twilio SMS triggered for verified numbers)",
            { duration: 5000 },
          );

          generatePass(id)
            .then(() => {
              fetchPasses();
            })
            .catch((err) => {
              console.error("Background pass generation error:", err);
            });
        } else {
          toast.success("Appointment request rejected.");
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

  const handleCheckIn = async (passId) => {
    if (!passId || processingLogId === passId) return;
    setProcessingLogId(passId);
    try {
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
        dispatch({
          type: "UPDATE_PASS",
          payload: { _id: passId, status: "Checked In" },
        });
        toast.success("Visitor successfully checked in!");
      } else {
        const json = await response.json();
        if (!json.error?.includes("already")) {
          toast.error(`Error: ${json.error}`);
        }
      }
    } catch (err) {
      toast.error("Failed to process check-in");
    } finally {
      setProcessingLogId(null);
    }
  };

  const handleCheckOut = async (passId) => {
    if (!passId || processingLogId === passId) return;
    setProcessingLogId(passId);
    try {
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
    } catch (err) {
      toast.error("Failed to process check-out");
    } finally {
      setProcessingLogId(null);
    }
  };

  const handleOpenPDF = (pdfDataUrl) => {
    if (!pdfDataUrl) return;
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

  const handleDownloadFile = (dataUrl, filename) => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} saved!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">
                  Scan QR Code
                </h3>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <button
                onClick={closeScanner}
                className="text-slate-400 hover:text-rose-500 font-bold text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black border-2 border-slate-100">
              <QrReader
                key={showScanner ? "scanner-on" : "scanner-off"}
                onResult={(result) => {
                  if (!!result && !isScanningRef.current) {
                    isScanningRef.current = true;
                    try {
                      let scannedId = result?.text;
                      try {
                        const parsed = JSON.parse(scannedId);
                        if (parsed.appointmentId)
                          scannedId = parsed.appointmentId;
                      } catch (e) {}

                      const matched = passes?.find((p) => {
                        const appId =
                          typeof p.appointmentId === "object"
                            ? p.appointmentId?._id
                            : p.appointmentId;
                        return appId === scannedId || p._id === scannedId;
                      });

                      if (matched) {
                        handleCheckIn(matched._id);
                      } else {
                        toast.error(
                          "No active pass matches the scanned QR code",
                        );
                      }
                    } catch (scanErr) {
                      toast.error("Error reading QR data");
                    }
                    closeScanner();
                  }
                }}
                constraints={{ facingMode: "environment" }}
                style={{ width: "100%" }}
              />
            </div>
            <p className="text-center text-xs font-medium text-slate-500 mt-4 uppercase tracking-widest">
              Align Visitor Pass QR in front of camera
            </p>
            <p className="text-center text-xs font-medium text-slate-500 mt-4 uppercase tracking-widest">
              The screen stays black!
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {canApprove ? "Visitor Pass Management" : "Visitor Pass Management"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {canApprove
              ? "Review pending visitor requests."
              : "Scan visitor passes, verify gate access, and track real-time visitor check-ins and check-outs."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openScanner}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            Scan Pass
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-slate-200 mb-6">
        {canApprove && (
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "pending"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Pending Approvals</span>
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingAppointments.length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "active"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>
            {canApprove ? "Approved & Active Passes" : "Active Passes"}
          </span>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
            {passes ? passes.length : 0}
          </span>
        </button>
      </div>

      {canApprove && activeTab === "pending" && (
        <div>
          {loadingPending ? (
            <div className="text-center py-12 text-slate-400">
              Loading pending requests...
            </div>
          ) : pendingAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                ✓
              </div>
              <p className="text-base font-semibold text-slate-800">
                All caught up!
              </p>
              <p className="text-sm text-slate-500 mt-1">
                There are no pending visitor requests awaiting approval.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingAppointments.map((appointment) => {
                const visitor = appointment.visitorId;
                const photoSrc = visitor?.photo_url
                  ? visitor.photo_url.startsWith("http")
                    ? visitor.photo_url
                    : `https://visitor-pass-management-system-nq1z.onrender.com${visitor.photo_url}`
                  : "https://dummyimage.com/150x150";

                const hostDisplay =
                  appointment.hostName ||
                  appointment.hostId?.name ||
                  "Security Desk";

                return (
                  <div
                    key={appointment._id}
                    className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center gap-3.5 mb-4">
                        <img
                          src={photoSrc}
                          alt={visitor?.name || "Visitor"}
                          className="w-14 h-14 rounded-full object-cover border-2 border-blue-100 shadow-xs"
                          onError={(e) => {
                            e.target.src = "https://dummyimage.com/150x150";
                          }}
                        />
                        <div className="overflow-hidden">
                          <p className="text-base font-bold text-slate-900 truncate">
                            {visitor?.name || "Visitor"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {visitor?.email}
                          </p>
                          <p className="text-xs text-slate-500">
                            {visitor?.phone}
                          </p>
                        </div>
                      </div>

                      {/* Visit Details Box */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">
                            Host:
                          </span>
                          <span className="font-semibold text-blue-900">
                            {hostDisplay}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">
                            Purpose:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {appointment.purpose ||
                              visitor?.purpose ||
                              "Official Visit"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">
                            Scheduled:
                          </span>
                          <span className="text-slate-700">
                            {new Date(appointment.dateTime).toLocaleDateString(
                              [],
                              {
                                dateStyle: "medium",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() =>
                          handleStatusUpdate(appointment._id, "Approved")
                        }
                        disabled={processingId === appointment._id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        {processingId === appointment._id
                          ? "Approving..."
                          : "Approve"}
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate(appointment._id, "Rejected")
                        }
                        disabled={processingId === appointment._id}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors cursor-pointer border border-rose-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "active" && (
        <div>
          {loadingPasses ? (
            <div className="text-center py-12 text-slate-400">
              Loading active passes...
            </div>
          ) : !passes || passes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                🎫
              </div>
              <p className="text-base font-semibold text-slate-800">
                No active visitor passes
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Approve pending requests.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {passes.map((pass) => {
                const visitor = pass.appointmentId?.visitorId || pass.visitorId;
                const host =
                  pass.hostName ||
                  pass.appointmentId?.hostName ||
                  pass.appointmentId?.hostId?.name ||
                  "Security Desk";
                const purpose =
                  pass.purpose ||
                  pass.appointmentId?.purpose ||
                  visitor?.purpose ||
                  "Official Visit";

                const photoSrc = visitor?.photo_url
                  ? visitor.photo_url.startsWith("http")
                    ? visitor.photo_url
                    : `https://visitor-pass-management-system-nq1z.onrender.com${visitor.photo_url}`
                  : "https://dummyimage.com/150x150";

                return (
                  <div
                    key={pass._id}
                    className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            pass.status === "Checked In"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {pass.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(pass.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={photoSrc}
                          alt={visitor?.name || "Visitor"}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200"
                          onError={(e) => {
                            e.target.src = "https://dummyimage.com/150x150";
                          }}
                        />
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {visitor?.name || "Visitor"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {visitor?.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3">
                        <img
                          src={pass.qrCode}
                          alt="QR Pass"
                          className="w-28 h-28 object-contain mb-1"
                        />
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          QR
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 mb-3">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">
                            Host:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {host}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">
                            Purpose:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {purpose}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">
                            Valid Until:
                          </span>
                          <span className="font-semibold text-rose-700">
                            {new Date(pass.validUntil).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        onClick={() => handleOpenPDF(pass.pdfUrl)}
                        className="text-center text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold text-xs py-1.5 rounded-lg transition-colors cursor-pointer border border-blue-200"
                      >
                        View PDF
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadFile(
                            pass.pdfUrl,
                            `Visitor_Pass_${visitor?.name || "VPMS"}.pdf`,
                          )
                        }
                        className="text-center text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium text-xs py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Save PDF
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadFile(
                            pass.qrCode,
                            `QR_${visitor?.name || "VPMS"}.png`,
                          )
                        }
                        className="text-center text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium text-xs py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Save QR
                      </button>
                    </div>

                    <div className="flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => handleCheckIn(pass._id)}
                        disabled={
                          pass.status === "Checked In" ||
                          processingLogId === pass._id
                        }
                        className={`flex-1 font-semibold text-xs py-2 rounded-xl border transition-colors ${
                          pass.status === "Checked In" ||
                          processingLogId === pass._id
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer shadow-xs"
                        }`}
                      >
                        {processingLogId === pass._id
                          ? "Processing..."
                          : pass.status === "Checked In"
                            ? "Checked In"
                            : "Check In"}
                      </button>
                      <button
                        onClick={() => handleCheckOut(pass._id)}
                        disabled={processingLogId === pass._id}
                        className={`flex-1 font-semibold text-xs py-2 rounded-xl border border-rose-200 transition-colors shadow-xs ${
                          processingLogId === pass._id
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                        }`}
                      >
                        {processingLogId === pass._id
                          ? "Processing..."
                          : "Check Out"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../hooks/useAuthContext";
import { usePassContext } from "../hooks/usePassContext";
import VisitorForm from "../components/VisitorForm";
import AppointmentForm from "../components/AppointmentForm";

// 1. Import the new QR Reader package
import { QrReader } from "react-qr-reader";

const Home = () => {
  const { passes, dispatch } = usePassContext();
  const { user } = useAuthContext();
  const [activeVisitorId, setActiveVisitorId] = useState(null);
  const [checkedInPasses, setCheckedInPasses] = useState([]);
  
  // 2. Add state and ref lock for scanning and camera management
  const [showScanner, setShowScanner] = useState(false);
  const isScanningRef = useRef(false);

  const stopCameraTracks = () => {
    const videoElements = document.querySelectorAll("video");
    videoElements.forEach((video) => {
      if (video.srcObject && typeof video.srcObject.getTracks === "function") {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
      video.srcObject = null;
    });
  };

  const openScanner = () => {
    isScanningRef.current = false;
    setShowScanner(true);
  };

  const closeScanner = () => {
    stopCameraTracks();
    setShowScanner(false);
    isScanningRef.current = false;
  };

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
      }
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
      // Only show error if it's not a duplicate scan
      if (!json.error.includes("already")) {
         toast.error(`Error: ${json.error}`);
      }
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
      }
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
        }
      );
      const json = await response.json();
      if (response.ok) {
        console.log("RAW PASSES DATA:", json);
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

  const handleDownloadFile = (dataUrl, filename) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} downloaded successfully!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 w-full relative">
      
      {/* 3. The Camera Modal (Sits on top of the whole page when active) */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">Scan QR Code</h3>
                <span className="relative flex h-2.5 w-2.5" title="Camera Active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">Active</span>
              </div>
              <button 
                onClick={closeScanner}
                className="text-slate-400 hover:text-rose-500 transition-colors font-bold text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="rounded-xl overflow-hidden bg-black border-2 border-slate-100 shadow-inner">
              <QrReader
                onResult={(result, error) => {
                  if (!!result && !isScanningRef.current) {
                    isScanningRef.current = true;

                    const rawText = result?.text;
                    console.log("📸 [QR Scanner] Raw Scanned Payload:", rawText);
                    console.log("📋 [QR Scanner] Current Passes in State:", passes);

                    let scannedAppointmentId = null;
                    try {
                      const parsed = JSON.parse(rawText);
                      scannedAppointmentId = parsed.appointmentId || parsed._id || parsed.id;
                    } catch (e) {
                      // Fallback if the payload is directly the ID string
                      scannedAppointmentId = rawText;
                    }

                    console.log("🔍 [QR Scanner] Extracted Appointment ID:", scannedAppointmentId);

                    const matchedPass = passes?.find((pass) => {
                      const passAppId = typeof pass.appointmentId === "object"
                        ? pass.appointmentId?._id
                        : pass.appointmentId;
                      return passAppId === scannedAppointmentId || pass._id === scannedAppointmentId;
                    });

                    if (matchedPass) {
                      console.log("✅ [QR Scanner] Matched Pass ID:", matchedPass._id);
                      handleCheckIn(matchedPass._id);
                    } else {
                      console.warn("⚠️ [QR Scanner] No matching active pass found for:", scannedAppointmentId);
                      toast.error("No active pass found for scanned QR code");
                    }

                    closeScanner();
                  }
                }}
                constraints={{ facingMode: "environment" }}
                style={{ width: "100%" }}
              />
            </div>
            <p className="text-center text-xs font-medium text-slate-500 mt-4 uppercase tracking-widest">
              Align QR Code towards the camera
            </p>
            <p className="text-center text-xs font-medium text-slate-500 mt-4 uppercase tracking-widest">
              (screen stays dark during scan)
            </p>
          </div>
        </div>
      )}

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
          
          <button 
            onClick={openScanner}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            Scan Pass
          </button>

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
              passes.map((pass) => {
                const visitor = typeof pass.appointmentId === "object" && pass.appointmentId?.visitorId
                  ? pass.appointmentId.visitorId
                  : pass.visitorId;

                const appointmentRefId = typeof pass.appointmentId === "object"
                  ? pass.appointmentId?._id
                  : pass.appointmentId;

                const photoUrl = visitor?.photo_url
                  ? (visitor.photo_url.startsWith("http") ? visitor.photo_url : `http://localhost:5000${visitor.photo_url}`)
                  : 'https://dummyimage.com/150x150';
                
                return (
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
                        title={appointmentRefId}
                      >
                        Ref: {appointmentRefId ? String(appointmentRefId).slice(-6) : "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <img
                        src={photoUrl}
                        alt="Visitor"
                        onClick={() => window.open(photoUrl, "_blank")}
                        title="Click to enlarge"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 cursor-zoom-in hover:opacity-80 transition-opacity shadow-sm"
                      />
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {visitor?.name || "Unknown Visitor"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {visitor?.phone || "No phone provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-100 mb-4 shadow-sm">
                      <img
                        src={pass.qrCode}
                        alt="Visitor QR Code"
                        className="w-28 h-28 object-contain mb-1"
                      />
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Scan to Verify</span>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
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
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      onClick={() => handleOpenPDF(pass.pdfUrl)}
                      className="inline-flex items-center justify-center text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-medium text-xs py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      View PDF
                    </button>
                    <button
                      onClick={() => handleDownloadFile(pass.pdfUrl, `Visitor_Pass_${visitor?.name || 'VPMS'}.pdf`)}
                      className="inline-flex items-center justify-center text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 font-medium text-xs py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Save PDF
                    </button>
                    <button
                      onClick={() => handleDownloadFile(pass.qrCode, `QR_${visitor?.name || 'VPMS'}.png`)}
                      className="inline-flex items-center justify-center text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 font-medium text-xs py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Save QR
                    </button>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => handleCheckIn(pass._id)}
                      disabled={pass.status === "Checked In"}
                      className={`flex-1 font-semibold text-sm py-2 px-3 rounded-lg border transition-colors ${
                        pass.status === "Checked In"
                          ? "bg-white text-emerald-400 border-emerald-100 cursor-not-allowed"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer shadow-sm"
                      }`}
                    >
                      {pass.status === "Checked In" ? "Checked In" : "Check In"}
                    </button>

                    <button
                      onClick={() => handleCheckOut(pass._id)}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm py-2 px-3 rounded-lg border border-rose-200 transition-colors cursor-pointer shadow-sm"
                    >
                      Check Out
                    </button>
                  </div>
                </div>
              )})}
          </div>
        </div>

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
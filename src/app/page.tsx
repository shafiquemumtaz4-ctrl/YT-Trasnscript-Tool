"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, PlaySquare, Copy, CheckCircle2, AlertCircle, Download, FileText, File } from "lucide-react";

type TranscriptItem = {
  text: string;
  duration: number;
  offset: number;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [copied, setCopied] = useState(false);

  const formatTime = (offsetMs: number) => {
    // Some APIs return seconds, some milliseconds. Let's handle both.
    const isSeconds = offsetMs < 100000 && String(offsetMs).includes('.'); 
    const totalSeconds = isSeconds ? Math.floor(offsetMs) : Math.floor(offsetMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setTranscript([]);

    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setTranscript(data.transcript);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getVideoId = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);
      if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v") || "video";
      if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1) || "video";
    } catch {
      // ignore
    }
    return "video";
  };

  const copyToClipboard = () => {
    const textToCopy = transcript.map(item => `[${formatTime(item.offset)}] ${item.text}`).join("\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    const textToCopy = transcript.map(item => `[${formatTime(item.offset)}] ${item.text}`).join("\n\n");
    const blob = new Blob([textToCopy], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `transcript_${getVideoId(url)}.txt`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const downloadDoc = () => {
    const textToCopy = transcript.map(item => `[${formatTime(item.offset)}] ${item.text}`).join("\n\n");
    const blob = new Blob([textToCopy], { type: 'application/msword' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `transcript_${getVideoId(url)}.doc`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const downloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const textToCopy = transcript.map(item => `[${formatTime(item.offset)}] ${item.text}`).join("\n\n");
    
    // Split text to fit page width
    const splitText = doc.splitTextToSize(textToCopy, 180);
    
    let y = 15;
    for (let i = 0; i < splitText.length; i++) {
        if (y > 280) {
            doc.addPage();
            y = 15;
        }
        doc.text(splitText[i], 15, y);
        y += 7;
    }
    
    doc.save(`transcript_${getVideoId(url)}.pdf`);
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0f1117] text-white flex flex-col items-center py-20 px-4">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-3xl z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-2xl mb-6">
            <PlaySquare className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            YouTube <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Transcript</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Instantly extract the real text transcript from any YouTube video.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleFetch}
          className="w-full relative group mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative glass-panel rounded-2xl p-2 flex items-center shadow-2xl">
            <Search className="w-6 h-6 text-gray-400 ml-3 mr-2" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube link here..."
              className="flex-1 bg-transparent border-none outline-none text-lg py-3 px-2 text-white placeholder-gray-500 focus:ring-0"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get Transcript"}
            </button>
          </div>
        </motion.form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full glass-panel border-red-500/30 bg-red-500/10 text-red-200 p-4 rounded-2xl flex items-start gap-3 mb-8"
            >
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-100">Error fetching transcript</h3>
                <p className="text-sm opacity-80 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {transcript.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col gap-4"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 gap-4">
                <h2 className="text-xl font-bold text-gray-200">Transcript Result</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={downloadTxt}
                    title="Download as TXT"
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 py-2 px-3 rounded-lg"
                  >
                    <FileText className="w-4 h-4" />
                    TXT
                  </button>
                  <button
                    onClick={downloadDoc}
                    title="Download as DOC"
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 py-2 px-3 rounded-lg"
                  >
                    <File className="w-4 h-4" />
                    DOC
                  </button>
                  <button
                    onClick={downloadPdf}
                    title="Download as PDF"
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 py-2 px-3 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <div className="w-px h-5 bg-white/10 mx-1"></div>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 py-2 px-4 rounded-lg"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Full Text"}
                  </button>
                </div>
              </div>
              
              <div className="glass-panel p-6 rounded-3xl max-h-[60vh] overflow-y-auto space-y-4">
                {transcript.map((item, index) => (
                  <div key={index} className="flex gap-4 group">
                    <span className="text-xs font-mono text-purple-400/70 pt-1 shrink-0 select-none opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatTime(item.offset)}
                    </span>
                    <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

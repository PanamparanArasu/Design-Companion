"use client";

import React, { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Download, RefreshCw, Trash2, Copy, Check, Zap, Layers, FileText, HelpCircle, FileCode, PanelLeft, Pin, StickyNote, Star, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Sample Usability Data ---------------- */
const SAMPLE_NOTES = [
  "P1 | Tapped the big blue Buy button and nothing seemed to happen for about five seconds, so I tapped it three more times.",
  "P1 | I couldn't tell whether my card had actually been charged — no receipt appeared anywhere.",
  "P1 | The departure time is in tiny grey text, I had to hold the phone right up to my face.",
  "P2 | I went looking for my saved tickets under Account and they were actually under a Wallet icon I hadn't noticed.",
  "P2 | It let me pick a return sailing that was earlier than my outbound one and only complained after I paid.",
  "P2 | \"Concession fare\" — I have no idea if a student counts as that.",
  "P3 | I accidentally deleted a ticket and there was no way to get it back.",
  "P3 | The seat map kept scrolling under my finger while I was trying to pick a seat.",
  "P3 | Loading spinner ran for a long time on the timetable screen with no indication of progress.",
  "P4 | Had to type my card details again even though I bought a ticket last week on the same phone.",
  "P4 | The phone number field rejected my number because of the spaces and just said \"Invalid\".",
  "P4 | I wasn't sure if the price shown included the vehicle or just me as a passenger.",
  "P4 | Contrast on the disabled Continue button is so low I thought the app had frozen.",
  "P5 | Searched for \"Rothesay\" and got no results because the stop is listed as \"Rothesay Pier\".",
  "P5 | There's no way back from the payment screen except closing the whole app.",
  "P5 | It said \"Booking failed\" but not why, so I just tried the same thing again.",
  "P5 | The QR code screen times out and you have to re-authenticate at the gate, which is stressful.",
  "P6 | I missed that I'd selected a one-way trip until I was at the terminal.",
  "P6 | Date picker defaults to today but the first available sailing is tomorrow, which is confusing.",
  "P6 | Tiny tap targets on the passenger count stepper, I kept hitting the wrong one."
].join("\n");

const SAMPLE_ZOOM_VTT = `WEBVTT

1
00:01:15.000 --> 00:01:20.000
Participant 1 (Sarah): I tapped the big blue Buy button and nothing seemed to happen for about five seconds, so I tapped it three more times.

2
00:01:21.000 --> 00:01:24.000
Moderator: Did you get any payment confirmation on screen?

3
00:01:25.000 --> 00:01:30.000
Participant 1 (Sarah): No, I couldn't tell whether my card had actually been charged because no receipt appeared anywhere.

4
00:02:10.000 --> 00:02:15.000
Participant 2 (Alex): I went looking for my saved tickets under Account and they were actually under a Wallet icon I hadn't noticed.

5
00:02:16.000 --> 00:02:22.000
Participant 2 (Alex): It let me pick a return sailing that was earlier than my outbound one and only complained after I paid.`;

/* ---------------- Transcript Parsing Engine ---------------- */
function parseTranscriptText(content: string): string {
  let text = content.replace(/^WEBVTT.*$/gm, "");
  text = text.replace(/^\d+$/gm, "");
  text = text.replace(/\d{2}:\d{2}:\d{2}[\.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[\.,]\d{3}/g, "");
  text = text.replace(/<[^>]*>/g, "");

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const speakerMap = new Map<string, string>();
  let pCounter = 1;
  const result: string[] = [];

  const noiseRegex = /^(hello|hi|welcome|can you hear me|can you see my screen|thanks for coming|thanks for joining|let's start|thank you|okay great|sounds good|bye)$/i;

  for (const line of lines) {
    const match = line.match(/^(?:speaker\s*\d+|participant\s*\d+[\w\s\(\)]*|[A-Z][a-z0-9_\-\s\(\)]+|\w+[\s\w]*)\s*[:|]/i);
    if (match) {
      const rawSpeaker = match[0].replace(/[:|]/, "").trim();
      const speech = line.substring(match[0].length).trim();
      if (!speech || noiseRegex.test(speech)) continue;

      if (/^(moderator|interviewer|host|researcher)/i.test(rawSpeaker)) continue;

      let pid = speakerMap.get(rawSpeaker.toLowerCase());
      if (!pid) {
        const pMatch = rawSpeaker.match(/P(\d+)/i) || rawSpeaker.match(/Participant\s*(\d+)/i);
        if (pMatch) {
          pid = `P${pMatch[1]}`;
        } else {
          pid = `P${pCounter++}`;
        }
        speakerMap.set(rawSpeaker.toLowerCase(), pid);
      }

      result.push(`${pid} | ${speech}`);
    } else if (line.length > 5 && !noiseRegex.test(line)) {
      result.push(`P1 | ${line}`);
    }
  }

  return result.join("\n");
}

/* ---------------- Taxonomy & Heuristics ---------------- */
const THEMES = [
  {
    id: "status",
    name: "The system never says what it is doing",
    heuristic: "Visibility of system status",
    signals: [
      { re: /nothing (seemed to )?happen/i, w: 3 }, { re: /spinner|loading|progress/i, w: 3 },
      { re: /no indication|no feedback|didn't tell me|couldn't tell/i, w: 3 },
      { re: /frozen|froze|hung|unresponsive/i, w: 2 }, { re: /receipt|confirmation/i, w: 2 },
      { re: /times? out|timed out/i, w: 2 }, { re: /tapped .* (again|three more|twice)/i, w: 2 }
    ],
    fixes: [
      { re: /spinner|loading|progress/i, text: "Replace indeterminate spinner with determinate state (“Checking sailings — 2 of 3”)." },
      { re: /nothing (seemed to )?happen|tapped/i, text: "Put primary action into immediate pending state on tap: disable it and swap label to “Paying…”." },
      { re: /receipt|charged|confirmation/i, text: "End every payment in a persistent receipt available on screen, in wallet, and email." }
    ]
  },
  {
    id: "errors",
    name: "Errors arrive late, unexplained, and can't be undone",
    heuristic: "Error prevention, recognition & recovery",
    signals: [
      { re: /only complained after|after i paid|too late/i, w: 4 },
      { re: /no way to get it back|couldn't undo|no undo|accidentally delet/i, w: 4 },
      { re: /failed|error|rejected|invalid|declined/i, w: 3 },
      { re: /not why|didn't say why|no reason/i, w: 3 },
      { re: /tried the same thing again|tried again/i, w: 2 }
    ],
    fixes: [
      { re: /only complained after|after i paid/i, text: "Move validation forward: block impossible return sailings at selection time." },
      { re: /accidentally delet|get it back/i, text: "Make ticket deletion recoverable — soft-delete with a 10-second undo toast." },
      { re: /failed|not why|declined/i, text: "Rewrite errors to name cause & next step: “Card declined — nothing charged. Try another card.”" }
    ]
  },
  {
    id: "nav",
    name: "People can't find what they know is there",
    heuristic: "Findability, navigation & information architecture",
    signals: [
      { re: /went looking|looking for|couldn't find|where (is|are)/i, w: 4 },
      { re: /no way back|except closing|no back/i, w: 4 },
      { re: /hadn't noticed|didn't notice|missed that/i, w: 3 },
      { re: /no results|not found|searched/i, w: 3 },
      { re: /actually under|listed as/i, w: 2 }
    ],
    fixes: [
      { re: /no way back|except closing/i, text: "Give payment screen an explicit exit preserving the basket — a cancel affordance." },
      { re: /no results|searched|listed as/i, text: "Add synonym & partial matching: “Rothesay” must return “Rothesay Pier”." }
    ]
  },
  {
    id: "input",
    name: "Input controls fight the user",
    heuristic: "Flexibility, efficiency & input design",
    signals: [
      { re: /type .* again|re-?enter|again even though/i, w: 4 },
      { re: /tap targets?|too small|hitting the wrong/i, w: 3 },
      { re: /stepper|slider|picker|seat map|scroll(ing|ed)? under/i, w: 3 }
    ],
    fixes: [
      { re: /type .* again|again even though/i, text: "Offer saved payment method & platform wallet on returning devices." },
      { re: /tap targets?|too small|stepper/i, text: "Bring every interactive target to at least 44×44pt with spacing." }
    ]
  },
  {
    id: "language",
    name: "The words assume knowledge people don't have",
    heuristic: "Match between system and real world",
    signals: [
      { re: /no idea|not sure|wasn't sure|unclear|confus/i, w: 4 },
      { re: /concession|jargon|what (does|is) .* mean/i, w: 3 }
    ],
    fixes: [
      { re: /concession|no idea/i, text: "Replace category jargon with qualifying groups: “Student, over 60, or pass”." }
    ]
  },
  {
    id: "a11y",
    name: "Legibility and contrast fall below usable",
    heuristic: "Accessibility & visual clarity",
    signals: [
      { re: /tiny|small text|grey text|gray text/i, w: 4 },
      { re: /contrast|too low|couldn't read|hard to read/i, w: 4 }
    ],
    fixes: [
      { re: /tiny|grey text/i, text: "Raise departure times to largest type on row and hold body text at 16px minimum." }
    ]
  }
];

const BLOCKERS = /no way|couldn'?t|can'?t|failed|declined|accidentally delet|frozen|nothing seemed|closing the whole app|only complained after|re-?authenticate|no results|missed that|invalid|rejected|too late/i;

function parseNotes(raw: string) {
  const out: { participant: string; text: string }[] = [];
  raw.split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    const m = t.match(/^([A-Za-z0-9_.\-]{1,12})\s*[|:\t]\s*(.+)$/);
    out.push({
      participant: m ? m[1].toUpperCase() : `N${i + 1}`,
      text: m ? m[2].trim() : t,
    });
  });
  return out;
}

function classifyNote(noteText: string) {
  let best: { theme: typeof THEMES[0]; score: number } | null = null;
  THEMES.forEach((theme) => {
    let score = 0;
    theme.signals.forEach((s) => {
      if (s.re.test(noteText)) score += s.w;
    });
    if (score > 0 && (!best || score > best.score)) {
      best = { theme, score };
    }
  });
  return best;
}

export default function Page() {
  const [notesInput, setNotesInput] = useState(SAMPLE_NOTES);
  const [activeTab, setActiveTab] = useState("triage");
  const [copied, setCopied] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Layout Brief State */
  const [lScreen, setLScreen] = useState("Fare selection for a return ferry trip");
  const [lJob, setLJob] = useState("Let a commuter confirm the right fare and sailing in under 30 seconds");
  const [lWho, setLWho] = useState("Standing at a windy terminal, one hand, poor signal, often in a hurry");
  const [lCons, setLCons] = useState("Mobile first, 375pt wide. Must show: passenger count, vehicle toggle, concession fare, outbound and return sailings, total price.");
  const [lProbs, setLProbs] = useState("Users miss that they picked one-way. Price ambiguity: unclear whether vehicle included. Tap targets too small.");
  const [lCount, setLCount] = useState("4");

  /* Copy Brief State */
  const [cKind, setCKind] = useState("Error message");
  const [cWhat, setCWhat] = useState("Payment was declined by card issuer. Reason unknown. Nothing charged, held seat released after 10 mins.");
  const [cGoal, setCGoal] = useState("Buy a return ticket for 17:40 sailing before boarding");
  const [cNext, setCNext] = useState("Try a different card, or pay at terminal desk");
  const [cVoice, setCVoice] = useState("Plain, calm, practical. Public transport service. No exclamation marks, no apologies.");
  const [cLimits, setCLimits] = useState("Heading ≤ 6 words, body ≤ 25 words, button ≤ 3 words. UK English.");

  /* File Upload Handler */
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      
      if (file.name.endsWith(".vtt") || file.name.endsWith(".srt") || file.name.endsWith(".txt")) {
        const parsed = parseTranscriptText(content);
        setNotesInput(parsed);
        setUploadStatus(`Parsed ${file.name} successfully!`);
      } else {
        setNotesInput(content);
        setUploadStatus(`Loaded ${file.name}`);
      }
      setTimeout(() => setUploadStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  /* Triage Engine Calculation */
  const triageResult = useMemo(() => {
    const notes = parseNotes(notesInput);
    const buckets: Record<string, { theme: typeof THEMES[0]; notes: typeof notes; blockers: number; people: Record<string, boolean> }> = {};
    const unmatched: typeof notes = [];

    notes.forEach((n) => {
      const hit = classifyNote(n.text);
      if (!hit) {
        unmatched.push(n);
        return;
      }
      const b = buckets[hit.theme.id] || (buckets[hit.theme.id] = { theme: hit.theme, notes: [], blockers: 0, people: {} });
      b.notes.push(n);
      b.people[n.participant] = true;
      if (BLOCKERS.test(n.text)) b.blockers++;
    });

    const themes = Object.keys(buckets).map((k) => {
      const b = buckets[k];
      const people = Object.keys(b.people);
      const score = 2 * b.blockers + 1.5 * b.notes.length + people.length;
      const roundedScore = Math.round(score * 10) / 10;
      const severity = score >= 14 ? "critical" : score >= 9 ? "major" : "minor";
      return {
        theme: b.theme,
        notes: b.notes,
        blockers: b.blockers,
        people,
        score: roundedScore,
        severity,
      };
    }).sort((a, b) => b.score - a.score);

    const participants = new Set(notes.map((n) => n.participant)).size;
    return { notes, themes, unmatched, participants };
  }, [notesInput]);

  /* Prompts Generation */
  const layoutPromptText = useMemo(() => {
    return [
      "You are a senior product designer running a layout exploration. Describe structure precisely.",
      "",
      "## Context",
      `Screen: ${lScreen}`,
      `Primary job: ${lJob}`,
      `User and situation: ${lWho}`,
      `Constraints: ${lCons}`,
      `Known problems this must solve: ${lProbs}`,
      "",
      "## Task",
      `Propose ${lCount} genuinely different layout directions with names, block-level structures, fold details, and problem solutions.`,
      "",
      "## Rules",
      "- Respect every hard constraint. Use real labels and times."
    ].join("\n");
  }, [lScreen, lJob, lWho, lCons, lProbs, lCount]);

  const copyPromptText = useMemo(() => {
    return [
      "You are a UX writer for a public transport service.",
      "",
      "## Element",
      cKind,
      "",
      "## Ground truth",
      cWhat,
      "",
      `User's goal: ${cGoal}`,
      `Available next steps: ${cNext}`,
      `Voice: ${cVoice}`,
      `Limits: ${cLimits}`,
      "",
      "## Task",
      "Write 3 options with headings, body, and action buttons. State facts clearly, active voice."
    ].join("\n");
  }, [cKind, cWhat, cGoal, cNext, cVoice, cLimits]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const toggleExpand = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const criticalCount = triageResult.themes.filter((t) => t.severity === "critical").length;

  /* Sticky Note Color Palette Mapper */
  const getStickyColor = (severity: string, index: number) => {
    return { bg: "bg-[#FDC770]", border: "border-[#DDA24A]", text: "text-[#1E1402]" };
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col md:flex-row text-[#FFFFFF] font-sans selection:bg-[#FFFFFF] selection:text-[#000000]">
      
      {/* FIXED LEFT SIDEBAR: INPUT & TRANSCRIPT UPLOAD PANEL */}
      <aside className="w-full md:w-96 bg-[#000000] border-r border-[#262626] p-6 flex flex-col gap-4 shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <div className="flex items-center gap-2 font-sans font-bold text-[#FFFFFF] text-lg">
            <PanelLeft className="w-5 h-5 text-[#FFFFFF]" />
            Input & Upload
          </div>
        </div>

        {/* Upload Files Card */}
        <div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className="group border border-[#262626] rounded-2xl p-6 text-center bg-[#000000] hover:border-[#404040] transition-all cursor-pointer shadow-none"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".vtt,.srt,.txt,.json,.csv,.xlsx"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />

            {/* Zoom | Teams Brand Logos Graphic */}
            <div className="flex justify-center mb-4 relative py-2">
              <div className="w-20 h-14 bg-[#141414] border border-[#262626] rounded-xl absolute -rotate-6 top-1 transform translate-x-[-6px] opacity-60" />
              <div className="w-28 h-14 bg-[#000000] border border-[#333333] rounded-xl flex items-center justify-center gap-2 px-2.5 relative z-10">
                {/* Zoom Logo */}
                <span className="font-black text-[#2D8CFF] text-sm tracking-tighter font-sans">zoom</span>

                {/* Vertical Divider Line | */}
                <div className="w-[1.5px] h-6 bg-[#404040]" />

                {/* MS Teams Official Logo Icon */}
                <div className="flex items-center shrink-0">
                  <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="17" cy="5.5" r="3" fill="#7B83EB"/>
                    <circle cx="24" cy="8.5" r="2.5" fill="#5B5FC7"/>
                    <path d="M12.5 10H21.5C22.6 10 23.5 10.9 23.5 12V18.5H12.5V10Z" fill="#7B83EB"/>
                    <path d="M21 12.5H27C27.8 12.5 28.5 13.2 28.5 14V19.5H21V12.5Z" fill="#5B5FC7"/>
                    <path d="M3 5.5L14 4V28L3 26.5V5.5Z" fill="#5B5FC7"/>
                    <text x="8.5" y="19" fontFamily="sans-serif" fontWeight="bold" fontSize="11" fill="white" textAnchor="middle">T</text>
                  </svg>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-[#FFFFFF] text-base tracking-tight">Upload Files</h3>
            <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
              Drag and drop your files here, or{" "}
              <span className="text-[#38BDF8] font-medium hover:underline">click to select</span>.
            </p>
            <p className="text-[11px] text-[#737373] mt-1 font-normal">
              Supported formats: .vtt, .srt, .txt, .csv, .xlsx
            </p>

            {uploadStatus && (
              <Badge variant="minor" className="mt-3 text-emerald-300 bg-[#000000] border border-emerald-800/60 text-[10px]">
                {uploadStatus}
              </Badge>
            )}
          </div>
        </div>

        {/* Raw Notes Area */}
        <div className="flex-1 flex flex-col gap-1.5 min-h-[260px]">
          <div className="flex justify-between items-center">
            <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold">Raw Notes</label>
            <span className="font-mono text-[10px] text-[#737373]">P1 | note</span>
          </div>
          <Textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="flex-1 font-mono text-xs leading-relaxed bg-[#000000] border-[#262626] text-[#FFFFFF] focus-visible:ring-[#525252] resize-y min-h-[220px]"
            placeholder="Paste session notes or upload transcript..."
          />
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#262626]">
          <Button className="w-full bg-[#FFFFFF] text-[#000000] hover:bg-[#E5E5E5] font-bold shadow-none cursor-pointer">
            Summarize
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setNotesInput(parseTranscriptText(SAMPLE_ZOOM_VTT))} className="text-xs bg-[#000000] border-[#262626] text-[#D4D4D4] hover:bg-[#1A1A1A]">
              <FileCode className="w-3.5 h-3.5 mr-1 text-[#A3A3A3]" /> Test .VTT
            </Button>
            <Button variant="outline" size="sm" onClick={() => setNotesInput(SAMPLE_NOTES)} className="text-xs bg-[#000000] border-[#262626] text-[#D4D4D4] hover:bg-[#1A1A1A]">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sample
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotesInput("")} className="text-[#737373] text-xs hover:text-rose-400 hover:bg-[#000000]">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Notes
          </Button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto bg-[#000000]">
        {/* Top Header Masthead */}
        <header className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#262626]">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-[#FFFFFF]">
              Turn 20 messy usability notes into a ranked fix list
            </h1>
            <p className="text-[#A3A3A3] max-w-2xl mt-2 text-base">
              A companion for reading session notes from moderated tests, spotting patterns, and deciding what to fix on Monday.
            </p>
          </div>
        </header>

        {/* Navigation Row with Capsule Tabs & Outside Export CTA */}
        <div className="my-6 flex flex-wrap items-center justify-between gap-4">
          {/* Floating Capsule Navigation Bar (Only Tabs inside) */}
          <nav className="relative inline-flex items-center gap-1 p-1.5 bg-[#141417] border border-[#27272A] rounded-full shadow-lg">
            {[
              { id: "triage", label: "Summarize" },
              { id: "layout", label: "Brainstorm" },
              { id: "copy", label: "UI Copy" },
              { id: "about", label: "Method" },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 px-5 py-2 rounded-full font-sans text-xs transition-colors duration-200 cursor-pointer ${
                    active
                      ? "text-[#000000] font-extrabold"
                      : "text-neutral-400 font-medium hover:text-white font-medium"
                  }`}
                >
                  {/* Framer Motion Active Tab Smooth Sliding White Pill */}
                  {active && (
                    <motion.div
                      layoutId="activeTabSelection"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 z-[-1] rounded-full bg-gradient-to-b from-[#FFFFFF] via-[#F1F5F9] to-[#E2E8F0] border border-white shadow-sm"
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Standalone Export JSON CTA outside the tab bar */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(JSON.stringify(triageResult, null, 2), "triage")}
            className="bg-[#141417] border-[#27272A] text-[#FFFFFF] hover:bg-[#27272A] rounded-full px-5 py-2 text-xs font-semibold shadow-md cursor-pointer flex items-center gap-1.5"
          >
            {copied === "triage" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exported JSON</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Export JSON</span>
              </>
            )}
          </Button>
        </div>

        {/* TRIAGE RESULTS PANEL — CLEAN STICKY NOTE BOARD */}
        {activeTab === "triage" && (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4 text-center border-[#262626] bg-[#000000]">
                <div className="text-3xl font-mono font-bold text-[#FFFFFF]">{triageResult.notes.length}</div>
                <div className="text-[10px] font-mono uppercase text-[#A3A3A3] tracking-wider mt-1">Notes Read</div>
              </Card>
              <Card className="p-4 text-center border-[#262626] bg-[#000000]">
                <div className="text-3xl font-mono font-bold text-[#FFFFFF]">{triageResult.participants}</div>
                <div className="text-[10px] font-mono uppercase text-[#A3A3A3] tracking-wider mt-1">Participants</div>
              </Card>
              <Card className="p-4 text-center border-[#262626] bg-[#000000]">
                <div className="text-3xl font-mono font-bold text-[#FFFFFF]">{triageResult.themes.length}</div>
                <div className="text-[10px] font-mono uppercase text-[#A3A3A3] tracking-wider mt-1">Themes Found</div>
              </Card>
              <Card className="p-4 text-center border-rose-900/60 bg-[#000000]">
                <div className="text-3xl font-mono font-bold text-rose-400">{criticalCount}</div>
                <div className="text-[10px] font-mono uppercase text-rose-400/90 tracking-wider font-semibold mt-1">Critical</div>
              </Card>
            </div>

            {/* STICKY NOTES CANVAS GRID (Ref: Docket App Design) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
              {triageResult.themes.map((t, index) => {
                const style = getStickyColor(t.severity, index);
                const isExpanded = expandedNotes[t.theme.id];

                return (
                  <div
                    key={t.theme.id}
                    className={`relative p-6 rounded-[28px] border ${style.bg} ${style.border} ${style.text} flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:shadow-xl hover:scale-[1.01]`}
                  >
                    {/* Note Content */}
                    <div className="flex-1">
                      <h3 className="font-sans font-bold text-lg leading-tight tracking-tight mt-1">
                        {t.theme.name}
                      </h3>
                      <p className="text-[11px] font-mono uppercase tracking-wider font-bold opacity-75 mt-2">
                        {t.theme.heuristic}
                      </p>

                      {/* Permanently Expanded Content Section */}
                      <div className="mt-4 pt-4 border-t border-black/10 space-y-4">
                        {/* Recommended Fixes */}
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase opacity-80 mb-2">Recommended Fixes</div>
                          <ul className="space-y-1.5 text-xs font-medium">
                            {t.theme.fixes.map((f, idx) => (
                              <li key={idx} className="flex gap-2 items-start bg-black/5 p-2 rounded-lg">
                                <span className="font-bold">✓</span>
                                <span>{f.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Evidence Quotes */}
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase opacity-80 mb-2">Verbatim Quotes</div>
                          <div className="space-y-2">
                            {t.notes.slice(0, 2).map((n, idx) => (
                              <blockquote key={idx} className="text-xs bg-black/5 p-2.5 rounded-lg border-l-4 border-black/40 italic">
                                "{n.text}" <span className="block text-[9px] font-mono font-bold opacity-75 mt-1">— {n.participant}</span>
                              </blockquote>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Metadata */}
                    <div className="flex justify-between items-center mt-6 pt-3 border-t border-black/10 font-mono text-[10px] font-bold opacity-80">
                      <div>
                        {t.notes.length} NOTES · {t.people.length} PEOPLE
                      </div>
                      <Badge variant="outline" className="bg-[#000000] text-white border-black font-mono text-[10px] uppercase font-bold">
                        {t.severity}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LAYOUT PANEL */}
        {activeTab === "layout" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4 bg-[#000000] p-6 border border-[#262626] rounded-xl shadow-none">
              <h2 className="text-lg font-sans font-bold text-[#FFFFFF]">Layout Exploration Brief</h2>
              <div>
                <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold mb-1 block">Screen or Flow</label>
                <Input value={lScreen} onChange={(e) => setLScreen(e.target.value)} className="bg-[#000000] border-[#262626] text-[#FFFFFF]" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold mb-1 block">Primary Job</label>
                <Input value={lJob} onChange={(e) => setLJob(e.target.value)} className="bg-[#000000] border-[#262626] text-[#FFFFFF]" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold mb-1 block">User & Situation</label>
                <Input value={lWho} onChange={(e) => setLWho(e.target.value)} className="bg-[#000000] border-[#262626] text-[#FFFFFF]" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold mb-1 block">Hard Constraints</label>
                <Textarea value={lCons} onChange={(e) => setLCons(e.target.value)} className="bg-[#000000] border-[#262626] text-[#FFFFFF]" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold mb-1 block">Known Problems</label>
                <Textarea value={lProbs} onChange={(e) => setLProbs(e.target.value)} className="bg-[#000000] border-[#262626] text-[#FFFFFF]" />
              </div>
            </div>
            <div className="lg:col-span-6 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-sans font-bold text-[#FFFFFF]">Generated Wireframe Prompt</h2>
                <Button size="sm" onClick={() => handleCopy(layoutPromptText, "layout")} className="bg-[#000000] border border-[#262626] text-[#D4D4D4]">
                  {copied === "layout" ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy Prompt
                </Button>
              </div>
              <pre className="p-5 bg-[#000000] border border-[#262626] rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-none text-[#D4D4D4]">
                {layoutPromptText}
              </pre>
            </div>
          </div>
        )}

        {/* COPY PANEL */}
        {activeTab === "copy" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4 bg-[#000000] p-6 border border-[#262626] rounded-xl shadow-none">
              <h2 className="text-lg font-sans font-bold text-[#FFFFFF]">UX Copy Brief</h2>
              <div>
                <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold mb-1 block">Element</label>
                <Input value={cKind} onChange={(e) => setCKind(e.target.value)} className="bg-[#000000] border-[#262626] text-[#FFFFFF]" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold mb-1 block">Ground Truth</label>
                <Textarea value={cWhat} onChange={(e) => setCWhat(e.target.value)} className="bg-[#000000] border-[#262626] text-[#FFFFFF]" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold mb-1 block">User Goal</label>
                <Input value={cGoal} onChange={(e) => setCGoal(e.target.value)} className="bg-[#000000] border-[#262626] text-[#FFFFFF]" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-[#A3A3A3] font-semibold mb-1 block">Available Next Steps</label>
                <Input value={cNext} onChange={(e) => setCNext(e.target.value)} className="bg-[#000000] border-[#262626] text-[#FFFFFF]" />
              </div>
            </div>
            <div className="lg:col-span-6 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-sans font-bold text-[#FFFFFF]">Generated Copy Prompt</h2>
                <Button size="sm" onClick={() => handleCopy(copyPromptText, "copy")} className="bg-[#000000] border border-[#262626] text-[#D4D4D4]">
                  {copied === "copy" ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy Prompt
                </Button>
              </div>
              <pre className="p-5 bg-[#000000] border border-[#262626] rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-none text-[#D4D4D4]">
                {copyPromptText}
              </pre>
            </div>
          </div>
        )}

        {/* ABOUT PANEL */}
        {activeTab === "about" && (
          <div className="max-w-3xl space-y-6 text-sm leading-relaxed text-[#D4D4D4] bg-[#000000] p-8 border border-[#262626] rounded-xl shadow-none">
            <h2 className="text-2xl font-sans font-bold text-[#FFFFFF]">About Design Companion</h2>
            <p>
              Design Companion is a self-contained research tool combining a transparent usability triage engine with structured prompt builders for wireframes and UX copy.
            </p>
            <div className="p-4 bg-[#000000] border border-[#262626] rounded-xl font-mono text-xs space-y-1.5 text-[#D4D4D4]">
              <div className="font-bold text-[#FFFFFF]">Severity Scoring Rule:</div>
              <div>Severity = (2 × Task-Blocking Phrases) + (1.5 × Notes) + Participant Spread</div>
              <div className="text-[#A3A3A3]">Critical ≥ 14 · Major ≥ 9 · Minor &lt; 9</div>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-[#262626] text-xs font-mono text-[#737373] flex justify-between">
          <span>Design Companion · Pure #000000 Pitch Black Theme</span>
          <span>Shadcn UI v4.15</span>
        </footer>
      </main>
    </div>
  );
}

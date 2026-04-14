"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, Send } from "lucide-react";

interface Props { to: string; contactName: string; }

export default function EmailModal({ to, contactName }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Subject and message are required.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Email sent", description: `Sent to ${to}` });
      setSubject(""); setBody(""); setOpen(false);
    } catch {
      toast({ title: "Failed to send email.", variant: "destructive" });
    } finally { setSending(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-7 px-3 text-[12px] border border-[#e5e5e5] rounded-md bg-white hover:bg-[#f5f5f5] transition-colors flex items-center gap-1.5 text-[#444]">
          <Mail className="w-3.5 h-3.5" /> Email
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Email {contactName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <label className="text-[12px] text-[#666] block mb-1">To</label>
            <input value={to} disabled className="w-full h-8 text-[13px] border border-[#e5e5e5] rounded-md px-2.5 bg-[#f9f9f9] text-[#888]" />
          </div>
          <div>
            <label className="text-[12px] text-[#666] block mb-1">Subject</label>
            <input
              className="w-full h-8 text-[13px] border border-[#e5e5e5] rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-black/20"
              placeholder="Your booking update"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[12px] text-[#666] block mb-1">Message</label>
            <textarea
              className="w-full text-[13px] border border-[#e5e5e5] rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]"
              placeholder="Write your message..."
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <button onClick={() => setOpen(false)} disabled={sending} className="h-8 px-3 text-[13px] border border-[#e5e5e5] rounded-md hover:bg-[#f5f5f5] transition-colors">
            Cancel
          </button>
          <button onClick={send} disabled={sending} className="h-8 px-4 text-[13px] bg-black text-white rounded-md hover:bg-[#222] disabled:opacity-60 flex items-center gap-1.5">
            {sending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending</> : <><Send className="w-3.5 h-3.5" /> Send</>}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

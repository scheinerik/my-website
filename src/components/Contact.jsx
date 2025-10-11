import { useState } from "react";
export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setStatus("Sending...");
    try {
      const res = await fetch("/send-email", { // or "/api/send-email"
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setStatus(res.ok ? "Sent ✅" : "Failed ❌");
      if (res.ok) setFormData({ name: "", email: "", message: "" });
    } catch { setStatus("Error ❌"); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required />
      <input type="email" name="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} required />
      <textarea name="message" value={formData.message} onChange={e=>setFormData({...formData, message:e.target.value})} required />
      <button>Send</button>
      <p>{status}</p>
    </form>
  );
}
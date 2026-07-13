/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, Droplets, Loader2, Bot, Image, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
  image_url?: string;
}

export function WaterChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hello! I am AquaBot, your AI Water Intelligence guide. 💧\n\nI can answer questions about water safety, purification, and analyze water samples directly here!\n- **Analyze water samples**: Click the 📷 image icon below to upload a photo of your tap water for automatic safety diagnostics.\n- **Search tap water quality** by country & city on our main dashboard.\n- **View 10-year safety trends** on the interactive map.\n- **Read or report alerts** in the community feed.\n\nHow can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert("Please select a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      const previewUrl = URL.createObjectURL(file);
      setAttachedImage({
        base64,
        mimeType: file.type,
        previewUrl
      });
    };
    reader.readAsDataURL(file);

    // Reset input value so same image can be reselected if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMessage = input.trim();
    const currentImage = attachedImage;

    setInput('');
    setAttachedImage(null);
    
    // Add user message to state
    const newUserMessage: Message = {
      role: 'user',
      text: userMessage || "Analyzed water sample photo",
      image_url: currentImage?.previewUrl
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      if (currentImage) {
        // Handle image analysis directly inside chatbot using /api/analyze
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: currentImage.base64,
            mimeType: currentImage.mimeType,
          }),
        });

        const data = await response.json();
        if (data.success && data.data) {
          const result = data.data;
          const replyText = `**Analysis Report for Your Image:**\n\n- **Verdict:** ${result.verdict}\n- **Safety Score:** ${result.score}/10\n- **Color Detected:** ${result.color_detected}\n- **Likely Contaminants:** ${result.likely_contaminants.join(', ') || 'None detected'}\n- **Health Risks:** ${result.health_risks.join(', ') || 'None detected'}\n- **Recommendation:** ${result.recommendation}`;
          
          setMessages((prev) => [...prev, { role: 'model', text: replyText }]);
        } else {
          setMessages((prev) => [
            ...prev,
            { 
              role: 'model', 
              text: "Sorry, I encountered an error analyzing your water image: " + (data.error || "Please try again with a clear, well-lit picture of a glass of water.") 
            }
          ]);
        }
      } else {
        // Send message and previous history
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            history: messages.slice(1).map(m => ({ role: m.role, text: m.text }))
          }),
        });

        const data = await response.json();
        if (data.success && data.reply) {
          setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }
          ]);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: "An error occurred. Please check your internet connection and try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      let trimmed = line.trim();
      
      // Handle and clean up markdown headings starting with hashtags (e.g. ### Hello)
      let headingLevel = 0;
      if (trimmed.startsWith('#')) {
        let temp = trimmed;
        while (temp.startsWith('#')) {
          headingLevel++;
          temp = temp.substring(1);
        }
        trimmed = temp.trim();
      }

      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
      if (isBullet) {
        trimmed = trimmed.substring(2);
      }

      // Parse bold text
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      const content = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx} className="font-extrabold text-blue-950">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (headingLevel > 0) {
        const sizeClass = headingLevel === 1 
          ? "text-sm font-black text-blue-950 mt-3 mb-1" 
          : headingLevel === 2 
            ? "text-xs font-black text-blue-950 mt-2.5 mb-1" 
            : "text-xs font-bold text-blue-900 mt-2 mb-1";
        return (
          <h4 key={lineIdx} className={`${sizeClass} leading-snug`}>
            {content}
          </h4>
        );
      }

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex gap-1.5 ml-1 mt-1 pl-1.5 border-l-2 border-blue-200 text-slate-700">
            <span className="text-blue-500 font-bold">•</span>
            <span className="flex-1">{content}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} className={lineIdx > 0 ? "mt-1.5" : ""}>
          {content}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end" id="water-chatbot-widget">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 sm:absolute sm:inset-auto sm:bottom-20 sm:right-0 sm:w-[380px] sm:h-[580px] sm:max-h-[calc(100vh-8rem)] rounded-none sm:rounded-3xl bg-white border-0 sm:border border-blue-100 shadow-2xl flex flex-col overflow-hidden mb-0 sm:mb-4 z-[60] sm:z-auto"
            id="chatbot-window"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 text-white p-4 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1">
                    <span>AquaBot</span>
                    <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-medium">AI</span>
                  </h3>
                  <p className="text-[10px] text-blue-100 font-mono">Water Safety Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white cursor-pointer"
                id="close-chatbot-btn"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" id="chatbot-messages">
              {messages.map((msg, index) => {
                const isBot = msg.role === 'model';
                return (
                  <div
                    key={index}
                    className={`flex gap-2.5 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    {isBot && (
                      <div className="relative h-8 w-8 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-200/80">
                          <Droplets className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 bg-amber-400 text-white rounded-full p-0.5 shadow-md">
                          <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5 w-full">
                      {msg.image_url && (
                        <div className="relative mt-1 mb-0.5 rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm max-w-xs self-end">
                          <img 
                            src={msg.image_url} 
                            alt="Uploaded water sample" 
                            className="max-h-36 object-cover" 
                          />
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isBot
                            ? 'bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none'
                            : 'bg-blue-600 text-white shadow-sm shadow-blue-100/50 rounded-tr-none'
                        }`}
                      >
                        {isBot ? renderMessageText(msg.text) : msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-2.5 mr-auto max-w-[85%]">
                  <div className="relative h-8 w-8 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-200/80">
                      <Droplets className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 bg-amber-400 text-white rounded-full p-0.5 shadow-md">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span>Analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached image preview area */}
            {attachedImage && (
              <div className="px-3 py-2 bg-slate-100 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs shrink-0 animate-fade-in">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img src={attachedImage.previewUrl} alt="Attached preview" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                  <span className="text-slate-500 truncate font-mono text-[10px]">Water sample photo ready</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (attachedImage.previewUrl) URL.revokeObjectURL(attachedImage.previewUrl);
                    setAttachedImage(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/50 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Footer Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
                id="chatbot-image-file-input"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={isLoading}
                className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                title="Attach photo of water sample"
                id="chatbot-attach-btn"
              >
                <Image className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={attachedImage ? "Add comments or hit Send..." : "Ask AquaBot..."}
                disabled={isLoading}
                className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 text-base sm:text-xs focus:outline-none focus:border-blue-500 text-slate-800 transition-colors disabled:opacity-50 font-sans"
                id="chatbot-input-field"
              />
              <button
                type="submit"
                disabled={(!input.trim() && !attachedImage) || isLoading}
                className="h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-300 flex items-center justify-center transition-colors shadow-md shadow-blue-100 disabled:shadow-none cursor-pointer"
                id="chatbot-send-btn"
                aria-label="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-500 text-white flex items-center justify-center shadow-2xl hover:shadow-blue-300/50 transition-shadow relative cursor-pointer"
        id="chatbot-toggle-button"
        aria-label="Toggle Chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

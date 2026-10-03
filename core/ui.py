import tkinter as tk
import threading
import asyncio
import queue
import logging
from queue import Empty
import time

logger = logging.getLogger("VANI-UI")

class VaniUI:
    """
    GPT Voice Mode style UI for VANI using Tkinter.
    Provides a dark mode floating window with a pulsing status orb.
    """
    def __init__(self, command_queue: queue.Queue):
        self.root = tk.Tk()
        self.root.title("VANI Interface")
        
        # Make the window floating, transparent, and un-resizable
        self.root.geometry("300x400")
        self.root.configure(bg="#121212")
        self.root.attributes("-alpha", 0.95)
        self.root.attributes("-topmost", True)
        
        # Command Queue from Main Thread
        self.command_queue = command_queue
        
        # UI Elements
        self.status_label = tk.Label(self.root, text="Initializing...", fg="#888888", bg="#121212", font=("Helvetica", 12))
        self.status_label.pack(pady=20)
        
        self.canvas = tk.Canvas(self.root, width=150, height=150, bg="#121212", highlightthickness=0)
        self.canvas.pack(pady=30)
        
        # Draw the initial orb
        self.orb = self.canvas.create_oval(25, 25, 125, 125, fill="#333333", outline="#555555")
        
        self.transcript_label = tk.Label(self.root, text="", fg="#FFFFFF", bg="#121212", font=("Helvetica", 14, "italic"), wraplength=260)
        self.transcript_label.pack(pady=20, fill=tk.BOTH, expand=True)

        # Pulse animation state
        self.pulse_size = 0
        self.pulse_dir = 1
        self.is_listening = False
        self.is_speaking = False
        
        # Start the queue checker and animation loop
        self.root.after(100, self.check_queue)
        self.root.after(50, self.animate_orb)

    def set_state(self, state: str, text: str = ""):
        """Update the UI state visually."""
        if state == "idle":
            self.status_label.config(text="Listening for wake word...", fg="#888888")
            self.canvas.itemconfig(self.orb, fill="#333333", outline="#555555")
            self.is_listening = False
            self.is_speaking = False
            if text:
                self.transcript_label.config(text=text)
                
        elif state == "listening":
            self.status_label.config(text="Listening...", fg="#00FFaa")
            self.canvas.itemconfig(self.orb, fill="#00AA55", outline="#00FFaa")
            self.is_listening = True
            self.is_speaking = False
            self.transcript_label.config(text="")
            
        elif state == "processing":
            self.status_label.config(text="Processing...", fg="#00aaff")
            self.canvas.itemconfig(self.orb, fill="#0055AA", outline="#00aaff")
            self.is_listening = False
            self.is_speaking = False
            if text:
                 self.transcript_label.config(text=f'"{text}"')
                 
        elif state == "speaking":
            self.status_label.config(text="Speaking...", fg="#ffaa00")
            self.canvas.itemconfig(self.orb, fill="#AA5500", outline="#ffaa00")
            self.is_listening = False
            self.is_speaking = True
            if text:
                 self.transcript_label.config(text=text)
                 
        elif state == "error":
             self.status_label.config(text="Error", fg="#ff0000")
             self.canvas.itemconfig(self.orb, fill="#AA0000", outline="#ff0000")
             self.is_listening = False
             self.is_speaking = False
             if text:
                 self.transcript_label.config(text=text)

    def animate_orb(self):
        """Creates a pulsing breathing effect based on state."""
        base_size = 50
        max_pulse = 0
        
        if self.is_listening:
             max_pulse = 10
        elif self.is_speaking:
             max_pulse = 20
             
        if max_pulse > 0:
            self.pulse_size += self.pulse_dir * 2
            if self.pulse_size >= max_pulse:
                self.pulse_dir = -1
            elif self.pulse_size <= 0:
                self.pulse_dir = 1
        else:
            # Smoothly return to 0 if idle
            if self.pulse_size > 0:
                 self.pulse_size -= 1
                 
        # Redraw
        center = 75
        r = base_size + self.pulse_size
        self.canvas.coords(self.orb, center - r, center - r, center + r, center + r)
        
        self.root.after(50, self.animate_orb)

    def check_queue(self):
        """Checks for incoming messages from the main engine thread."""
        try:
            while True: # Process all available messages
                msg = self.command_queue.get_nowait()
                msg_type = msg.get("type")
                
                if msg_type == "state":
                     self.set_state(msg.get("state"), msg.get("text", ""))
                     
        except Empty:
            pass
            
        self.root.after(100, self.check_queue)

    def run(self):
        self.set_state("idle")
        self.root.mainloop()

def start_ui_thread(ui_queue: queue.Queue):
    """Entry point for the UI thread."""
    ui = VaniUI(ui_queue)
    ui.run()

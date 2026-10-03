import os, re
path = r'c:\Users\youri\OneDrive\Desktop\vani\main.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

def replacer(m):
    state = m.group(1)
    text_group = m.group(2)
    if text_group:
        return f'self.set_state({state}, {text_group})'
    else:
        return f'self.set_state({state})'

new_text = re.sub(r'self\.ui_queue\.put\(\{"type":\s*"state",\s*"state":\s*([^,]+)(?:,\s*"text":\s*([^\}]+))?\}\)', replacer, text)

method = '''    def set_state(self, state, text=""):
        self.ui_queue.put({"type": "state", "state": state, "text": text})
        
        import json
        import asyncio
        orb_state = "IDLE"
        if state == "listening": orb_state = "LISTENING"
        elif state == "processing": orb_state = "THINKING"
        elif state in ["speaking", "executing"]: orb_state = "EXECUTING"
        elif state == "error": orb_state = "IDLE"
        
        payload = json.dumps({
            "type": "STATE_CHANGE",
            "payload": {"orbState": orb_state, "text": text}
        })
        
        async def broadcast():
            for ws in list(active_websockets):
                try:
                    await ws.send_text(payload)
                except Exception:
                    pass
                    
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(broadcast())
        except RuntimeError:
            pass

    def start(self):'''

new_text = new_text.replace('    def start(self):', method)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_text)
print('Replaced correctly')

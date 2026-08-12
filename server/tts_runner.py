import socket
# Форсируем использование IPv4 для предотвращения зависания DNS-резолвинга на macOS (экономит ~14 секунд при первом запросе)
orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4_only

import asyncio
import sys
import edge_tts

async def main():
    if len(sys.argv) < 4:
        print("Usage: python3 tts_runner.py <voice> <text> <output_path> [rate]")
        sys.exit(1)
        
    voice = sys.argv[1]
    text = sys.argv[2]
    output_path = sys.argv[3]
    rate = sys.argv[4] if len(sys.argv) > 4 else "+0%"
    
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(output_path)

if __name__ == "__main__":
    asyncio.run(main())

import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { BaseUrlHub } from '../../../api/apiservice';

export default function RealSshTerminal(sites) {
    const site = sites.siteId;

    const terminalRef = useRef(null);
    const wsRef = useRef(null);
    const termRef = useRef(null);

    useEffect(() => {
        if (!site || !site.endpoint || !site.sshUser) {
            return;
        }

        const term = new Terminal({
            cursorBlink: true,
            theme: { background: '#0f172a', foreground: '#f8fafc' },
            fontFamily: 'Fira Code, monospace',
            fontSize: 14,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();
        termRef.current = term;

        connectToDotnetProxy(site, term);

        const dataListener = term.onData((data) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(data);
            }
        });

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            dataListener.dispose();
            window.removeEventListener('resize', handleResize);
            if (wsRef.current) wsRef.current.close();
            term.dispose();
        };
    }, [site]);

    const connectToDotnetProxy = (siteData, term) => {
        const host = siteData.endpoint;
        const user = siteData.sshUser;
        const pass = siteData.password || '';
        const port = siteData.sshPort || '22';

        term.write(`\x1b[33m[+] Auto-connecting to ${user}@${host}:${port} (${siteData.name || 'Site'})...\x1b[0m\r\n`);

        const wsUrl = `ws://${BaseUrlHub}/ws/ssh?host=${encodeURIComponent(host)}&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&port=${encodeURIComponent(port)}`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            term.write(`\x1b[32m[+] Connected to Proxy. Initiating SSH session...\x1b[0m\r\n\r\n`);
        };

        ws.onmessage = (event) => {
            term.write(event.data);
        };

        ws.onerror = () => {
            term.write('\r\n\x1b[31m[-] WebSocket / SSH Connection Error.\x1b[0m\r\n');
        };

        ws.onclose = () => {
            term.write('\r\n\x1b[31m[-] Connection closed.\x1b[0m\r\n');
        };
    };

    return (
        /* Ditambahkan kelas `relative overflow-hidden` agar floating button & modal terkunci di area terminal */
        <div className="p-4 bg-slate-950 rounded-lg relative overflow-hidden">
            <div className="flex justify-between items-center mb-2 text-xs text-slate-400 font-mono">
                <span>Target: <strong className="text-emerald-400">{site?.sshUser}@{site?.endpoint}:{site?.sshPort || 22}</strong></span>
                <span>Site: <strong className="text-sky-400">{site?.name}</strong></span>
            </div>
            <div className="h-[500px] w-full" ref={terminalRef} />
        </div>
    );
}
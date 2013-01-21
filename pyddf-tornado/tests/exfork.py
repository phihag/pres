#!/usr/bin/env python

import socket
import sys
import time

def httpserv(conn):
    buf = b''
    while b'\r\n\r\n' not in buf:
        b = conn.recv(1024)
        if not b:
            break
        buf += b
    conn.send(b'HTTP/1.0 200 OK\r\n\r\nThank you.')
    conn.close()
    time.sleep(100)

def handleConn(conn):
    httpserv(conn)

import threading
def handleConn(conn):
    threading.Thread(target=httpserv, args=(conn,)).start()

s = socket.socket()
s.bind(('', int(sys.argv[1])))
s.listen(1)
while True:
    conn,addr = s.accept()
    handleConn(conn)

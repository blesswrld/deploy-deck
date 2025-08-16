"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Получаем URL API из переменных окружения
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) {
            console.error("Socket.IO: API URL is not configured.");
            return;
        }

        if (token) {
            const newSocket = io(API_URL, {
                // <-- ИСПОЛЬЗУЕМ ПЕРЕМЕННУЮ
                auth: {
                    token: token,
                },
            });

            newSocket.on("connect", () => {
                console.log("Socket.IO connected!", newSocket.id);
            });

            newSocket.on("disconnect", () => {
                console.log("Socket.IO disconnected.");
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [token]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

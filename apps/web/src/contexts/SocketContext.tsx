"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext"; // Нам нужен токен для аутентификации

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Устанавливаем соединение, только если есть токен
        if (token) {
            const newSocket = io("http://localhost:3002", {
                // URL нашего NestJS API
                auth: {
                    token: token, // Передаем JWT для аутентификации на бэкенде
                },
            });

            newSocket.on("connect", () => {
                console.log("Socket.IO connected!", newSocket.id);
            });

            newSocket.on("disconnect", () => {
                console.log("Socket.IO disconnected.");
            });

            setSocket(newSocket);

            // Очистка при размонтировании или смене токена
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

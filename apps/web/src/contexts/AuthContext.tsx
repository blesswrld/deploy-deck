"use client"; // Это клиентский компонент, так как он использует хуки и localStorage

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

// Определяем типы для данных, которые будет хранить контекст
interface AuthContextType {
    token: string | null;
    setToken: (token: string | null) => void;
    isLoading: boolean;
}

// Создаем сам контекст с начальным значением undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Создаем провайдер - компонент, который будет "оборачивать" наше приложение
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setTokenState] = useState<string | null>(null);
    // isLoading нужен, чтобы избежать "моргания" интерфейса при первой загрузке
    const [isLoading, setIsLoading] = useState(true);

    // Этот эффект выполняется один раз при монтировании компонента
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem("authToken");
            if (storedToken) {
                setTokenState(storedToken);
            } else {
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false); // Загрузка завершена
        }
    }, []); // Пустой массив зависимостей означает "выполнить один раз"

    // Функция для установки токена, которая также сохраняет его в localStorage
    const setToken = (newToken: string | null) => {
        setTokenState(newToken);
        if (newToken) {
            localStorage.setItem("authToken", newToken);
        } else {
            localStorage.removeItem("authToken");
        }
    };

    const value = { token, setToken, isLoading };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

// Создаем кастомный хук для удобного доступа к контексту
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

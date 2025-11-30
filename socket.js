import { Server as SocketIOServer } from "socket.io";
let ioInstance = null;
const activeUsers = new Map();
export function initializeSocketServer(server) {
    if (!ioInstance) {
        ioInstance = new SocketIOServer(server, {
        cors: {
            origin: [
                "https://userdashboard-11938.web.app",
                "http://localhost:5173",
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
        });
        ioInstance.on("connection", (socket) => {
            console.log("WebSocket client connected:", socket.id);
       
            socket.on("adminJoin", () => {
                socket.join("admins");
                console.log("Admin joined:", socket.id);        
            
            ioInstance.to(socket.id).emit(
                "presence:update",
                Array.from(activeUsers.values())
                );
            });    

      
            socket.on("presence:ping", (payload) => {
                const { userId, email, username, path } = payload || {};
                if (!userId) return;
                const now = Date.now();
                activeUsers.set(userId, {
                    userId,
                    email,
                    username,
                    path,
                    lastSeen: now,
                });            
                ioInstance.to("admins").emit(
                        "presence:update",
                        Array.from(activeUsers.values())
                    );
            });


        socket.on("disconnect", () => {
            console.log("WebSocket client disconnected:", socket.id);
        });
        });
    }
    return ioInstance;
}

export function getSocketServer() {
    if (!ioInstance) {
        throw new Error("Socket.io server not initialized.");
    }
    return ioInstance;
}
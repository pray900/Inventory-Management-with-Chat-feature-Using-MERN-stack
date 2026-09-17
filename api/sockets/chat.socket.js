const jwt = require('jsonwebtoken');
const configs = require('./../configs');

// socket.id -> { id: userId, name: username } — identity always comes from
// the verified JWT on the handshake, never from client-emitted payloads.
const connectedUsers = new Map();

function usersExcept(socketId) {
    return [...connectedUsers.entries()]
        .filter(([sid]) => sid !== socketId)
        .map(([, user]) => user);
}

function broadcastUsers(io) {
    for (const socketId of connectedUsers.keys()) {
        io.to(socketId).emit('users', usersExcept(socketId));
    }
}

module.exports = function initChatSocket(io) {
    io.use(function (socket, next) {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            socket.user = jwt.verify(token, configs.JWT_SECRET, { algorithms: ['HS256'] });
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', function (socket) {
        connectedUsers.set(socket.id, { id: socket.user._id, name: socket.user.username });
        broadcastUsers(io);

        socket.on('new-message', function (payload) {
            const outgoing = {
                ...payload,
                senderId: socket.user._id,
                senderName: socket.user.username,
                time: Date.now()
            };

            for (const [socketId, user] of connectedUsers.entries()) {
                if (user.id === payload.receiverId) {
                    io.to(socketId).emit('reply-message', outgoing);
                }
            }
            socket.emit('reply-message-own', outgoing);
        });

        socket.on('disconnect', function () {
            connectedUsers.delete(socket.id);
            broadcastUsers(io);
        });
    });
}

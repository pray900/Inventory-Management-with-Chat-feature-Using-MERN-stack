import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { relativeTime } from '../../../utils/dateUtil';
import './Chat.component.css'
import { notify } from './../../../utils/notify'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const defaultMessageBody = {
    senderId: '',
    senderName: '',
    message: '',
    receiverId: '',
    receiverName: '',
    time: ''
}

export const Chat = () => {
    const [msgBody, setMsgBody] = useState({ ...defaultMessageBody });
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            auth: { token: localStorage.getItem('token') }
        })
        socketRef.current = socket;

        // 'reply-message-own' = messages I sent; 'reply-message' = messages sent to me.
        // Tag them so the UI can put mine on the right and theirs on the left.
        socket.on('reply-message-own', (data) => {
            setMessages(prev => [...prev, { ...data, mine: true }])
        })
        socket.on('reply-message', (data) => {
            setMsgBody(prev => ({ ...prev, receiverId: data.senderId }))
            setMessages(prev => [...prev, { ...data, mine: false }])
        })
        socket.on('users', incomingUsers => {
            setUsers(incomingUsers)
        })

        return () => {
            socket.disconnect();
        }
    }, [])

    const handleChange = e => {
        const { name, value } = e.target;
        setMsgBody(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = e => {
        e.preventDefault();
        if (!msgBody.receiverId) {
            return notify.showInfo('please select a user to continue')
        }

        // senderId/senderName/time are stamped authoritatively by the
        // server from the authenticated socket connection — no need to
        // guess them client-side.
        socketRef.current.emit('new-message', msgBody)
        setMsgBody(prev => ({ ...prev, message: '' }))
    }

    const selectUser = user => {
        setMsgBody(prev => ({ ...prev, receiverId: user.id, receiverName: user.name }))
    }

    return (
        <div>
            <h2>Let's Chat</h2>
            <div className="row">
                <div className="col-md-6">
                    <h2>Messages</h2>
                    <section className="msger">
                        <header className="msger-header">
                            <div className="msger-header-title">
                                <i className="fas fa-comment-alt"></i> {msgBody.receiverName ? `Chatting with ${msgBody.receiverName}` : 'Select a user to start chatting'}
                            </div>
                            <div className="msger-header-options">
                                <span><i className="fas fa-cog"></i></span>
                            </div>
                        </header>

                        <main className="msger-chat">
                            {
                                messages.map((message, index) => (
                                    <div key={index} className={`msg ${message.mine ? 'right-msg' : 'left-msg'}`}>
                                        <div className="msg-img"></div>
                                        <div className="msg-bubble">
                                            <div className="msg-info">
                                                <div className="msg-info-name">{message.senderName}</div>
                                                <div className="msg-info-time">{relativeTime(message.time, 'minute')}</div>
                                            </div>
                                            <div className="msg-text">
                                                {message.message}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </main>
                        <form className="msger-inputarea" onSubmit={handleSubmit}>
                            <input type="text" name="message" value={msgBody.message} className="msger-input" placeholder="Enter your message..." onChange={handleChange}></input>
                            <button type="submit" className="msger-send-btn">Send</button>
                        </form>
                    </section>
                </div>
                <div className="col-md-6 scroll-area">
                    <h2>Users</h2>
                    {users.map((user, index) => (
                        <div key={index} className="msg left-msg ">
                            <div className="msg-img"></div>
                            <button
                                className={`btn ${msgBody.receiverId === user.id ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => selectUser(user)}
                            >
                                {user.name}{msgBody.receiverId === user.id ? ' ✓' : ''}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

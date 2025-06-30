#!/usr/bin/env node

// Simple Socket.IO test client
import { io } from 'socket.io-client';

const socket = io('http://localhost:3200', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc1MTI5NzQ1OCwiZXhwIjoxNzUxMjk4MzU4fQ.zERromwN-d_ELYx5KnTNejuydQ66HN5bXnuCYPuKbAk'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log('Socket ID:', socket.id);
  
  // Test real-time messaging
  socket.emit('join_conversation', { conversationId: 1 });
  
  setTimeout(() => {
    socket.emit('send_message', {
      conversationId: 1,
      content: 'Hello from Socket.IO test!',
      messageType: 'TEXT'
    });
  }, 1000);
  
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
  process.exit(1);
});

socket.on('message_received', (data) => {
  console.log('📩 New message received:', data);
});

socket.on('notification_received', (data) => {
  console.log('🔔 Notification received:', data);
});

socket.on('user_status_changed', (data) => {
  console.log('👤 User status changed:', data);
});

console.log('🔌 Connecting to Socket.IO server...');
